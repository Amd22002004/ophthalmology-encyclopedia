import assert from "node:assert/strict";
import test from "node:test";
import {
  authorizeTelegramAction,
  buildTelegramCallbackData,
  formatTelegramRegistration,
  maskTelegramEmail,
  maskTelegramPhone,
  parseTelegramBotConfig,
  parseTelegramUpdate,
  telegramRetryDelayMs,
} from "./telegram";

const registration = {
  publicNumber: "STO-2026-000123",
  createdAt: new Date("2026-08-26T09:37:00.000Z"),
  status: "NEW",
  fullName: "Иванов Иван Иванович",
  phone: "+79991234567",
  email: "ivanov@example.ru",
  specialty: "Врач-офтальмолог",
  organization: "Клиника «Название»",
  position: "Врач-офтальмолог",
  city: "Тюмень",
  comment: "Нужна программа конференции",
  source: "event_page",
  utmSource: "print",
  utmMedium: "qr",
  utmCampaign: "conference_invitation_2026",
  utmContent: "registration",
};

test("Telegram config parses CSV allowlists and keeps PII masked by default", () => {
  const config = parseTelegramBotConfig({
    TELEGRAM_EVENT_BOT_ENABLED: "true",
    TELEGRAM_EVENT_BOT_TOKEN: "token-is-not-logged",
    TELEGRAM_EVENT_WEBHOOK_SECRET: "secret",
    TELEGRAM_EVENT_ALLOWED_CHAT_IDS: " -1001, -1002 ",
    TELEGRAM_EVENT_ALLOWED_USER_IDS: "11, 22",
    TELEGRAM_EVENT_DEFAULT_CHAT_ID: "-1001",
    TELEGRAM_EVENT_ADMIN_BASE_URL: "https://oftalmologia.pro/admin",
    TELEGRAM_EVENT_PUBLIC_BASE_URL: "https://oftalmologia.pro",
  });

  assert.equal(config.enabled, true);
  assert.deepEqual(config.allowedChatIds, ["-1001", "-1002"]);
  assert.deepEqual(config.allowedUserIds, ["11", "22"]);
  assert.equal(config.piiMode, "MASKED");
  assert.equal(config.defaultChatId, "-1001");
});

test("Telegram action requires both allowlisted chat and user", () => {
  const allowed = { chatId: "-1001", userId: "11" };
  assert.equal(authorizeTelegramAction(allowed, ["-1001"], ["11"]), true);
  assert.equal(authorizeTelegramAction({ chatId: "-1001", userId: "99" }, ["-1001"], ["11"]), false);
  assert.equal(authorizeTelegramAction({ chatId: "-9999", userId: "11" }, ["-1001"], ["11"]), false);
});

test("Telegram parser accepts message and callback updates but rejects malformed data", () => {
  assert.equal(parseTelegramUpdate({ update_id: 1, message: { message_id: 2, chat: { id: -1001, type: "group" }, from: { id: 11 }, text: "/stats" } })?.kind, "message");
  assert.equal(parseTelegramUpdate({ update_id: 2, callback_query: { id: "callback", from: { id: 11 }, message: { message_id: 2, chat: { id: -1001, type: "group" } }, data: "event:stats" } })?.kind, "callback");
  assert.equal(parseTelegramUpdate({ update_id: "2", message: {} }), null);
  assert.equal(parseTelegramUpdate({ update_id: 3, callback_query: { id: "callback", from: { id: 11 }, data: "event:stats" } }), null);
});

test("Telegram callbacks contain only bounded action identifiers", () => {
  assert.equal(buildTelegramCallbackData("latest", 2), "event:latest:2");
  assert.equal(buildTelegramCallbackData("export-confirm"), "event:export-confirm");
  assert.throws(() => buildTelegramCallbackData("latest", 999));
  assert.throws(() => buildTelegramCallbackData("ivanov@example.ru"));
});

test("Telegram notification masks phone and email unless FULL mode is explicitly selected", () => {
  assert.equal(maskTelegramPhone("+79991234567"), "+7 999 ***-**-67");
  assert.equal(maskTelegramEmail("ivanov@example.ru"), "i***@example.ru");
  const masked = formatTelegramRegistration(registration, "MASKED", "https://oftalmologia.pro/admin/events/event-1?registration=registration-1");
  assert.match(masked, /\+7 999 \*\*\*-\*\*-67/);
  assert.match(masked, /i\*\*\*@example\.ru/);
  assert.match(masked, /Иванов Иван Иванович/);
  const full = formatTelegramRegistration(registration, "FULL", "https://oftalmologia.pro/admin/events/event-1?registration=registration-1");
  assert.match(full, /Иванов Иван Иванович/);
  assert.match(full, /ivanov@example\.ru/);
  assert.match(full, /Открыть в админке/);
});

test("Telegram retry delay honors retry_after and grows for ordinary failures", () => {
  assert.equal(telegramRetryDelayMs(1), 1_000);
  assert.equal(telegramRetryDelayMs(3), 4_000);
  assert.equal(telegramRetryDelayMs(2, 17), 17_000);
  assert.equal(telegramRetryDelayMs(2, 3_600), 60_000);
});
