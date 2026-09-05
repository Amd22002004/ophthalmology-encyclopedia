import assert from "node:assert/strict";
import test from "node:test";
import { getInternalNotificationRecipients, parseEmailRecipients } from "./recipients";

test("recipient parser trims, validates and deduplicates addresses", () => {
  assert.deepEqual(
    parseEmailRecipients(" aok@oftalmologia.pro, invalid, aok@oftalmologia.pro; aok86e@mail.ru "),
    ["aok@oftalmologia.pro", "aok86e@mail.ru"],
  );
});

test("internal recipient list uses the new explicit list before legacy fallback", () => {
  assert.deepEqual(
    getInternalNotificationRecipients({
      AOK_NOTIFICATION_EMAILS: "vizus-1_marketing@mail.ru,aok@oftalmologia.pro,aok86e@mail.ru",
      APPEAL_NOTIFICATION_EMAIL: "legacy@example.com",
    }),
    ["vizus-1_marketing@mail.ru", "aok@oftalmologia.pro", "aok86e@mail.ru"],
  );
});
