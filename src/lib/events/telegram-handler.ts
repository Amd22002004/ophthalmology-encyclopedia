import type { TelegramApi } from "./telegram-api";
import {
  authorizeTelegramAction,
  parseTelegramCallbackData,
  type TelegramBotConfig,
  type TelegramParsedUpdate,
} from "./telegram";
import {
  formatTelegramLatest,
  formatTelegramStats,
  parseTelegramCommand,
  telegramDeniedText,
  telegramExportConfirmationKeyboard,
  telegramExportConfirmationText,
  telegramHelpText,
  telegramLatestKeyboard,
  telegramMenuKeyboard,
  telegramMenuText,
  telegramWhoamiText,
  type TelegramLatestRow,
  type TelegramStats,
} from "./telegram-ui";

type AuditParams = {
  action: string;
  telegramUserId: string | null;
  telegramChatId: string;
  eventId?: string | null;
  deliveryStatus?: string | null;
};

export type TelegramHandlerDependencies = {
  api: Pick<TelegramApi, "sendMessage" | "editMessageText" | "answerCallbackQuery">;
  getEventId: () => Promise<string | null>;
  listLatest: (eventId: string, page: number) => Promise<{ rows: TelegramLatestRow[]; total: number; pages: number }>;
  getStats: (eventId: string) => Promise<TelegramStats | null>;
  enqueueExport: (eventId: string, chatId: string, userId: string) => Promise<{ id: string } | null>;
  recordAudit: (params: {
    action: string;
    telegramUserId?: string | null;
    telegramChatId?: string | null;
    eventId?: string | null;
    deliveryStatus?: string | null;
  }) => Promise<void>;
};

async function audit(deps: TelegramHandlerDependencies, params: AuditParams) {
  try {
    await deps.recordAudit(params);
  } catch {
    // Audit loss must not turn a valid Telegram update into a retry storm.
  }
}

function subject(update: TelegramParsedUpdate) {
  return update.subject;
}

async function sendMessage(
  update: TelegramParsedUpdate,
  text: string,
  deps: TelegramHandlerDependencies,
  auditAction?: string,
  replyMarkup?: Parameters<TelegramHandlerDependencies["api"]["sendMessage"]>[2],
  eventId?: string | null,
) {
  try {
    await deps.api.sendMessage(subject(update).chatId, text, replyMarkup);
    if (auditAction) {
      await audit(deps, {
        action: auditAction,
        telegramUserId: subject(update).userId,
        telegramChatId: subject(update).chatId,
        eventId,
        deliveryStatus: "SENT",
      });
    }
    return true;
  } catch {
    if (auditAction) {
      await audit(deps, {
        action: auditAction,
        telegramUserId: subject(update).userId,
        telegramChatId: subject(update).chatId,
        eventId,
        deliveryStatus: "FAILED",
      });
    }
    return false;
  }
}

async function editMessage(
  update: TelegramParsedUpdate,
  text: string,
  deps: TelegramHandlerDependencies,
  replyMarkup?: Parameters<TelegramHandlerDependencies["api"]["editMessageText"]>[3],
) {
  try {
    await deps.api.editMessageText(subject(update).chatId, update.messageId, text, replyMarkup);
    return true;
  } catch {
    return false;
  }
}

async function eventId(deps: TelegramHandlerDependencies) {
  try {
    return await deps.getEventId();
  } catch {
    return null;
  }
}

async function sendLatest(update: TelegramParsedUpdate, page: number, config: TelegramBotConfig, deps: TelegramHandlerDependencies, edit = false) {
  const id = await eventId(deps);
  if (!id) {
    if (edit) await editMessage(update, "Событие временно недоступно.", deps, telegramLatestKeyboard(0, 1));
    else await sendMessage(update, "Событие временно недоступно.", deps, "TELEGRAM_LATEST_LIST_REQUESTED", telegramLatestKeyboard(0, 1));
    return;
  }
  try {
    const result = await deps.listLatest(id, page);
    const safePage = Math.min(Math.max(0, page), Math.max(0, result.pages - 1));
    const text = formatTelegramLatest(result.rows, safePage, result.pages);
    const keyboard = telegramLatestKeyboard(safePage, result.pages);
    if (edit) await editMessage(update, text, deps, keyboard);
    else await sendMessage(update, text, deps, "TELEGRAM_LATEST_LIST_REQUESTED", keyboard, id);
    if (edit) await audit(deps, { action: "TELEGRAM_LATEST_LIST_REQUESTED", telegramUserId: subject(update).userId, telegramChatId: subject(update).chatId, eventId: id, deliveryStatus: "SENT" });
  } catch {
    if (edit) await editMessage(update, "Список временно недоступен.", deps, telegramLatestKeyboard(0, 1));
    else await sendMessage(update, "Список временно недоступен.", deps, "TELEGRAM_LATEST_LIST_REQUESTED", telegramLatestKeyboard(0, 1), id);
  }
}

async function sendStats(update: TelegramParsedUpdate, config: TelegramBotConfig, deps: TelegramHandlerDependencies, edit = false) {
  const id = await eventId(deps);
  if (!id) {
    if (edit) await editMessage(update, "Статистика временно недоступна.", deps);
    else await sendMessage(update, "Статистика временно недоступна.", deps, "TELEGRAM_STATS_REQUESTED");
    return;
  }
  try {
    const stats = await deps.getStats(id);
    if (!stats) throw new Error("stats unavailable");
    const text = formatTelegramStats(stats);
    if (edit) await editMessage(update, text, deps);
    else await sendMessage(update, text, deps, "TELEGRAM_STATS_REQUESTED", undefined, id);
    if (edit) await audit(deps, { action: "TELEGRAM_STATS_REQUESTED", telegramUserId: subject(update).userId, telegramChatId: subject(update).chatId, eventId: id, deliveryStatus: "SENT" });
  } catch {
    if (edit) await editMessage(update, "Статистика временно недоступна.", deps);
    else await sendMessage(update, "Статистика временно недоступна.", deps, "TELEGRAM_STATS_REQUESTED", undefined, id);
  }
}

async function sendMenu(update: TelegramParsedUpdate, config: TelegramBotConfig, deps: TelegramHandlerDependencies, edit = false) {
  const keyboard = telegramMenuKeyboard(config);
  const id = await eventId(deps);
  if (edit) {
    await editMessage(update, telegramMenuText(), deps, keyboard);
    await audit(deps, { action: "TELEGRAM_MENU_REQUESTED", telegramUserId: subject(update).userId, telegramChatId: subject(update).chatId, eventId: id, deliveryStatus: "SENT" });
  } else {
    await sendMessage(update, telegramMenuText(), deps, "TELEGRAM_MENU_REQUESTED", keyboard, id);
  }
}

async function sendExportConfirmation(update: TelegramParsedUpdate, deps: TelegramHandlerDependencies, edit = false) {
  const keyboard = telegramExportConfirmationKeyboard();
  if (edit) await editMessage(update, telegramExportConfirmationText(), deps, keyboard);
  else await sendMessage(update, telegramExportConfirmationText(), deps);
}

async function handleMessage(update: Extract<TelegramParsedUpdate, { kind: "message" }>, config: TelegramBotConfig, deps: TelegramHandlerDependencies) {
  const command = parseTelegramCommand(update.text);
  if (!command) return;

  if (command === "whoami") {
    await sendMessage(update, telegramWhoamiText(update.subject), deps);
    await audit(deps, { action: "TELEGRAM_WHOAMI_REQUESTED", telegramUserId: update.subject.userId, telegramChatId: update.subject.chatId, deliveryStatus: "SENT" });
    return;
  }

  if (!authorizeTelegramAction(update.subject, config.allowedChatIds, config.allowedUserIds)) {
    await sendMessage(update, telegramDeniedText(), deps);
    await audit(deps, { action: "TELEGRAM_UNAUTHORIZED_ACCESS_ATTEMPT", telegramUserId: update.subject.userId, telegramChatId: update.subject.chatId, deliveryStatus: "DENIED" });
    return;
  }

  switch (command) {
    case "start":
    case "menu":
      await sendMenu(update, config, deps);
      return;
    case "latest":
      await sendLatest(update, 0, config, deps);
      return;
    case "list":
      await sendExportConfirmation(update, deps);
      await audit(deps, { action: "TELEGRAM_FULL_EXPORT_REQUESTED", telegramUserId: update.subject.userId, telegramChatId: update.subject.chatId, eventId: await eventId(deps), deliveryStatus: "CONFIRMATION_SHOWN" });
      return;
    case "stats":
      await sendStats(update, config, deps);
      return;
    case "help":
    default:
      await sendMessage(update, telegramHelpText(), deps);
  }
}

async function answerCallback(update: Extract<TelegramParsedUpdate, { kind: "callback" }>, deps: TelegramHandlerDependencies, text?: string) {
  try {
    await deps.api.answerCallbackQuery(update.callbackId, text);
  } catch {
    // Telegram will expire the callback notice; the update remains handled.
  }
}

async function handleCallback(update: Extract<TelegramParsedUpdate, { kind: "callback" }>, config: TelegramBotConfig, deps: TelegramHandlerDependencies) {
  if (!authorizeTelegramAction(update.subject, config.allowedChatIds, config.allowedUserIds)) {
    await answerCallback(update, deps, telegramDeniedText());
    await audit(deps, { action: "TELEGRAM_UNAUTHORIZED_ACCESS_ATTEMPT", telegramUserId: update.subject.userId, telegramChatId: update.subject.chatId, deliveryStatus: "DENIED" });
    return;
  }

  const parsed = parseTelegramCallbackData(update.data);
  if (!parsed) {
    await answerCallback(update, deps, "Недоступное действие");
    await audit(deps, { action: "TELEGRAM_INVALID_CALLBACK", telegramUserId: update.subject.userId, telegramChatId: update.subject.chatId, deliveryStatus: "DENIED" });
    return;
  }
  await answerCallback(update, deps);

  switch (parsed.action) {
    case "latest":
      await sendLatest(update, parsed.page, config, deps, true);
      return;
    case "stats":
      await sendStats(update, config, deps, true);
      return;
    case "export":
      await sendExportConfirmation(update, deps, true);
      await audit(deps, { action: "TELEGRAM_FULL_EXPORT_REQUESTED", telegramUserId: update.subject.userId, telegramChatId: update.subject.chatId, eventId: await eventId(deps), deliveryStatus: "CONFIRMATION_SHOWN" });
      return;
    case "export-confirm": {
      const id = await eventId(deps);
      const queued = id ? await deps.enqueueExport(id, update.subject.chatId, update.subject.userId || "") : null;
      await editMessage(update, queued ? "Выгрузка поставлена в очередь. Актуальный XLSX будет отправлен в этот чат." : "Выгрузка уже формируется или событие временно недоступно.", deps);
      await audit(deps, { action: "TELEGRAM_FULL_EXPORT_REQUESTED", telegramUserId: update.subject.userId, telegramChatId: update.subject.chatId, eventId: id, deliveryStatus: queued ? "QUEUED" : "ALREADY_QUEUED" });
      return;
    }
    case "export-cancel":
      await editMessage(update, "Формирование выгрузки отменено.", deps);
      return;
    case "menu":
    case "refresh":
      await sendMenu(update, config, deps, true);
      return;
  }
}

export async function handleTelegramUpdate(update: TelegramParsedUpdate, config: TelegramBotConfig, deps: TelegramHandlerDependencies) {
  if (update.kind === "message") await handleMessage(update, config, deps);
  else await handleCallback(update, config, deps);
}
