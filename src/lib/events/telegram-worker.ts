import { randomUUID } from "node:crypto";
import { buildEventRegistrationXlsx, telegramExportFilename, type EventRegistrationExportRow } from "./registration-export";
import {
  formatTelegramRegistration,
  telegramAdminUrl,
  TELEGRAM_MAX_ATTEMPTS,
  type TelegramBotConfig,
  type TelegramRegistrationForMessage,
} from "./telegram";
import {
  telegramExportCaption,
  type TelegramInlineKeyboard,
} from "./telegram-ui";
import { createTelegramApi, TelegramApiError, type TelegramApi } from "./telegram-api";

type TelegramWorkerApi = Pick<TelegramApi, "sendMessage" | "sendDocument">;

type NotificationRecord = {
  id: string;
  attempts: number;
  registration: TelegramRegistrationForMessage & {
    id: string;
    event: { id: string; slug: string };
  };
};

type TelegramJobRecord = {
  id: string;
  eventId: string;
  attempts: number;
  telegramChatId: string;
  telegramUserId: string;
};

export type TelegramWorkerDependencies = {
  api?: TelegramWorkerApi;
  findOutbox: (limit?: number) => Promise<Array<{ id: string }>>;
  claimNotification: (notificationId: string, workerId: string) => Promise<boolean>;
  getNotification: (notificationId: string) => Promise<NotificationRecord | null>;
  updateNotification: (notificationId: string, params: { status: "SENT" | "FAILED"; attempts: number; nextAttemptAt?: Date | null; error?: string | null }) => Promise<void>;
  findJobs: (limit?: number) => Promise<Array<{ id: string }>>;
  claimJob: (jobId: string, workerId: string) => Promise<boolean>;
  getJob: (jobId: string) => Promise<TelegramJobRecord | null>;
  listRegistrations: (eventId: string) => Promise<EventRegistrationExportRow[]>;
  finishJob: (jobId: string, params: { status: "SENT" | "FAILED"; attempts: number; error?: string | null; nextAttemptAt?: Date | null }) => Promise<void>;
  recordAudit: (params: {
    action: string;
    telegramUserId?: string | null;
    telegramChatId?: string | null;
    eventId?: string | null;
    registrationId?: string | null;
    deliveryStatus?: string | null;
  }) => Promise<void>;
};

async function loadDefaultDependencies(): Promise<TelegramWorkerDependencies> {
  const repository = await import("./telegram-repository");
  return {
    findOutbox: repository.findTelegramOutbox,
    claimNotification: repository.claimTelegramNotification,
    getNotification: repository.getTelegramRegistrationNotification as TelegramWorkerDependencies["getNotification"],
    updateNotification: repository.updateTelegramNotificationDelivery,
    findJobs: repository.findTelegramJobs,
    claimJob: repository.claimTelegramJob,
    getJob: repository.getTelegramJob as TelegramWorkerDependencies["getJob"],
    listRegistrations: repository.listTelegramExportRegistrations,
    finishJob: repository.finishTelegramJob,
    recordAudit: repository.recordTelegramAudit,
  };
}

function safeError(error: unknown) {
  if (error instanceof TelegramApiError) return `Telegram API error ${error.errorCode}`;
  return "Ошибка доставки Telegram";
}

async function safeAudit(deps: TelegramWorkerDependencies, params: Parameters<TelegramWorkerDependencies["recordAudit"]>[0]) {
  try {
    await deps.recordAudit(params);
  } catch {
    // Delivery state remains authoritative when audit persistence is unavailable.
  }
}

function retryAt(attempt: number, error: unknown, now = new Date()) {
  if (attempt >= TELEGRAM_MAX_ATTEMPTS) return null;
  const retryAfterSeconds = error instanceof TelegramApiError ? error.retryAfterSeconds : undefined;
  const delay = retryAfterSeconds && retryAfterSeconds > 0
    ? Math.min(60_000, Math.ceil(retryAfterSeconds) * 1_000)
    : Math.min(60_000, 1_000 * 2 ** Math.max(0, Math.min(6, attempt - 1)));
  return new Date(now.getTime() + delay);
}

export function telegramNotificationKeyboard(config: TelegramBotConfig, eventId: string, registrationId: string): TelegramInlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: "Открыть в админке", url: telegramAdminUrl(config, eventId, registrationId) }],
      [
        { text: "Последние регистрации", callback_data: "event:latest:0" },
        { text: "Полный список", callback_data: "event:export" },
      ],
    ],
  };
}

export function buildTelegramExportSummary(registrations: Array<{ status: string }>) {
  const total = registrations.length;
  const cancelled = registrations.filter((registration) => registration.status === "CANCELLED").length;
  return { total, active: total - cancelled, cancelled };
}

async function processNotification(id: string, config: TelegramBotConfig, workerId: string, api: TelegramWorkerApi, deps: TelegramWorkerDependencies) {
  if (!(await deps.claimNotification(id, workerId))) return "skipped" as const;
  const notification = await deps.getNotification(id);
  if (!notification) return "skipped" as const;
  const attempt = notification.attempts + 1;
  const registration = notification.registration;
  try {
    if (registration.event.slug !== "sovremennye-tehnologii-v-oftalmologii-2026") throw new Error("Event mismatch");
    if (!config.defaultChatId || !config.allowedChatIds.includes(config.defaultChatId)) throw new Error("Telegram destination is not allowlisted");
    const text = formatTelegramRegistration(
      registration,
      config.piiMode,
      telegramAdminUrl(config, registration.event.id, registration.id),
    );
    await api.sendMessage(
      config.defaultChatId,
      text.length > 3_900 ? `${text.slice(0, 3_897)}...` : text,
      telegramNotificationKeyboard(config, registration.event.id, registration.id),
    );
    await deps.updateNotification(id, { status: "SENT", attempts: attempt, nextAttemptAt: null });
    await safeAudit(deps, { action: "TELEGRAM_REGISTRATION_NOTIFICATION_SENT", telegramChatId: config.defaultChatId, eventId: registration.event.id, registrationId: registration.id, deliveryStatus: "SENT" });
    return "sent" as const;
  } catch (error) {
    const message = safeError(error);
    await deps.updateNotification(id, { status: "FAILED", attempts: attempt, nextAttemptAt: retryAt(attempt, error), error: message });
    await safeAudit(deps, { action: "TELEGRAM_REGISTRATION_NOTIFICATION_FAILED", telegramChatId: config.defaultChatId, eventId: registration.event.id, registrationId: registration.id, deliveryStatus: "FAILED" });
    return "failed" as const;
  }
}

async function processExportJob(id: string, config: TelegramBotConfig, workerId: string, api: TelegramWorkerApi, deps: TelegramWorkerDependencies) {
  if (!(await deps.claimJob(id, workerId))) return "skipped" as const;
  const job = await deps.getJob(id);
  if (!job) return "skipped" as const;
  const attempt = job.attempts + 1;
  try {
    if (!config.allowedChatIds.includes(job.telegramChatId) || !config.allowedUserIds.includes(job.telegramUserId)) throw new Error("Telegram requester is not allowlisted");
    const registrations = await deps.listRegistrations(job.eventId);
    const workbook = await buildEventRegistrationXlsx(registrations);
    const summary = buildTelegramExportSummary(registrations);
    await api.sendDocument(job.telegramChatId, telegramExportFilename(), workbook, telegramExportCaption(summary));
    await deps.finishJob(id, { status: "SENT", attempts: attempt, nextAttemptAt: null });
    await safeAudit(deps, { action: "TELEGRAM_FULL_EXPORT_SENT", telegramUserId: job.telegramUserId, telegramChatId: job.telegramChatId, eventId: job.eventId, deliveryStatus: "SENT" });
    return "sent" as const;
  } catch (error) {
    const message = safeError(error);
    await deps.finishJob(id, { status: "FAILED", attempts: attempt, nextAttemptAt: retryAt(attempt, error), error: message });
    await safeAudit(deps, { action: "TELEGRAM_FULL_EXPORT_FAILED", telegramUserId: job.telegramUserId, telegramChatId: job.telegramChatId, eventId: job.eventId, deliveryStatus: "FAILED" });
    return "failed" as const;
  }
}

export async function runTelegramWorker(config: TelegramBotConfig, dependencies?: TelegramWorkerDependencies, apiOverride?: TelegramWorkerApi) {
  const result = { notificationsSent: 0, notificationsFailed: 0, exportsSent: 0, exportsFailed: 0, skipped: 0, error: null as string | null };
  if (!config.enabled) {
    result.error = "Telegram integration disabled";
    return result;
  }
  if (!config.token || !config.defaultChatId || !config.allowedChatIds.includes(config.defaultChatId)) {
    result.error = "Telegram integration is not configured";
    return result;
  }
  const deps = dependencies || await loadDefaultDependencies();
  const api = apiOverride || deps.api || createTelegramApi({ token: config.token });
  const workerId = `telegram-worker:${process.pid}:${randomUUID()}`;
  for (const item of await deps.findOutbox()) {
    const status = await processNotification(item.id, config, workerId, api, deps);
    if (status === "sent") result.notificationsSent += 1;
    else if (status === "failed") result.notificationsFailed += 1;
    else result.skipped += 1;
  }
  for (const item of await deps.findJobs()) {
    const status = await processExportJob(item.id, config, workerId, api, deps);
    if (status === "sent") result.exportsSent += 1;
    else if (status === "failed") result.exportsFailed += 1;
    else result.skipped += 1;
  }
  return result;
}
