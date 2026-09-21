import assert from "node:assert/strict";
import test from "node:test";
import { validateCooperationApplicationInput } from "./validation";

const validClinic = {
  participantType: "CLINIC" as const,
  organizationName: "Офтальмологическая клиника",
  inn: "6670530741",
  city: "Екатеринбург",
  contactName: "Иванов Иван Иванович",
  contactPosition: "Главный врач",
  phone: "+7 900 000-00-00",
  email: "clinic@example.com",
  interests: ["participation"],
  consentPersonalData: true,
  consentMarketing: false,
  startedAt: Date.now() - 8_000,
  website: "",
  websiteHoney: "",
};

test("validates a clinic application and normalizes its website", () => {
  const result = validateCooperationApplicationInput({
    ...validClinic,
    website: "oftalmologia.pro",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.website, "https://oftalmologia.pro");
});

test("rejects an application without personal-data consent", () => {
  const result = validateCooperationApplicationInput({ ...validClinic, consentPersonalData: false });

  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.fieldErrors.consentPersonalData, "Подтвердите согласие на обработку данных");
});

test("rejects invalid organization INN", () => {
  const result = validateCooperationApplicationInput({ ...validClinic, inn: "123" });

  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.fieldErrors.inn, "ИНН должен содержать 10 или 12 цифр");
});

test("requires either a known workplace or a custom workplace for a doctor", () => {
  const result = validateCooperationApplicationInput({
    participantType: "DOCTOR",
    firstName: "Иван",
    lastName: "Иванов",
    city: "Екатеринбург",
    specialties: ["ophthalmologist"],
    workplace: "",
    customWorkplace: "",
    phone: "+7 900 000-00-00",
    email: "doctor@example.com",
    interests: ["profile"],
    consentPersonalData: true,
    consentMarketing: false,
    startedAt: Date.now() - 8_000,
    website: "",
    websiteHoney: "",
  });

  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.fieldErrors.workplace, "Укажите место работы или заполните поле «Моей клиники нет в списке»");
});

test("marks a filled honeypot as spam without treating it as a valid application", () => {
  const result = validateCooperationApplicationInput({ ...validClinic, websiteHoney: "https://spam.example" });

  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.isSpam, true);
});
