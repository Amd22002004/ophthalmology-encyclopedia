import assert from "node:assert/strict";
import test from "node:test";
import { buildEventIcs } from "./registration-ics";
import { formatEventRegistrationNumber } from "./registration-reference";
import { validateEventRegistrationInput } from "./registration-validation";

const validInput = {
  fullName: "Анна Петрова",
  phone: "+7 (999) 123-45-67",
  email: " ANNA@example.com ",
  comment: "Нужна программа",
  specialty: "ophthalmologist",
  organization: "Клиника «Зрение»",
  consentPersonalData: true,
  startedAt: Date.now() - 5_000,
};

test("registration validation normalizes contact fields and keeps non-PII tracking", () => {
  const result = validateEventRegistrationInput(validInput);
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.phone, "+79991234567");
  assert.equal(result.data.email, "anna@example.com");
  assert.equal(result.data.specialty, "ophthalmologist");
  assert.equal(result.data.organization, "Клиника «Зрение»");
  assert.equal(result.data.consentPersonalData, true);
  assert.equal(result.data.comment, "Нужна программа");
});

test("registration validation requires a non-empty organization name", () => {
  const result = validateEventRegistrationInput({ ...validInput, organization: "  " });
  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.fieldErrors.organization, "Укажите название организации");
});

test("registration validation requires custom specialty for the other option", () => {
  const result = validateEventRegistrationInput({
    ...validInput,
    specialty: "other",
    customSpecialty: "",
  });
  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.fieldErrors.customSpecialty, "Укажите специализацию");
});

test("registration validation gates consent and rejects obvious bots", () => {
  const noConsent = validateEventRegistrationInput({ ...validInput, consentPersonalData: false });
  assert.equal(noConsent.success, false);
  if (!noConsent.success) assert.equal(noConsent.fieldErrors.consentPersonalData, "Подтвердите согласие на обработку данных");

  const honeypot = validateEventRegistrationInput({ ...validInput, websiteHoney: "filled" });
  assert.equal(honeypot.success, false);
  if (!honeypot.success) assert.equal(honeypot.isSpam, true);
});

test("registration number and calendar attachment keep the approved event facts", () => {
  assert.equal(formatEventRegistrationNumber(7), "AOK-EVENT-2026-000007");
  const ics = buildEventIcs();
  assert.match(ics, /DTSTART:20261015T100000Z/);
  assert.match(ics, /DoubleTree by Hilton Tyumen/);
  assert.match(ics, /https:\/\/oftalmologia\.pro\/events\/sovremennye-tehnologii-v-oftalmologii-2026/);
  assert.doesNotMatch(ics, /DTEND:/);
});
