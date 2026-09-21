import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");

test("Event domain keeps the public event snapshot and publication gates", () => {
  for (const model of ["Event", "EventSpeaker", "EventTalk", "EventRegistration"]) {
    assert.match(schema, new RegExp(`model ${model} \\{`));
  }

  assert.match(schema, /registrationOpen\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /programPublished\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /speakersPublished\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /startAt\s+DateTime\?/);
  assert.match(schema, /endAt\s+DateTime\?/);
});

test("Event registrations have isolated duplicate keys, operational notes and outbox", () => {
  assert.match(schema, /@@unique\(\[eventId, email\]\)/);
  assert.match(schema, /@@unique\(\[eventId, phone\]\)/);
  assert.match(schema, /model EventRegistrationNote\s+\{/);
  assert.match(schema, /model EventRegistrationNotification\s+\{/);
  assert.match(schema, /model EventRegistrationStatusHistory\s+\{/);
  assert.match(schema, /enum EventRegistrationStatus\s+\{/);
  assert.match(schema, /enum EventTalkKind\s+\{/);
});

test("Telegram delivery uses the existing registration outbox and has durable idempotency/audit state", () => {
  assert.match(schema, /comment\s+String\?/);
  assert.match(schema, /NO_SHOW/);
  assert.match(schema, /enum EventRegistrationNotificationChannel\s+\{/);
  assert.match(schema, /TELEGRAM/);
  assert.match(schema, /GOOGLE_SHEETS/);
  assert.match(schema, /type\s+EventRegistrationNotificationType/);
  assert.match(schema, /EVENT_REGISTRATION_CREATED/);
  assert.match(schema, /idempotencyKey\s+String\?/);
  assert.match(schema, /model EventTelegramUpdate\s+\{/);
  assert.match(schema, /updateId\s+BigInt\s+@unique/);
  assert.match(schema, /model EventTelegramAuditEvent\s+\{/);
  assert.match(schema, /model EventTelegramJob\s+\{/);
});
