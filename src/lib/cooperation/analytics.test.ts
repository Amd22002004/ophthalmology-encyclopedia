import assert from "node:assert/strict";
import test from "node:test";
import { cooperationAnalyticsPayload } from "./analytics";

test("analytics payload contains funnel metadata but no personal data", () => {
  const payload = cooperationAnalyticsPayload("cooperation_form_submitted", {
    participantType: "DOCTOR",
    source: "WEB",
    utmCampaign: "aok_booklet_2026",
    email: "private@example.com",
    phone: "+7 900 000-00-00",
  });

  assert.deepEqual(payload, {
    event: "cooperation_form_submitted",
    participantType: "DOCTOR",
    source: "WEB",
    utmCampaign: "aok_booklet_2026",
  });
  assert.equal("email" in payload, false);
  assert.equal("phone" in payload, false);
});
