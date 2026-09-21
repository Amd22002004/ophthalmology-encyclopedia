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
import {
  getApplicantNotificationRecipients,
  getEventAssociationNotificationRecipients,
} from "@/lib/email/recipients";
import { buildEventIcs } from "./registration-ics";
import { getEventEmailHeaders } from "./registration-sender";
import { STO_2026_EVENT } from "./sto-2026";
import {
  buildApplicantEventEmail,
  buildAssociationEventEmail,
} from "./registration-email-format";

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
    : getEventAssociationNotificationRecipients(registration.email, notification.recipients, notification.recipient);
  const deliveredRecipients = getSuccessfulDeliveryState([], notification.deliveredRecipients)
    .filter((deliveredRecipient) => recipients.includes(deliveredRecipient));
  const pendingRecipients = getPendingEmailRecipients(recipients, deliveredRecipients);
  const recipient = recipients.join(",");
  const from = process.env.EVENT_SMTP_FROM?.trim() || process.env.COOPERATION_SMTP_FROM?.trim() || process.env.APPEAL_SMTP_FROM?.trim();
  const attemptedAt = now;

  if (notification.kind === "ASSOCIATION" && recipients.length === 0) {
    await db.eventRegistrationNotification.update({
      where: { id: notification.id },
      data: {
        status: "SENT",
        recipient: null,
        recipients: [],
        deliveredRecipients: [],
        attempts: { increment: 1 },
        lastAttemptAt: attemptedAt,
        sentAt: attemptedAt,
        nextAttemptAt: null,
        lockedAt: null,
        lockedBy: null,
        lastError: null,
      },
    });
    return { sent: true as const, skipped: true as const };
  }

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

  const email = notification.kind === "APPLICANT"
    ? buildApplicantEventEmail({
        fullName: registration.fullName,
        publicNumber: registration.publicNumber,
      })
    : buildAssociationEventEmail({
        fullName: registration.fullName,
        publicNumber: registration.publicNumber,
        phone: registration.phone,
        email: registration.email,
        city: registration.city,
        specialty: registration.customSpecialty || registration.specialty,
        organization: registration.organization,
        position: registration.position,
        source: registration.source,
        utmCampaign: registration.utmCampaign,
        utmContent: registration.utmContent,
        comment: registration.comment,
        createdAt: registration.createdAt,
      });

  let delivered = deliveredRecipients;
  let messageId = notification.messageId;
  let deliveryError: string | null = null;
  for (const nextRecipient of pendingRecipients) {
    try {
      const info = await mailer.sendMail({
        ...getEventEmailHeaders(from, notification.kind === "APPLICANT" ? STO_2026_EVENT.organizerEmail : registration.email, nextRecipient),
        to: nextRecipient,
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(notification.kind === "APPLICANT"
          ? { attachments: [{ filename: "sto-2026.ics", content: buildEventIcs(), contentType: "text/calendar; charset=utf-8" }] }
          : {}),
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
