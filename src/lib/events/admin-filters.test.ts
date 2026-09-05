import assert from "node:assert/strict";
import test from "node:test";
import { buildEventRegistrationWhere } from "./admin-filters";

test("event admin filters combine status, location, source and UTM", () => {
  const where = buildEventRegistrationWhere({
    status: "CONFIRMED",
    city: "Тюмень",
    specialty: "ophthalmologist",
    organization: "Клиника",
    source: "event_page",
    utmCampaign: "conference_invitation_2026",
  });
  assert.equal(where.status, "CONFIRMED");
  assert.deepEqual(where.city, { contains: "Тюмень", mode: "insensitive" });
  assert.deepEqual(where.specialty, { contains: "ophthalmologist", mode: "insensitive" });
  assert.deepEqual(where.organization, { contains: "Клиника", mode: "insensitive" });
  assert.equal(where.source, "event_page");
  assert.deepEqual(where.utmCampaign, { contains: "conference_invitation_2026", mode: "insensitive" });
});

test("event admin search covers number, FIO, contacts and organization", () => {
  const where = buildEventRegistrationWhere({ query: "Анна" });
  assert.equal(where.OR?.length, 7);
  assert.deepEqual(where.OR?.[0], { publicNumber: { contains: "Анна", mode: "insensitive" } });
});

test("event admin accepts the attendance no-show status", () => {
  const where = buildEventRegistrationWhere({ status: "NO_SHOW" });
  assert.equal(where.status, "NO_SHOW");
});
