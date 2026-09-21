import assert from "node:assert/strict";
import test from "node:test";
import { buildCooperationTracking } from "./tracking";

test("preserves QR UTM tracking without personal data", () => {
  const tracking = buildCooperationTracking(
    new URL("https://oftalmologia.pro/cooperation?utm_source=print&utm_medium=qr&utm_campaign=aok_booklet_2026"),
    "https://example.org/qr",
  );

  assert.deepEqual(tracking, {
    source: "PRINT_QR",
    utmSource: "print",
    utmMedium: "qr",
    utmCampaign: "aok_booklet_2026",
    utmContent: null,
    landingUrl: "https://oftalmologia.pro/cooperation?utm_source=print&utm_medium=qr&utm_campaign=aok_booklet_2026",
    referrer: "https://example.org/qr",
  });
});
