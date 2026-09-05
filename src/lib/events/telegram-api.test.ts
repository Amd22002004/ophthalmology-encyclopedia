import assert from "node:assert/strict";
import test from "node:test";
import { createTelegramApi, TelegramApiError } from "./telegram-api";

test("Telegram API posts through the bot endpoint without putting secrets in payloads", async () => {
  let requestedUrl = "";
  let requestedBody = "";
  const api = createTelegramApi(
    { token: "123:token-value" },
    async (input, init) => {
      requestedUrl = String(input);
      requestedBody = String(init?.body);
      return new Response(JSON.stringify({ ok: true, result: { message_id: 7 } }), { status: 200 });
    },
  );

  const result = await api.sendMessage("-1001", "hello");
  assert.deepEqual(result, { message_id: 7 });
  assert.match(requestedUrl, /api\.telegram\.org\/bot123:token-value\/sendMessage$/);
  assert.match(requestedBody, /-1001/);
  assert.doesNotMatch(requestedBody, /token-value/);
});

test("Telegram API exposes retry_after without leaking response payload or token", async () => {
  const api = createTelegramApi(
    { token: "123:token-value" },
    async () => new Response(JSON.stringify({ ok: false, error_code: 429, description: "Too Many Requests", parameters: { retry_after: 17 } }), { status: 200 }),
  );
  await assert.rejects(
    api.sendMessage("-1001", "hello"),
    (error: unknown) => error instanceof TelegramApiError && error.retryAfterSeconds === 17 && !error.message.includes("token-value"),
  );
});
