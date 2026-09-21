import assert from "node:assert/strict";
import test from "node:test";
import { buildStoQrDestination, eventJsonLd, eventPageMetadata } from "./event-web";

test("event metadata uses the approved title and description", () => {
  const metadata = eventPageMetadata();
  assert.deepEqual(metadata.title, {
    absolute: "Конференция «Современные технологии в офтальмологии» — 15 октября 2026 года",
  });
  assert.equal(
    metadata.description,
    "Конференция Ассоциации офтальмологических клиник в Тюмени. Современные технологии рефракционной, лазерной, катарактальной и витреоретинальной хирургии. Участие бесплатное по предварительной регистрации.",
  );
  assert.equal(metadata.alternates?.canonical, "/events/sovremennye-tehnologii-v-oftalmologii-2026");
  assert.deepEqual(metadata.robots, { index: false, follow: false });
});

test("open event JSON-LD has six performers and a free registration offer", () => {
  const jsonLd = eventJsonLd();
  assert.equal(jsonLd["@type"], "Event");
  assert.equal(jsonLd.eventStatus, "https://schema.org/EventScheduled");
  assert.equal(jsonLd.eventAttendanceMode, "https://schema.org/OfflineEventAttendanceMode");
  assert.equal(jsonLd.isAccessibleForFree, true);
  assert.equal(jsonLd.startDate, "2026-10-15T15:00:00+05:00");
  assert.equal(jsonLd.location.address.streetAddress, "г. Тюмень, ул. Орджоникидзе, 46");
  assert.equal(jsonLd.performer.length, 6);
  assert.equal(jsonLd.offers?.price, "0");
  assert.match(String(jsonLd.offers?.url), /\/register$/);
});

test("QR redirect fixes the four print UTM values and preserves extra context", () => {
  const destination = buildStoQrDestination(new URL("https://localhost:3001/e/sto-2026?ref=invite"));
  assert.equal(destination.origin, "https://oftalmologia.pro");
  assert.equal(destination.pathname, "/events/sovremennye-tehnologii-v-oftalmologii-2026");
  assert.equal(destination.searchParams.get("ref"), "invite");
  assert.equal(destination.searchParams.get("utm_source"), "print");
  assert.equal(destination.searchParams.get("utm_medium"), "qr");
  assert.equal(destination.searchParams.get("utm_campaign"), "conference_invitation_2026");
  assert.equal(destination.searchParams.get("utm_content"), "registration");
});
