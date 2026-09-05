import assert from "node:assert/strict";
import test from "node:test";
import { validateAppealInput } from "./validation";

const validInput = {
  name: "  Иван Иванов  ",
  phone: "+7 900 000-00-00",
  email: "",
  city: "Тюмень",
  investigationSlug: "proverka-oborudovaniya-glaztsentr-tyumen",
  reporterRoles: ["patient"],
  categories: ["investigation_information", "provide_documents"],
  requestedActions: ["review_circumstances", "contact_me"],
  description: "Подробное описание обстоятельств обращения и имеющихся документов.",
  operationDate: "2026-07-10",
  reportedClinicName: "Название, указанное заявителем",
  reportedDoctorName: "Врач, указанный заявителем",
  reportedEquipmentName: "Модель, указанная заявителем",
  collectiveInterest: true,
  consentAccepted: true,
  consentTemplateId: "consent-template-id",
  website: "",
};

test("нормализует допустимое обращение и сохраняет интерес к коллективному информированию отдельно", () => {
  const result = validateAppealInput(validInput);

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.name, "Иван Иванов");
  assert.equal(result.data.phone, "+7 900 000-00-00");
  assert.equal(result.data.email, null);
  assert.equal(result.data.collectiveInterest, true);
  assert.deepEqual(result.data.categories, ["investigation_information", "provide_documents"]);
});

test("отклоняет обращение без телефона и email", () => {
  const result = validateAppealInput({ ...validInput, phone: "", email: "" });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.fieldErrors.contact, "Укажите телефон или email");
});

test("отклоняет неизвестные категории вместо сохранения произвольного значения", () => {
  const result = validateAppealInput({ ...validInput, categories: ["unverified_category"] });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.fieldErrors.categories, "Выберите допустимые категории обращения");
});

test("требует принятия активного шаблона согласия", () => {
  const result = validateAppealInput({ ...validInput, consentAccepted: false });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.fieldErrors.consent, "Необходимо подтвердить согласие");
});

test("honeypot тихо помечает автоматическую отправку", () => {
  const result = validateAppealInput({ ...validInput, website: "https://spam.example" });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.isSpam, true);
});

