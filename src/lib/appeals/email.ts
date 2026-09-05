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
import { getInternalOrLegacyRecipients } from "@/lib/email/recipients";
import {
  APPEAL_CATEGORY_OPTIONS,
  REPORTER_ROLE_OPTIONS,
  REQUESTED_ACTION_OPTIONS,
  labelsForValues,
} from "./constants";

const globalForAppealMail = globalThis as unknown as {
  appealMailer?: ReturnType<typeof nodemailer.createTransport>;
  appealMailerUrl?: string;
};

function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

function getMailer() {
  const url = process.env.APPEAL_SMTP_URL?.trim();
  if (!url) return null;
  if (!globalForAppealMail.appealMailer || globalForAppealMail.appealMailerUrl !== url) {
    const parsed = new URL(url);
    if (parsed.protocol !== "smtp:" && parsed.protocol !== "smtps:") {
      throw new Error("APPEAL_SMTP_URL должен использовать протокол smtp или smtps");
    }
    const secure = parsed.protocol === "smtps:";
    const username = parsed.username ? decodeURIComponent(parsed.username) : "";
    const password = parsed.password ? decodeURIComponent(parsed.password) : "";
    const mailer = nodemailer.createTransport({
      host: parsed.hostname,
      port: parsed.port ? Number.parseInt(parsed.port, 10) : secure ? 465 : 587,
      secure,
      ...(username ? { auth: { user: username, pass: password } } : {}),
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 15_000,
    });
    globalForAppealMail.appealMailer = mailer;
    globalForAppealMail.appealMailerUrl = url;
  }
  return globalForAppealMail.appealMailer ?? null;
}

function safeError(error: unknown) {
  return safeEmailError(error);
}

function line(label: string, value: string | null | undefined) {
  return value ? `${label}: ${value}` : null;
}

export async function deliverAppealNotification(notificationId: string, workerId = createEmailWorkerId()) {
  const db = getPrisma();
  if (!db) return { sent: false as const, error: "Database unavailable" };

  const now = new Date();
  const claimed = await db.appealNotification.updateMany({
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

  const notification = await db.appealNotification.findUnique({
    where: { id: notificationId },
    include: {
      appeal: {
        include: {
          investigation: { select: { title: true } },
          clinic: { select: { title: true } },
          attachments: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!notification) return { sent: false as const, error: "Notification not found" };

  const recipients = getInternalOrLegacyRecipients(notification.recipients, notification.recipient);
  const deliveredRecipients = getSuccessfulDeliveryState([], notification.deliveredRecipients);
  const pendingRecipients = getPendingEmailRecipients(recipients, deliveredRecipients);
  const recipient = recipients.join(",");
  const from = process.env.APPEAL_SMTP_FROM?.trim();
  const attemptedAt = now;

  let mailer: ReturnType<typeof nodemailer.createTransport> | null;
  try {
    mailer = getMailer();
  } catch (error) {
    const message = safeError(error);
    await db.appealNotification.update({
      where: { id: notification.id },
      data: {
        status: "FAILED",
        recipient: recipient || null,
        recipients,
        deliveredRecipients,
        attempts: { increment: 1 },
        lastAttemptAt: attemptedAt,
        nextAttemptAt: getRetryAt(notification.attempts + 1, attemptedAt),
        lockedAt: null,
        lockedBy: null,
        lastError: message,
      },
    });
    return { sent: false as const, error: message };
  }

  if (recipients.length === 0 || !from || !mailer) {
    const error = "Не заполнены APPEAL_SMTP_URL, APPEAL_SMTP_FROM или APPEAL_NOTIFICATION_EMAIL";
    await db.appealNotification.update({
      where: { id: notification.id },
      data: {
        status: "FAILED",
        recipient: recipient || null,
        recipients,
        deliveredRecipients,
        attempts: { increment: 1 },
        lastAttemptAt: attemptedAt,
        nextAttemptAt: getRetryAt(notification.attempts + 1, attemptedAt),
        lockedAt: null,
        lockedBy: null,
        lastError: error,
      },
    });
    return { sent: false as const, error };
  }

  const appeal = notification.appeal;
  const adminUrl = absoluteUrl(`/admin/appeals/${appeal.id}`);
  const lines = [
    `Новое обращение №${appeal.publicNumber}`,
    "",
    line("Дата", appeal.createdAt.toLocaleString("ru-RU")),
    line("Расследование", appeal.investigation?.title),
    line("Клиника (классификация)", appeal.clinic?.title),
    line("Имя", appeal.name),
    line("Телефон", appeal.phone),
    line("Email", appeal.email),
    line("Город", appeal.city),
    line("Клиника со слов заявителя", appeal.reportedClinicName),
    line("Врач со слов заявителя", appeal.reportedDoctorName),
    line("Оборудование со слов заявителя", appeal.reportedEquipmentName),
    line("Связь с ситуацией", labelsForValues(appeal.reporterRoles, REPORTER_ROLE_OPTIONS).join("; ")),
    line("Категории", labelsForValues(appeal.categories, APPEAL_CATEGORY_OPTIONS).join("; ")),
    line("Ожидаемые действия", labelsForValues(appeal.requestedActions, REQUESTED_ACTION_OPTIONS).join("; ")),
    line("Интерес к коллективному информированию", appeal.collectiveInterest ? "Да" : "Нет"),
    `Количество вложений: ${appeal.attachments.length}`,
    "",
    "Описание:",
    appeal.description,
    "",
    `Карточка в админ-панели: ${adminUrl}`,
  ].filter((value): value is string => value !== null);

  let delivered = deliveredRecipients;
  let messageId = notification.messageId;
  let deliveryError: string | null = null;
  for (const nextRecipient of pendingRecipients) {
    try {
      const info = await mailer.sendMail({
        ...getEmailHeaders(from, appeal.email, nextRecipient),
        to: nextRecipient,
        subject: `Новое обращение №${appeal.publicNumber} — oftalmologia.pro`,
        text: lines.join("\n"),
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      if (Array.isArray(info.rejected) && info.rejected.includes(nextRecipient)) throw new Error("SMTP отклонил адрес получателя");
      delivered = getSuccessfulDeliveryState(delivered, nextRecipient);
      messageId = info.messageId || messageId;
      await db.appealNotification.update({
        where: { id: notification.id },
        data: { recipients, deliveredRecipients: delivered, recipient, messageId, lockedAt: attemptedAt, lockedBy: workerId },
      });
    } catch (error) {
      deliveryError = safeError(error);
      break;
    }
  }

  const nextAttempt = notification.attempts + 1;
  if (!deliveryError && getPendingEmailRecipients(recipients, delivered).length === 0) {
    await db.appealNotification.update({
      where: { id: notification.id },
      data: {
        status: "SENT",
        recipient,
        recipients,
        deliveredRecipients: delivered,
        attempts: nextAttempt,
        lastAttemptAt: attemptedAt,
        sentAt: new Date(),
        nextAttemptAt: null,
        lockedAt: null,
        lockedBy: null,
        messageId,
        lastError: null,
      },
    });
    return { sent: true as const };
  }

  const message = deliveryError || "Не удалось определить адрес для доставки";
  await db.appealNotification.update({
    where: { id: notification.id },
    data: {
      status: "FAILED",
      recipient,
      recipients,
      deliveredRecipients: delivered,
      attempts: nextAttempt,
      lastAttemptAt: attemptedAt,
      nextAttemptAt: getRetryAt(nextAttempt, attemptedAt),
      lockedAt: null,
      lockedBy: null,
      messageId,
      lastError: message,
    },
  });
  return { sent: false as const, error: message };
}
