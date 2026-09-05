import { timingSafeEqual } from "node:crypto";

export const TELEGRAM_WEBHOOK_MAX_BODY_BYTES = 96 * 1024;

export function isTelegramWebhookAuthorized(received: string | null | undefined, expected: string | null | undefined) {
  if (!received || !expected) return false;
  const receivedBytes = Buffer.from(received, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (receivedBytes.byteLength !== expectedBytes.byteLength) return false;
  return timingSafeEqual(receivedBytes, expectedBytes);
}

export function telegramBodyWithinLimit(body: string, maxBytes = TELEGRAM_WEBHOOK_MAX_BODY_BYTES) {
  return Buffer.byteLength(body, "utf8") <= maxBytes;
}
