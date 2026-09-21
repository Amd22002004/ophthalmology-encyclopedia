import assert from "node:assert/strict";
import test from "node:test";
import type { TelegramApi } from "./telegram-api";
import type { TelegramBotConfig, TelegramParsedUpdate } from "./telegram";
import { handleTelegramUpdate } from "./telegram-handler";

const config: TelegramBotConfig = {
  enabled: true,
  token: "token",
  webhookSecret: "secret",
  allowedChatIds: ["-1001"],
  allowedUserIds: ["11"],
  defaultChatId: "-1001",
  adminBaseUrl: "https://oftalmologia.pro/admin",
  publicBaseUrl: "https://oftalmologia.pro",
  piiMode: "MASKED",
};

function message(text: string, overrides: Record<string, unknown> = {}) {
  return {
    kind: "message",
    updateId: "1",
    messageId: 2,
    subject: { chatId: "-1001", userId: "11", chatType: "group" },
    text,
    ...overrides,
  } as TelegramParsedUpdate;
}

function callback(data: string) {
  return {
    kind: "callback",
    updateId: "2",
    messageId: 2,
    callbackId: "callback-1",
    subject: { chatId: "-1001", userId: "11", chatType: "group" },
    data,
  } as TelegramParsedUpdate;
}

function dependencies() {
  const sent: Array<{ chatId: string; text: string }> = [];
  const edited: string[] = [];
  const audits: string[] = [];
  const api = {
    sendMessage: async (chatId: string, text: string) => { sent.push({ chatId, text }); return {}; },
    editMessageText: async (_chatId: string, _messageId: number, text: string) => { edited.push(text); return {}; },
    answerCallbackQuery: async () => ({}),
    sendDocument: async () => ({}),
  } as unknown as TelegramApi;
  return {
    sent,
    edited,
    audits,
    api,
    deps: {
      api,
      getEventId: async () => "event-1",
      listLatest: async () => ({ rows: [], total: 0, pages: 1 }),
      getStats: async () => ({ total: 0, statuses: {}, today: 0, qr: 0, cities: [], specialties: [] }),
      enqueueExport: async () => ({ id: "job-1" }),
      recordAudit: async ({ action }: { action: string }) => { audits.push(action); },
    },
  };
}

test("authorized Telegram menu is rendered without participant data", async () => {
  const fixture = dependencies();
  await handleTelegramUpdate(message("/menu"), config, fixture.deps);
  assert.equal(fixture.sent.length, 1);
  assert.match(fixture.sent[0].text, /Современные технологии в офтальмологии/);
  assert.doesNotMatch(fixture.sent[0].text, /email|телефон|ivanov/i);
  assert.deepEqual(fixture.audits, ["TELEGRAM_MENU_REQUESTED"]);
});

test("unauthorized command receives only a generic denial", async () => {
  const fixture = dependencies();
  const update = message("/stats", { subject: { chatId: "-1001", userId: "99", chatType: "group" } }) as TelegramParsedUpdate;
  await handleTelegramUpdate(update, config, fixture.deps);
  assert.equal(fixture.sent[0].text, "Доступ к служебному боту не предоставлен.");
  assert.deepEqual(fixture.audits, ["TELEGRAM_UNAUTHORIZED_ACCESS_ATTEMPT"]);
});

test("a user from an unapproved chat is denied even with an approved user id", async () => {
  const fixture = dependencies();
  const update = message("/stats", { subject: { chatId: "-777", userId: "11", chatType: "group" } }) as TelegramParsedUpdate;
  await handleTelegramUpdate(update, config, fixture.deps);
  assert.equal(fixture.sent[0].text, "Доступ к служебному боту не предоставлен.");
  assert.deepEqual(fixture.audits, ["TELEGRAM_UNAUTHORIZED_ACCESS_ATTEMPT"]);
});

test("whoami is available without allowlist and returns only Telegram identifiers", async () => {
  const fixture = dependencies();
  const update = message("/whoami", { subject: { chatId: "-777", userId: "99", chatType: "private" } }) as TelegramParsedUpdate;
  await handleTelegramUpdate(update, config, fixture.deps);
  assert.match(fixture.sent[0].text, /user_id: 99/);
  assert.match(fixture.sent[0].text, /chat_id: -777/);
  assert.doesNotMatch(fixture.sent[0].text, /регистрац|ФИО|email|телефон/i);
});

test("export confirmation enqueues a job without generating an XLSX in the handler", async () => {
  const fixture = dependencies();
  await handleTelegramUpdate(callback("event:export-confirm"), config, fixture.deps);
  assert.equal(fixture.edited.length, 1);
  assert.match(fixture.edited[0], /очередь|формируется/i);
  assert.deepEqual(fixture.audits, ["TELEGRAM_FULL_EXPORT_REQUESTED"]);
});
