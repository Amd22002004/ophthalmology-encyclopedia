import { after } from "next/server";
import { NextResponse } from "next/server";
import { createTelegramApi } from "@/lib/events/telegram-api";
import { handleTelegramUpdate } from "@/lib/events/telegram-handler";
import { parseTelegramBotConfig, parseTelegramUpdate } from "@/lib/events/telegram";
import {
  claimTelegramUpdate,
  enqueueTelegramExportJob,
  getStoEventId,
  getTelegramRegistrationStats,
  listLatestTelegramRegistrations,
  markTelegramUpdateProcessed,
  recordTelegramAudit,
} from "@/lib/events/telegram-repository";
import { isTelegramWebhookAuthorized, TELEGRAM_WEBHOOK_MAX_BODY_BYTES, telegramBodyWithinLimit } from "@/lib/events/telegram-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const config = parseTelegramBotConfig();
  if (!config.enabled) return response({ error: "Not found" }, 404);
  if (!isTelegramWebhookAuthorized(request.headers.get("x-telegram-bot-api-secret-token"), config.webhookSecret)) {
    return response({ error: "Webhook access denied" }, 403);
  }
  if (!config.token) return response({ error: "Telegram integration is not configured" }, 503);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return response({ error: "JSON body required" }, 415);
  }
  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > TELEGRAM_WEBHOOK_MAX_BODY_BYTES) {
    return response({ error: "Request body is too large" }, 413);
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return response({ error: "Invalid request body" }, 400);
  }
  if (!telegramBodyWithinLimit(body)) return response({ error: "Request body is too large" }, 413);

  let payload: unknown;
  try {
    payload = JSON.parse(body) as unknown;
  } catch {
    return response({ error: "Invalid JSON" }, 400);
  }
  const update = parseTelegramUpdate(payload);
  if (!update) return response({ error: "Invalid Telegram update" }, 400);

  let claimed: boolean;
  try {
    claimed = await claimTelegramUpdate(update.updateId);
  } catch {
    return response({ error: "Webhook temporarily unavailable" }, 503);
  }
  if (!claimed) return response({ ok: true, duplicate: true });

  const api = createTelegramApi({ token: config.token });
  after(async () => {
    try {
      await handleTelegramUpdate(update, config, {
        api,
        getEventId: getStoEventId,
        listLatest: listLatestTelegramRegistrations,
        getStats: getTelegramRegistrationStats,
        enqueueExport: enqueueTelegramExportJob,
        recordAudit: recordTelegramAudit,
      });
    } catch {
      await recordTelegramAudit({
        action: "TELEGRAM_UPDATE_FAILED",
        telegramUserId: update.subject.userId,
        telegramChatId: update.subject.chatId,
        deliveryStatus: "FAILED",
      }).catch(() => undefined);
    } finally {
      await markTelegramUpdateProcessed(update.updateId).catch(() => undefined);
    }
  });

  return response({ ok: true, accepted: true }, 202);
}
