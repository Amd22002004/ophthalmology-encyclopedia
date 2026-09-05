import "server-only";

import nodemailer from "nodemailer";
import { getPrisma } from "@/lib/prisma";
import {
  createEmailWorkerId,
  EMAIL_LOCK_LEASE_MS,
  EMAIL_MAX_ATTEMPTS,
  getPendingEmailRecipients,
  getRetryAt,
  getSuccessfulDeliveryState,
  safeEmailError,
} from "@/lib/email/delivery";
import { getApplicantNotificationRecipients, getInternalOrLegacyRecipients } from "@/lib/email/recipients";
import {
  STO_2026_EVENT,
  STO_2026_EVENT_PATH,
  STO_2026_PUBLIC_ORIGIN,
  STO_2026_REGISTER_PATH,
} from "./sto-2026";
import { buildEventIcs } from "./registration-ics";
import { getEventEmailHeaders } from "./registration-sender";

const globalForEventMail = globalThis as unknown as {
  eventMailer?: ReturnType<typeof nodemailer.createTransport>;
  eventMailerUrl?: string;
};

export function getEventMailer() {
  const url = process.env.EVENT_SMTP_URL?.trim() || process.env.COOPERATION_SMTP_URL?.trim() || process.env.APPEAL_SMTP_URL?.trim();
  if (!url) return null;
  if (!globalForEventMail.eventMailer || globalForEventMail.eventMailerUrl !== url) {
    const parsed = new URL(url);
    if (parsed.protocol !== "smtp:" && parsed.protocol !== "smtps:") throw new Error("EVENT_SMTP_URL должен использовать протокол smtp или smtps");
    const secure = parsed.protocol === "smtps:";
    const username = parsed.username ? decodeURIComponent(parsed.username) : "";
    const password = parsed.password ? decodeURIComponent(parsed.password) : "";
    globalForEventMail.eventMailer = nodemailer.createTransport({
      host: parsed.hostname,
      port: parsed.port ? Number.parseInt(parsed.port, 10) : secure ? 465 : 587,
      secure,
      ...(username ? { auth: { user: username, pass: password } } : {}),
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 15_000,
    });
    globalForEventMail.eventMailerUrl = url;
  }
  return globalForEventMail.eventMailer ?? null;
}

export function safeEventEmailError(error: unknown) {
  return safeEmailError(error);
}

function line(label: string, value: string | null | undefined) {
  return value ? `${label}: ${value}` : null;
}

export async function deliverEventRegistrationNotification(notificationId: string, workerId = createEmailWorkerId()) {
  const db = getPrisma();
  if (!db) return { sent: false as const, error: "Database unavailable" };

  const now = new Date();
  const claimed = await db.eventRegistrationNotification.updateMany({
    where: {
      id: notificationId,
      channel: "EMAIL",
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: EMAIL_MAX_ATTEMPTS },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      AND: [{ OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(now.getTime() - EMAIL_LOCK_LEASE_MS) } }] }],
    },
    data: { lockedAt: now, lockedBy: workerId },
  });
  if (claimed.count !== 1) return { sent: false as const, skipped: true as const };

  const notification = await db.eventRegistrationNotification.findUnique({
    where: { id: notificationId },
    include: { registration: { include: { event: true } } },
  });
  if (!notification) return { sent: false as const, error: "Notification not found" };
  if (notification.channel !== "EMAIL") return { sent: false as const, error: "Notification channel mismatch" };

  const registration = notification.registration;
  const recipients = notification.kind === "APPLICANT"
    ? (notification.recipients.length > 0 ? notification.recipients : getApplicantNotificationRecipients(registration.email))
    : getInternalOrLegacyRecipients(notification.recipients, notification.recipient);
  const deliveredRecipients = getSuccessfulDeliveryState([], notification.deliveredRecipients);
  const pendingRecipients = getPendingEmailRecipients(recipients, deliveredRecipients);
  const recipient = recipients.join(",");
  const from = process.env.EVENT_SMTP_FROM?.trim() || process.env.COOPERATION_SMTP_FROM?.trim() || process.env.APPEAL_SMTP_FROM?.trim();
  const attemptedAt = now;
  let mailer: ReturnType<typeof nodemailer.createTransport> | null;
  try {
    mailer = getEventMailer();
  } catch (error) {
    const message = safeEventEmailError(error);
    await db.eventRegistrationNotification.update({ where: { id: notification.id }, data: { status: "FAILED", recipient: recipient || null, recipients, deliveredRecipients, attempts: { increment: 1 }, lastAttemptAt: attemptedAt, nextAttemptAt: getRetryAt(notification.attempts + 1, attemptedAt), lockedAt: null, lockedBy: null, lastError: message } });
    return { sent: false as const, error: message };
  }
  if (recipients.length === 0 || !from || !mailer) {
    const error = "Не заполнены SMTP, адрес отправителя или адрес получателя";
    await db.eventRegistrationNotification.update({ where: { id: notification.id }, data: { status: "FAILED", recipient: recipient || null, recipients, deliveredRecipients, attempts: { increment: 1 }, lastAttemptAt: attemptedAt, nextAttemptAt: getRetryAt(notification.attempts + 1, attemptedAt), lockedAt: null, lockedBy: null, lastError: error } });
    return { sent: false as const, error };
  }

  const eventUrl = `${STO_2026_PUBLIC_ORIGIN}${STO_2026_EVENT_PATH}`;
  const registerUrl = `${STO_2026_PUBLIC_ORIGIN}${STO_2026_REGISTER_PATH}`;
  const applicantLines = [
    `Ваша регистрация №${registration.publicNumber} получена.`,
    "",
    `${registration.event.title}.`,
    `${STO_2026_EVENT.dateLabel}; ${STO_2026_EVENT.startLabel}.`,
    `${STO_2026_EVENT.venueName}, ${STO_2026_EVENT.venueAddress}.`,
    STO_2026_EVENT.registrationLabel,
    "",
    `Программа: ${eventUrl}`,
    `Карта: ${STO_2026_EVENT.mapUrl}`,
    `Контакт Ассоциации: ${STO_2026_EVENT.organizerEmail}`,
    "",
    "Сохраните это письмо; регистрация не создаёт личный кабинет и не является записью на медицинскую услугу.",
  ];
  const associationLines = [
    `Новая регистрация на конференцию №${registration.publicNumber}`,
    "",
    line("Дата заявки", registration.createdAt.toLocaleString("ru-RU")),
    line("ФИО", registration.fullName),
    line("Телефон", registration.phone),
    line("Email", registration.email),
    line("Город", registration.city),
    line("Специализация", registration.customSpecialty || registration.specialty),
    line("Организация", registration.organization),
    line("Должность", registration.position),
    line("Источник", registration.source),
    line("UTM campaign", registration.utmCampaign),
    line("UTM content", registration.utmContent),
    "",
    `Карточка события: ${registerUrl}`,
  ].filter((value): value is string => value !== null);

  let delivered = deliveredRecipients;
  let messageId = notification.messageId;
  let deliveryError: string | null = null;
  for (const nextRecipient of pendingRecipients) {
    try {
      const info = await mailer.sendMail({
        ...getEventEmailHeaders(from, notification.kind === "APPLICANT" ? from : registration.email, nextRecipient),
        to: nextRecipient,
        subject: notification.kind === "APPLICANT"
          ? `Регистрация на конференцию получена — №${registration.publicNumber}`
          : `Новая регистрация на конференцию — №${registration.publicNumber}`,
        text: (notification.kind === "APPLICANT" ? applicantLines : associationLines).join("\n"),
        attachments: [{ filename: "sto-2026.ics", content: buildEventIcs(), contentType: "text/calendar; charset=utf-8" }],
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      if (Array.isArray(info.rejected) && info.rejected.includes(nextRecipient)) throw new Error("SMTP отклонил адрес получателя");
      delivered = getSuccessfulDeliveryState(delivered, nextRecipient);
      messageId = info.messageId || messageId;
      await db.eventRegistrationNotification.update({ where: { id: notification.id }, data: { recipients, deliveredRecipients: delivered, recipient, messageId, lockedAt: attemptedAt, lockedBy: workerId } });
    } catch (error) {
      deliveryError = safeEventEmailError(error);
      break;
    }
  }

  const nextAttempt = notification.attempts + 1;
  if (!deliveryError && getPendingEmailRecipients(recipients, delivered).length === 0) {
    await db.eventRegistrationNotification.update({ where: { id: notification.id }, data: { status: "SENT", recipient, recipients, deliveredRecipients: delivered, attempts: nextAttempt, lastAttemptAt: attemptedAt, sentAt: new Date(), nextAttemptAt: null, lockedAt: null, lockedBy: null, messageId, lastError: null } });
    return { sent: true as const };
  }

  const message = deliveryError || "Не удалось определить адрес для доставки";
  await db.eventRegistrationNotification.update({ where: { id: notification.id }, data: { status: "FAILED", recipient, recipients, deliveredRecipients: delivered, attempts: nextAttempt, lastAttemptAt: attemptedAt, nextAttemptAt: getRetryAt(nextAttempt, attemptedAt), lockedAt: null, lockedBy: null, messageId, lastError: message } });
  return { sent: false as const, error: message };
}
