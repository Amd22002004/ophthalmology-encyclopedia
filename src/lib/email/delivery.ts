import { randomUUID } from "node:crypto";

export const EMAIL_MAX_ATTEMPTS = 8;
export const EMAIL_LOCK_LEASE_MS = 2 * 60 * 1000;
export const EMAIL_POLL_INTERVAL_MS = 5 * 1000;

const EMAIL_SENDER_NAME = "Ассоциация офтальмологических клиник";

function extractEmailAddress(value: string) {
  const match = value.match(/<([^<>]+)>/u);
  return (match?.[1] || value).trim().toLowerCase();
}

export function getEmailHeaders(from: string, replyTo?: string | null, to?: string) {
  const address = extractEmailAddress(from);
  const replyAddress = replyTo?.trim().toLowerCase() || address;
  return {
    from: `${EMAIL_SENDER_NAME} <${address}>`,
    replyTo: replyAddress,
    envelope: { from: address, ...(to ? { to } : {}) },
  };
}

export function getPendingEmailRecipients(recipients: string[], deliveredRecipients: string[]) {
  const delivered = new Set(deliveredRecipients.map((item) => item.trim().toLowerCase()));
  return recipients.filter((recipient) => !delivered.has(recipient.trim().toLowerCase()));
}

export function getSuccessfulDeliveryState(deliveredRecipients: string[], successfulRecipients: string | string[]) {
  const next = Array.isArray(successfulRecipients) ? successfulRecipients : [successfulRecipients];
  return [...new Set([...deliveredRecipients, ...next].map((item) => item.trim().toLowerCase()))];
}

export function getRetryAt(attempt: number, now = new Date()) {
  if (attempt >= EMAIL_MAX_ATTEMPTS) return null;
  return new Date(now.getTime() + Math.min(60 * 60 * 1000, 60 * 1000 * 2 ** Math.max(0, attempt - 1)));
}

export function createEmailWorkerId() {
  return `email-worker:${process.pid}:${randomUUID()}`;
}

export function safeEmailError(error: unknown) {
  if (!(error instanceof Error)) return "Неизвестная ошибка доставки";
  return error.message
    .replace(/(?:smtp|smtps):\/\/[^\s]+/giu, "[SMTP URL HIDDEN]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, "[address]")
    .replace(/[\r\n]+/gu, " ")
    .slice(0, 1_000);
}
