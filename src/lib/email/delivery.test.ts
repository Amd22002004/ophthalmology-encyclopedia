import assert from "node:assert/strict";
import test from "node:test";
import {
  getEmailHeaders,
  getPendingEmailRecipients,
  getRetryAt,
  getSuccessfulDeliveryState,
} from "./delivery";

test("internal recipients are sent independently and delivered recipients are not retried", () => {
  assert.deepEqual(
    getPendingEmailRecipients(
      ["vizus-1_marketing@mail.ru", "aok@oftalmologia.pro", "aok86e@mail.ru"],
      ["aok@oftalmologia.pro"],
    ),
    ["vizus-1_marketing@mail.ru", "aok86e@mail.ru"],
  );
});

test("successful recipient is persisted without losing previous successes", () => {
  assert.deepEqual(
    getSuccessfulDeliveryState(
      ["vizus-1_marketing@mail.ru"],
      ["aok@oftalmologia.pro"],
    ),
    ["vizus-1_marketing@mail.ru", "aok@oftalmologia.pro"],
  );
});

test("smtp envelope fixes the Return-Path and Reply-To is the applicant", () => {
  assert.deepEqual(getEmailHeaders("aok@oftalmologia.pro", "applicant@example.com"), {
    from: "Ассоциация офтальмологических клиник <aok@oftalmologia.pro>",
    replyTo: "applicant@example.com",
    envelope: { from: "aok@oftalmologia.pro" },
  });
});

test("smtp envelope includes the concrete recipient when sending", () => {
  assert.deepEqual(getEmailHeaders("aok@oftalmologia.pro", "applicant@example.com", "recipient@example.com").envelope, {
    from: "aok@oftalmologia.pro",
    to: "recipient@example.com",
  });
});

test("retry uses backoff and stops after the configured maximum", () => {
  const now = new Date("2026-09-02T10:00:00.000Z");
  assert.equal(getRetryAt(1, now)?.toISOString(), "2026-09-02T10:01:00.000Z");
  assert.equal(getRetryAt(8, now), null);
});
