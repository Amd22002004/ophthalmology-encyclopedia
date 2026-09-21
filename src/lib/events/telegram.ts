import { EVENT_SPECIALTY_OPTIONS } from "./registration-validation";

export type TelegramPiiMode = "FULL" | "MASKED";

export const TELEGRAM_MAX_ATTEMPTS = 5;

export type TelegramBotConfig = {
  enabled: boolean;
  token: string | null;
  webhookSecret: string | null;
  allowedChatIds: string[];
  allowedUserIds: string[];
  defaultChatId: string | null;
  adminBaseUrl: string;
  publicBaseUrl: string;
  piiMode: TelegramPiiMode;
};

export type TelegramSubject = {
  chatId: string;
  userId: string | null;
  chatType: string;
};

export type TelegramMessageUpdate = {
  kind: "message";
  updateId: string;
  messageId: number;
  subject: TelegramSubject;
  text: string;
};

export type TelegramCallbackUpdate = {
  kind: "callback";
  updateId: string;
  messageId: number;
  callbackId: string;
  subject: TelegramSubject;
  data: string;
};

export type TelegramParsedUpdate = TelegramMessageUpdate | TelegramCallbackUpdate;

export type TelegramRegistrationForMessage = {
  publicNumber: string;
  createdAt: Date;
  status: string;
  fullName: string;
  phone: string;
  email: string;
  specialty: string | null;
  organization: string | null;
  position: string | null;
  city: string | null;
  comment: string | null;
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
};

type TelegramEnv = Record<string, string | undefined>;

function csvList(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function baseUrl(value: string | undefined, fallback: string) {
  const candidate = (value || fallback).trim().replace(/\/+$/, "");
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return fallback;
    return url.toString().replace(/\/+$/, "");
  } catch {
    return fallback;
  }
}

export function parseTelegramBotConfig(env: TelegramEnv = process.env): TelegramBotConfig {
  const piiMode = env.TELEGRAM_EVENT_PII_MODE?.trim().toUpperCase() === "FULL" ? "FULL" : "MASKED";
  return {
    enabled: /^(1|true|yes|on)$/i.test(env.TELEGRAM_EVENT_BOT_ENABLED?.trim() || ""),
    token: env.TELEGRAM_EVENT_BOT_TOKEN?.trim() || null,
    webhookSecret: env.TELEGRAM_EVENT_WEBHOOK_SECRET?.trim() || null,
    allowedChatIds: csvList(env.TELEGRAM_EVENT_ALLOWED_CHAT_IDS),
    allowedUserIds: csvList(env.TELEGRAM_EVENT_ALLOWED_USER_IDS),
    defaultChatId: env.TELEGRAM_EVENT_DEFAULT_CHAT_ID?.trim() || null,
    adminBaseUrl: baseUrl(env.TELEGRAM_EVENT_ADMIN_BASE_URL, "https://oftalmologia.pro/admin"),
    publicBaseUrl: baseUrl(env.TELEGRAM_EVENT_PUBLIC_BASE_URL, "https://oftalmologia.pro"),
    piiMode,
  };
}

function idString(value: unknown) {
  if (typeof value === "string" && /^-?\d+$/.test(value)) return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  return null;
}

function messageId(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function parseTelegramUpdate(value: unknown): TelegramParsedUpdate | null {
  if (!value || typeof value !== "object") return null;
  const update = value as Record<string, unknown>;
  const updateId = idString(update.update_id);
  if (!updateId) return null;

  const message = update.message;
  if (message && typeof message === "object") {
    const record = message as Record<string, unknown>;
    const chat = record.chat;
    const from = record.from;
    if (!chat || typeof chat !== "object") return null;
    const chatRecord = chat as Record<string, unknown>;
    const chatId = idString(chatRecord.id);
    const chatType = typeof chatRecord.type === "string" ? chatRecord.type : null;
    const userId = from && typeof from === "object" ? idString((from as Record<string, unknown>).id) : null;
    const id = messageId(record.message_id);
    const text = typeof record.text === "string" ? record.text.slice(0, 4_096) : "";
    if (!chatId || !chatType || !id) return null;
    return {
      kind: "message",
      updateId,
      messageId: id,
      subject: { chatId, userId, chatType },
      text,
    };
  }

  const callback = update.callback_query;
  if (!callback || typeof callback !== "object") return null;
  const record = callback as Record<string, unknown>;
  const from = record.from;
  const callbackMessage = record.message;
  if (!from || typeof from !== "object" || !callbackMessage || typeof callbackMessage !== "object") return null;
  const fromId = idString((from as Record<string, unknown>).id);
  const callbackRecord = callbackMessage as Record<string, unknown>;
  const chat = callbackRecord.chat;
  const callbackId = typeof record.id === "string" ? record.id.slice(0, 256) : "";
  const data = typeof record.data === "string" ? record.data.slice(0, 64) : "";
  const id = messageId(callbackRecord.message_id);
  if (!fromId || !chat || typeof chat !== "object" || !callbackId || !data || !id) return null;
  const chatRecord = chat as Record<string, unknown>;
  const chatId = idString(chatRecord.id);
  const chatType = typeof chatRecord.type === "string" ? chatRecord.type : null;
  if (!chatId || !chatType) return null;
  return {
    kind: "callback",
    updateId,
    messageId: id,
    callbackId,
    subject: { chatId, userId: fromId, chatType },
    data,
  };
}

export function authorizeTelegramAction(subject: Pick<TelegramSubject, "chatId" | "userId">, allowedChatIds: readonly string[], allowedUserIds: readonly string[]) {
  return Boolean(subject.userId && allowedChatIds.includes(subject.chatId) && allowedUserIds.includes(subject.userId));
}

const callbackActions = new Set(["latest", "stats", "export", "export-confirm", "export-cancel", "menu", "refresh"]);

export function buildTelegramCallbackData(action: string, page?: number) {
  if (!callbackActions.has(action)) throw new Error("Недопустимое действие Telegram");
  if (page === undefined) return `event:${action}`;
  if (!Number.isInteger(page) || page < 0 || page > 50) throw new Error("Недопустимая страница Telegram");
  return `event:${action}:${page}`;
}

export function parseTelegramCallbackData(data: string) {
  const match = /^event:(latest|stats|export|export-confirm|export-cancel|menu|refresh)(?::([0-9]{1,2}))?$/.exec(data);
  if (!match) return null;
  return { action: match[1], page: match[2] ? Number(match[2]) : 0 } as const;
}

export function maskTelegramPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 11) {
    const country = digits.startsWith("8") ? "7" : digits.slice(0, digits.length - 10);
    const local = digits.slice(-10);
    return `+${country} ${local.slice(0, 3)} ***-**-${local.slice(-2)}`;
  }
  if (digits.length >= 4) return `***${digits.slice(-2)}`;
  return "***";
}

export function maskTelegramEmail(value: string) {
  const [local, domain] = value.split("@", 2);
  if (!local || !domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

function statusLabel(status: string) {
  return status === "NEW" ? "REGISTERED" : status;
}

function date(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Yekaterinburg" }).format(value);
}

function line(label: string, value: string | null | undefined) {
  return value ? `${label}:\n${value}` : null;
}

function specialtyLabel(value: string | null) {
  return EVENT_SPECIALTY_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function formatTelegramRegistration(registration: TelegramRegistrationForMessage, piiMode: TelegramPiiMode, adminUrl: string) {
  const phone = piiMode === "FULL" ? registration.phone : maskTelegramPhone(registration.phone);
  const email = piiMode === "FULL" ? registration.email : maskTelegramEmail(registration.email);
  const source = [registration.utmSource, registration.utmMedium, registration.utmCampaign, registration.utmContent].filter(Boolean).join(" / ") || registration.source;
  return [
    "🆕 НОВАЯ РЕГИСТРАЦИЯ",
    "",
    "Конференция:\n«Современные технологии в офтальмологии»",
    `Номер:\n${registration.publicNumber}`,
    `Дата регистрации:\n${date(registration.createdAt)}`,
    line("ФИО", registration.fullName),
    line("Телефон", phone),
    line("Email", email),
    line("Специальность", specialtyLabel(registration.specialty)),
    line("Организация", registration.organization),
    line("Должность", registration.position),
    line("Город", registration.city),
    `Статус:\n${statusLabel(registration.status)}`,
    line("Источник", source),
    line("Комментарий", registration.comment),
    "",
    `Открыть в админке:\n${adminUrl}`,
  ].filter((value): value is string => Boolean(value)).join("\n\n");
}

export function telegramRetryDelayMs(attempt: number, retryAfterSeconds?: number) {
  if (retryAfterSeconds !== undefined && Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(60_000, Math.ceil(retryAfterSeconds) * 1_000);
  }
  const safeAttempt = Math.max(1, Math.min(7, Math.floor(attempt)));
  return Math.min(60_000, 1_000 * 2 ** (safeAttempt - 1));
}

export function telegramAdminUrl(config: TelegramBotConfig, eventId: string, registrationId?: string) {
  const path = registrationId ? `/events/${encodeURIComponent(eventId)}?registration=${encodeURIComponent(registrationId)}` : `/events/${encodeURIComponent(eventId)}`;
  return `${config.adminBaseUrl}${path}`;
}
