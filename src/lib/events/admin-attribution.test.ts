import assert from "node:assert/strict";
import test from "node:test";
import { getEventRegistrationAttribution } from "./admin-attribution";

test("labels Natalia referrals from the exact UTM source", () => {
  assert.deepEqual(
    getEventRegistrationAttribution({
      source: "event_page",
      utmSource: "Natalia",
      utmMedium: "referral",
      utmCampaign: "sto-2026",
      utmContent: "direct_share",
    }),
    {
      label: "От Натальи",
      isNatalia: true,
      medium: "referral",
      campaign: "sto-2026 / direct_share",
    },
  );
});

test("falls back to the technical source when UTM is absent", () => {
  assert.deepEqual(
    getEventRegistrationAttribution({ source: "event_page" }),
    {
      label: "Страница конференции",
      isNatalia: false,
      medium: null,
      campaign: null,
    },
  );
});
