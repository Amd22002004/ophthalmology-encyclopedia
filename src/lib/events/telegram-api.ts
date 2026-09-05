export type TelegramApiTransport = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class TelegramApiError extends Error {
  constructor(
    public readonly errorCode: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(`Telegram API request failed (${errorCode})`);
    this.name = "TelegramApiError";
  }
}

type TelegramApiOptions = {
  token: string;
};

type InlineKeyboard = { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> };

function integer(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : 0;
}

function retryAfter(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function createTelegramApi(options: TelegramApiOptions, transport: TelegramApiTransport = fetch) {
  async function post(method: string, body: Record<string, unknown>) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await transport(`https://api.telegram.org/bot${options.token}/${method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const payload = await readJson(response);
      if (!response.ok || !payload?.ok) {
        const parameters = payload?.parameters;
        const retry = parameters && typeof parameters === "object"
          ? retryAfter((parameters as Record<string, unknown>).retry_after)
          : undefined;
        throw new TelegramApiError(integer(payload?.error_code) || response.status, retry);
      }
      return payload.result;
    } catch (error) {
      if (error instanceof TelegramApiError) throw error;
      throw new TelegramApiError(599);
    } finally {
      clearTimeout(timeout);
    }
  }

  async function sendDocument(chatId: string, filename: string, content: Buffer, caption: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("caption", caption);
      const documentBytes = new ArrayBuffer(content.byteLength);
      new Uint8Array(documentBytes).set(content);
      form.append("document", new Blob([documentBytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
      const response = await transport(`https://api.telegram.org/bot${options.token}/sendDocument`, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const payload = await readJson(response);
      if (!response.ok || !payload?.ok) {
        const parameters = payload?.parameters;
        const retry = parameters && typeof parameters === "object"
          ? retryAfter((parameters as Record<string, unknown>).retry_after)
          : undefined;
        throw new TelegramApiError(integer(payload?.error_code) || response.status, retry);
      }
      return payload.result;
    } catch (error) {
      if (error instanceof TelegramApiError) throw error;
      throw new TelegramApiError(599);
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    sendMessage(chatId: string, text: string, replyMarkup?: InlineKeyboard) {
      return post("sendMessage", {
        chat_id: chatId,
        text,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        disable_web_page_preview: true,
      });
    },
    editMessageText(chatId: string, messageId: number, text: string, replyMarkup?: InlineKeyboard) {
      return post("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        disable_web_page_preview: true,
      });
    },
    answerCallbackQuery(callbackId: string, text?: string) {
      return post("answerCallbackQuery", {
        callback_query_id: callbackId,
        ...(text ? { text: text.slice(0, 200) } : {}),
      });
    },
    sendDocument,
  };
}

export type TelegramApi = ReturnType<typeof createTelegramApi>;
