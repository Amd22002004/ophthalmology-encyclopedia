import assert from "node:assert/strict";
import test from "node:test";
import {
  TELEGRAM_WEBHOOK_MAX_BODY_BYTES,
  isTelegramWebhookAuthorized,
  telegramBodyWithinLimit,
} from "./telegram-webhook";

test("Telegram webhook compares a configured secret and rejects missing values", () => {
  assert.equal(isTelegramWebhookAuthorized("secret", "secret"), true);
  assert.equal(isTelegramWebhookAuthorized("wrong", "secret"), false);
  assert.equal(isTelegramWebhookAuthorized("secret", ""), false);
  assert.equal(isTelegramWebhookAuthorized("", "secret"), false);
});

test("Telegram webhook body has a bounded UTF-8 size", () => {
  assert.equal(telegramBodyWithinLimit("ok"), true);
  assert.equal(telegramBodyWithinLimit("я".repeat(TELEGRAM_WEBHOOK_MAX_BODY_BYTES)), false);
  assert.equal(telegramBodyWithinLimit("ok", 1), false);
});
