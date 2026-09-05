import "server-only";

import nodemailer from "nodemailer";
import { getPrisma } from "@/lib/prisma";
import {
  createEmailWorkerId,
  EMAIL_LOCK_LEASE_MS,
  EMAIL_MAX_ATTEMPTS,
  getEmailHeaders,
  getPendingEmailRecipients,
  getRetryAt,
  getSuccessfulDeliveryState,
  safeEmailError,
} from "@/lib/email/delivery";
import { getApplicantNotificationRecipients, getInternalOrLegacyRecipients } from "@/lib/email/recipients";
import { labelsForCooperationValues, CLINIC_INTEREST_OPTIONS, DOCTOR_INTEREST_OPTIONS, DOCTOR_SPECIALTY_OPTIONS, PARTNER_TYPE_OPTIONS } from "./constants";

const globalForCooperationMail = globalThis as unknown as {
  cooperationMailer?: ReturnType<typeof nodemailer.createTransport>;
  cooperationMailerUrl?: string;
};

function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

export function getCooperationMailer() {
  const url = process.env.COOPERATION_SMTP_URL?.trim() || process.env.APPEAL_SMTP_URL?.trim();
  if (!url) return null;
  if (!globalForCooperationMail.cooperationMailer || globalForCooperationMail.cooperationMailerUrl !== url) {
    const parsed = new URL(url);
    if (parsed.protocol !== "smtp:" && parsed.protocol !== "smtps:") throw new Error("COOPERATION_SMTP_URL должен использовать протокол smtp или smtps");
    const secure = parsed.protocol === "smtps:";
    const username = parsed.username ? decodeURIComponent(parsed.username) : "";
    const password = parsed.password ? decodeURIComponent(parsed.password) : "";
    globalForCooperationMail.cooperationMailer = nodemailer.createTransport({
      host: parsed.hostname,
      port: parsed.port ? Number.parseInt(parsed.port, 10) : secure ? 465 : 587,
      secure,
      ...(username ? { auth: { user: username, pass: password } } : {}),
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 15_000,
    });
    globalForCooperationMail.cooperationMailerUrl = url;
  }
  return globalForCooperationMail.cooperationMailer ?? null;
}

export function safeCooperationError(error: unknown) {
  return safeEmailError(error);
}

function line(label: string, value: string | null | undefined) {
  return value ? `${label}: ${value}` : null;
}

function valuesForApplication(application: {
  participantType: string;
  specialties: string[];
  interests: string[];
}) {
  const specialtyOptions = application.participantType === "DOCTOR" ? DOCTOR_SPECIALTY_OPTIONS : [];
  const interestOptions = application.participantType === "CLINIC" ? CLINIC_INTEREST_OPTIONS : application.participantType === "DOCTOR" ? DOCTOR_INTEREST_OPTIONS : [];
  return {
    specialties: labelsForCooperationValues(application.specialties, specialtyOptions),
    interests: labelsForCooperationValues(application.interests, interestOptions),
  };
}

export async function deliverCooperationNotification(notificationId: string, workerId = createEmailWorkerId()) {
  const db = getPrisma();
  if (!db) return { sent: false as const, error: "Database unavailable" };

  const now = new Date();
  const claimed = await db.cooperationApplicationNotification.updateMany({
    where: {
      id: notificationId,
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: EMAIL_MAX_ATTEMPTS },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      AND: [{ OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(now.getTime() - EMAIL_LOCK_LEASE_MS) } }] }],
    },
    data: { lockedAt: now, lockedBy: workerId },
  });
  if (claimed.count !== 1) return { sent: false as const, skipped: true as const };

  const notification = await db.cooperationApplicationNotification.findUnique({
    where: { id: notificationId },
    include: { application: { include: { attachment: true } } },
  });
  if (!notification) return { sent: false as const, error: "Notification not found" };

  const applicant = notification.application;
  const recipients = notification.kind === "APPLICANT"
    ? (notification.recipients.length > 0 ? notification.recipients : getApplicantNotificationRecipients(applicant.email))
    : getInternalOrLegacyRecipients(notification.recipients, notification.recipient);
  const deliveredRecipients = getSuccessfulDeliveryState([], notification.deliveredRecipients);
  const pendingRecipients = getPendingEmailRecipients(recipients, deliveredRecipients);
  const recipient = recipients.join(",");
  const from = process.env.COOPERATION_SMTP_FROM?.trim() || process.env.APPEAL_SMTP_FROM?.trim();
  const attemptedAt = now;
  let mailer: ReturnType<typeof nodemailer.createTransport> | null;
  try {
    mailer = getCooperationMailer();
  } catch (error) {
    const message = safeCooperationError(error);
    await db.cooperationApplicationNotification.update({ where: { id: notification.id }, data: { status: "FAILED", recipient: recipient || null, recipients, deliveredRecipients, attempts: { increment: 1 }, lastAttemptAt: attemptedAt, nextAttemptAt: getRetryAt(notification.attempts + 1, attemptedAt), lockedAt: null, lockedBy: null, lastError: message } });
    return { sent: false as const, error: message };
  }
  if (recipients.length === 0 || !from || !mailer) {
    const error = "Не заполнены SMTP, адрес отправителя или адрес получателя";
    await db.cooperationApplicationNotification.update({ where: { id: notification.id }, data: { status: "FAILED", recipient: recipient || null, recipients, deliveredRecipients, attempts: { increment: 1 }, lastAttemptAt: attemptedAt, nextAttemptAt: getRetryAt(notification.attempts + 1, attemptedAt), lockedAt: null, lockedBy: null, lastError: error } });
    return { sent: false as const, error };
  }

  const labels = valuesForApplication(applicant);
  const adminUrl = absoluteUrl(`/admin/cooperation/${applicant.id}`);
  const person = [applicant.lastName, applicant.firstName, applicant.middleName].filter(Boolean).join(" ") || applicant.contactName;
  const publicLines = [
    `Спасибо! Заявка №${applicant.applicationNumber} получена.`,
    "",
    "Ассоциация проверит сведения и свяжется с вами по указанным контактам.",
    "Отправка заявки не означает автоматического вступления или создания профиля.",
  ];
  const internalLines = [
    `Новая заявка на сотрудничество №${applicant.applicationNumber}`,
    "",
    line("Тип", applicant.participantType),
    line("Дата", applicant.createdAt.toLocaleString("ru-RU")),
    line("Организация", applicant.organizationName),
    line("ФИО / контакт", person),
    line("Должность", applicant.contactPosition),
    line("Телефон", applicant.phone),
    line("Email", applicant.email),
    line("Город", applicant.city),
    line("Регион", applicant.region),
    line("ИНН", applicant.inn),
    line("Сайт", applicant.website),
    line("Место работы", applicant.workplace || applicant.customWorkplace),
    line("Специализации", labels.specialties.join("; ")),
    line("Интересы", labels.interests.join("; ")),
    line("Тип партнёра", applicant.partnerType ? PARTNER_TYPE_OPTIONS.find((item) => item.value === applicant.partnerType)?.label || applicant.partnerType : null),
    line("Источник", applicant.source),
    line("UTM campaign", applicant.utmCampaign),
    line("Вложение", applicant.attachment ? `${applicant.attachment.originalName} (${applicant.attachment.sizeBytes} байт)` : null),
    "",
    "Сообщение:",
    applicant.message || "—",
    "",
    `Карточка в админ-панели: ${adminUrl}`,
  ].filter((value): value is string => value !== null);

  let delivered = deliveredRecipients;
  let messageId = notification.messageId;
  let deliveryError: string | null = null;
  for (const nextRecipient of pendingRecipients) {
    try {
      const info = await mailer.sendMail({
        ...getEmailHeaders(from, notification.kind === "APPLICANT" ? from : applicant.email, nextRecipient),
        to: nextRecipient,
        subject: notification.kind === "APPLICANT" ? `Заявка №${applicant.applicationNumber} получена` : `Новая заявка №${applicant.applicationNumber} — oftalmologia.pro`,
        text: notification.kind === "APPLICANT" ? publicLines.join("\n") : internalLines.join("\n"),
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      if (Array.isArray(info.rejected) && info.rejected.includes(nextRecipient)) throw new Error("SMTP отклонил адрес получателя");
      delivered = getSuccessfulDeliveryState(delivered, nextRecipient);
      messageId = info.messageId || messageId;
      await db.cooperationApplicationNotification.update({ where: { id: notification.id }, data: { recipients, deliveredRecipients: delivered, recipient, messageId, lockedAt: attemptedAt, lockedBy: workerId } });
    } catch (error) {
      deliveryError = safeCooperationError(error);
      break;
    }
  }

  const nextAttempt = notification.attempts + 1;
  if (!deliveryError && getPendingEmailRecipients(recipients, delivered).length === 0) {
    await db.cooperationApplicationNotification.update({ where: { id: notification.id }, data: { status: "SENT", recipient, recipients, deliveredRecipients: delivered, attempts: nextAttempt, lastAttemptAt: attemptedAt, sentAt: new Date(), nextAttemptAt: null, lockedAt: null, lockedBy: null, messageId, lastError: null } });
    return { sent: true as const };
  }

  const message = deliveryError || "Не удалось определить адрес для доставки";
  await db.cooperationApplicationNotification.update({ where: { id: notification.id }, data: { status: "FAILED", recipient, recipients, deliveredRecipients: delivered, attempts: nextAttempt, lastAttemptAt: attemptedAt, nextAttemptAt: getRetryAt(nextAttempt, attemptedAt), lockedAt: null, lockedBy: null, messageId, lastError: message } });
  return { sent: false as const, error: message };
}
