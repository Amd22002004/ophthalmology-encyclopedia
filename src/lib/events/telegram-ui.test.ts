import assert from "node:assert/strict";
import test from "node:test";
import {
  formatTelegramLatest,
  formatTelegramStats,
  parseTelegramCommand,
  telegramExportCaption,
  telegramHelpText,
  telegramMenuKeyboard,
} from "./telegram-ui";

const config = {
  adminBaseUrl: "https://oftalmologia.pro/admin",
} as const;

test("Telegram command parser accepts bot suffix and ignores ordinary text", () => {
  assert.equal(parseTelegramCommand("/stats@sto_event_bot"), "stats");
  assert.equal(parseTelegramCommand(" /menu now"), "menu");
  assert.equal(parseTelegramCommand("hello /stats"), null);
  assert.equal(parseTelegramCommand("/unknown"), "unknown");
});

test("Telegram menu contains only safe callback actions and protected admin URL", () => {
  const keyboard = telegramMenuKeyboard(config);
  const serialized = JSON.stringify(keyboard);
  assert.match(serialized, /event:latest:0/);
  assert.match(serialized, /event:export/);
  assert.match(serialized, /event:stats/);
  assert.match(serialized, /https:\/\/oftalmologia\.pro\/admin/);
  assert.doesNotMatch(serialized, /ivanov|@example|7999/);
});

test("Telegram latest and stats formats map internal NEW to REGISTERED", () => {
  const latest = formatTelegramLatest([
    {
      publicNumber: "STO-2026-000123",
      fullName: "Иванов Иван Иванович",
      organization: "Клиника",
      city: "Тюмень",
      status: "NEW",
      createdAt: new Date("2026-08-26T09:37:00.000Z"),
    },
  ], 0, 1);
  assert.match(latest, /REGISTERED/);
  assert.match(latest, /1 \/ 1/);
  assert.match(latest, /Иванов Иван Иванович/);

  const stats = formatTelegramStats({
    total: 3,
    statuses: { NEW: 2, CONFIRMED: 1, CANCELLED: 0, ATTENDED: 0, NO_SHOW: 0 },
    today: 2,
    qr: 1,
    cities: [{ name: "Тюмень", count: 3 }],
    specialties: [{ name: "Врач-офтальмолог", count: 3 }],
  });
  assert.match(stats, /REGISTERED: 2/);
  assert.match(stats, /Из QR приглашения: 1/);
  assert.match(stats, /Тюмень — 3/);
});

test("Telegram export caption states totals and generation time", () => {
  const caption = telegramExportCaption({ total: 4, active: 3, cancelled: 1 }, new Date("2026-08-26T09:40:00.000Z"));
  assert.match(caption, /Всего регистраций: 4/);
  assert.match(caption, /Активных: 3/);
  assert.match(caption, /Отменено: 1/);
  assert.match(caption, /26\.08\.2026/);
});

test("Telegram help does not expose credentials or personal data", () => {
  const help = telegramHelpText();
  assert.match(help, /\/whoami/);
  assert.doesNotMatch(help, /token|secret|email|телефон/i);
});
