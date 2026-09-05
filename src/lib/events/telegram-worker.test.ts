import assert from "node:assert/strict";
import test from "node:test";
import type { TelegramApi } from "./telegram-api";
import { parseTelegramBotConfig } from "./telegram";
import {
  buildTelegramExportSummary,
  runTelegramWorker,
  telegramNotificationKeyboard,
} from "./telegram-worker";

const config = parseTelegramBotConfig({
  TELEGRAM_EVENT_BOT_ENABLED: "true",
  TELEGRAM_EVENT_BOT_TOKEN: "token-is-not-logged",
  TELEGRAM_EVENT_WEBHOOK_SECRET: "secret",
  TELEGRAM_EVENT_ALLOWED_CHAT_IDS: "-1001",
  TELEGRAM_EVENT_ALLOWED_USER_IDS: "11",
  TELEGRAM_EVENT_DEFAULT_CHAT_ID: "-1001",
  TELEGRAM_EVENT_ADMIN_BASE_URL: "https://oftalmologia.pro/admin",
});

test("Telegram export summary counts cancelled records separately", () => {
  assert.deepEqual(buildTelegramExportSummary([
    { status: "NEW" },
    { status: "CONFIRMED" },
    { status: "CANCELLED" },
  ]), { total: 3, active: 2, cancelled: 1 });
});

test("Telegram notification keyboard contains only safe callbacks and an admin link", () => {
  const keyboard = telegramNotificationKeyboard(config, "event-1", "registration-1");
  const serialized = JSON.stringify(keyboard);
  assert.match(serialized, /event:latest:0/);
  assert.match(serialized, /event:export/);
  assert.match(serialized, /registration-1/);
  assert.doesNotMatch(serialized, /ivanov|7999|@example/);
});

test("Telegram worker sends notification and export job from fresh repository data", async () => {
  const calls: string[] = [];
  const updates: string[] = [];
  const audits: string[] = [];
  const api = {
    sendMessage: async (chatId: string) => { calls.push(`message:${chatId}`); return {}; },
    sendDocument: async (chatId: string, filename: string, content: Buffer, caption: string) => {
      calls.push(`document:${chatId}:${filename}:${content.subarray(0, 2).toString()}:${caption.includes("Всего")}`);
      return {};
    },
  } as unknown as TelegramApi;
  const deps = {
    api,
    findOutbox: async () => [{ id: "notification-1" }],
    claimNotification: async () => true,
    getNotification: async () => ({
      id: "notification-1",
      attempts: 0,
      registration: {
        id: "registration-1",
        event: { id: "event-1", slug: "sovremennye-tehnologii-v-oftalmologii-2026" },
        publicNumber: "STO-2026-000123",
        createdAt: new Date("2026-08-26T09:37:00.000Z"),
        status: "NEW",
        fullName: "Иванов Иван Иванович",
        phone: "+79991234567",
        email: "ivanov@example.ru",
        specialty: "Врач-офтальмолог",
        organization: "Клиника",
        position: "Врач",
        city: "Тюмень",
        comment: null,
        source: "event_page",
        utmSource: "print",
        utmMedium: "qr",
        utmCampaign: "conference_invitation_2026",
        utmContent: "registration",
      },
    }),
    updateNotification: async (_id: string, params: { status: string }) => { updates.push(`notification:${params.status}`); },
    findJobs: async () => [{ id: "job-1" }],
    claimJob: async () => true,
    getJob: async () => ({ id: "job-1", attempts: 0, eventId: "event-1", telegramChatId: "-1001", telegramUserId: "11" }),
    listRegistrations: async () => [
      {
        publicNumber: "STO-2026-000123",
        createdAt: new Date("2026-08-26T09:37:00.000Z"),
        status: "NEW",
        fullName: "Иванов Иван Иванович",
        phone: "+79991234567",
        email: "ivanov@example.ru",
        specialty: "ophthalmologist",
        customSpecialty: null,
        organization: "Клиника",
        position: "Врач",
        city: "Тюмень",
        comment: null,
        utmSource: "print",
        utmMedium: "qr",
        utmCampaign: "conference_invitation_2026",
        utmContent: "registration",
        source: "event_page",
        updatedAt: new Date("2026-08-26T09:40:00.000Z"),
      },
    ],
    finishJob: async (_id: string, params: { status: string }) => { updates.push(`job:${params.status}`); },
    recordAudit: async ({ action }: { action: string }) => { audits.push(action); },
  };

  const result = await runTelegramWorker(config, deps);
  assert.equal(result.notificationsSent, 1);
  assert.equal(result.exportsSent, 1);
  assert.deepEqual(updates, ["notification:SENT", "job:SENT"]);
  assert.deepEqual(audits, ["TELEGRAM_REGISTRATION_NOTIFICATION_SENT", "TELEGRAM_FULL_EXPORT_SENT"]);
  assert.equal(calls.length, 2);
  assert.match(calls[1], /document:-1001:sto-2026-registrations-/);
});
