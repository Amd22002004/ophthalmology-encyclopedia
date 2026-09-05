import assert from "node:assert/strict";
import test from "node:test";
import {
  EVENT_REGISTRATION_EXPORT_COLUMNS,
  buildEventRegistrationXlsx,
  eventRegistrationExportRow,
} from "./registration-export";

const row = {
  publicNumber: "STO-2026-000123",
  createdAt: new Date("2026-08-26T09:37:00.000Z"),
  status: "NEW",
  fullName: "Иванов Иван Иванович",
  phone: "+79991234567",
  email: "ivanov@example.ru",
  specialty: "ophthalmologist",
  customSpecialty: null,
  organization: "Клиника",
  position: "Врач",
  city: "Тюмень",
  comment: "Комментарий",
  utmSource: "print",
  utmMedium: "qr",
  utmCampaign: "conference_invitation_2026",
  utmContent: "registration",
  source: "event_page",
  updatedAt: new Date("2026-08-26T09:40:00.000Z"),
};

test("event XLSX export has the approved 20-column contract", async () => {
  assert.equal(EVENT_REGISTRATION_EXPORT_COLUMNS.length, 20);
  assert.deepEqual(eventRegistrationExportRow(row), [
    "STO-2026-000123",
    "2026-08-26T09:37:00.000Z",
    "REGISTERED",
    "Иванов",
    "Иван",
    "Иванович",
    "+79991234567",
    "ivanov@example.ru",
    "Врач-офтальмолог",
    "",
    "Клиника",
    "Врач",
    "Тюмень",
    "Комментарий",
    "print",
    "qr",
    "conference_invitation_2026",
    "registration",
    "event_page",
    "2026-08-26T09:40:00.000Z",
  ]);
  const workbook = await buildEventRegistrationXlsx([row]);
  assert.equal(workbook.subarray(0, 2).toString(), "PK");
  assert.ok(workbook.byteLength > 1_000);
});
