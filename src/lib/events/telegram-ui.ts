import {
  buildTelegramCallbackData,
  type TelegramBotConfig,
} from "./telegram";
import { EVENT_SPECIALTY_OPTIONS } from "./registration-validation";

export type TelegramInlineKeyboard = {
  inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
};

export type TelegramLatestRow = {
  publicNumber: string;
  fullName: string;
  organization: string | null;
  city: string | null;
  status: string;
  createdAt: Date;
};

export type TelegramStats = {
  total: number;
  statuses: Record<string, number>;
  today: number;
  qr: number;
  cities: Array<{ name: string; count: number }>;
  specialties: Array<{ name: string; count: number }>;
};

export function parseTelegramCommand(text: string) {
  const match = /^\s*\/([a-z][a-z0-9_]{0,31})(?:@[a-z0-9_]{1,64})?(?:\s|$)/i.exec(text);
  return match?.[1]?.toLowerCase() || null;
}

export function telegramMenuText() {
  return [
    "Современные технологии в офтальмологии",
    "",
    "Служебное меню регистраций.",
  ].join("\n");
}

export function telegramMenuKeyboard(config: Pick<TelegramBotConfig, "adminBaseUrl">): TelegramInlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: "🆕 Последние регистрации", callback_data: buildTelegramCallbackData("latest", 0) }],
      [{ text: "📥 Полный список участников", callback_data: buildTelegramCallbackData("export") }],
      [{ text: "📊 Статистика", callback_data: buildTelegramCallbackData("stats") }],
      [{ text: "🌐 Открыть админ-панель", url: config.adminBaseUrl }],
      [{ text: "🔄 Обновить", callback_data: buildTelegramCallbackData("refresh") }],
    ],
  };
}

export function telegramHelpText() {
  return [
    "Команды служебного бота:",
    "/start или /menu — открыть меню",
    "/latest — последние регистрации",
    "/list — подготовить полный XLSX-список",
    "/stats — статистика регистраций",
    "/help — эта справка",
    "/whoami — показать Telegram ID для настройки доступа",
  ].join("\n");
}

export function telegramDeniedText() {
  return "Доступ к служебному боту не предоставлен.";
}

export function telegramWhoamiText(subject: { userId: string | null; chatId: string; chatType: string }) {
  return [
    "Служебные Telegram ID:",
    `user_id: ${subject.userId || "не определён"}`,
    `chat_id: ${subject.chatId}`,
    `тип чата: ${subject.chatType}`,
  ].join("\n");
}

function statusLabel(status: string) {
  return status === "NEW" ? "REGISTERED" : status;
}

function date(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Yekaterinburg",
  }).format(value);
}

export function telegramLatestKeyboard(page: number, pages: number): TelegramInlineKeyboard {
  const controls: Array<{ text: string; callback_data: string }> = [];
  if (page > 0) controls.push({ text: "← Назад", callback_data: buildTelegramCallbackData("latest", page - 1) });
  if (page + 1 < pages) controls.push({ text: "Вперёд →", callback_data: buildTelegramCallbackData("latest", page + 1) });
  return {
    inline_keyboard: [
      ...(controls.length ? [controls] : []),
      [{ text: "↩ Меню", callback_data: buildTelegramCallbackData("menu") }],
    ],
  };
}

export function formatTelegramLatest(rows: TelegramLatestRow[], page: number, pages: number) {
  const lines = ["🆕 ПОСЛЕДНИЕ РЕГИСТРАЦИИ", "", `Страница ${page + 1} / ${Math.max(1, pages)}`];
  if (!rows.length) lines.push("", "Регистраций пока нет.");
  for (const row of rows) {
    lines.push(
      "",
      `${row.publicNumber} · ${statusLabel(row.status)}`,
      row.fullName,
      [row.organization, row.city].filter(Boolean).join(" · ") || "Город и организация не указаны",
      date(row.createdAt),
    );
  }
  return lines.join("\n");
}

function count(statuses: Record<string, number>, status: string) {
  return statuses[status] || 0;
}

function specialtyLabel(value: string) {
  return EVENT_SPECIALTY_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function formatTelegramStats(stats: TelegramStats) {
  const lines = [
    "📊 СТАТИСТИКА",
    "",
    `Всего: ${stats.total}`,
    `REGISTERED: ${count(stats.statuses, "NEW")}`,
    `CONFIRMED: ${count(stats.statuses, "CONFIRMED")}`,
    `CANCELLED: ${count(stats.statuses, "CANCELLED")}`,
    `ATTENDED: ${count(stats.statuses, "ATTENDED")}`,
    `NO_SHOW: ${count(stats.statuses, "NO_SHOW")}`,
    "",
    `Из QR приглашения: ${stats.qr}`,
    `За сегодня: ${stats.today}`,
    "",
    "Топ городов:",
  ];
  lines.push(...(stats.cities.length ? stats.cities.map((row, index) => `${index + 1}. ${row.name} — ${row.count}`) : ["Нет данных"]));
  lines.push("", "Топ специальностей:");
  lines.push(...(stats.specialties.length ? stats.specialties.map((row, index) => `${index + 1}. ${specialtyLabel(row.name)} — ${row.count}`) : ["Нет данных"]));
  return lines.join("\n");
}

export function telegramExportConfirmationText() {
  return [
    "Сформировать актуальный список зарегистрированных участников?",
    "",
    "Файл будет заново собран из PostgreSQL и отправлен в этот чат.",
  ].join("\n");
}

export function telegramExportConfirmationKeyboard(): TelegramInlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: "Да, сформировать XLSX", callback_data: buildTelegramCallbackData("export-confirm") }],
      [{ text: "Отмена", callback_data: buildTelegramCallbackData("export-cancel") }],
    ],
  };
}

export function telegramExportCaption(summary: { total: number; active: number; cancelled: number }, now = new Date()) {
  const generatedAt = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Yekaterinburg",
  }).format(now);
  return [
    `Всего регистраций: ${summary.total}`,
    `Активных: ${summary.active}`,
    `Отменено: ${summary.cancelled}`,
    `Файл сформирован: ${generatedAt}`,
  ].join("\n");
}
