import assert from "node:assert/strict";
import test from "node:test";
import type { IndependentControlCriterion, IndependentControlMethodology } from "./types";
import { validateIndependentControlCorpus } from "./validate";

const validMethodology = (): IndependentControlMethodology => ({
  slug: "independent-control",
  title: "Независимый контроль",
  summary: "Проверяемая методология независимого контроля.",
  legalStatusNote: "Не является нормативным актом.",
  bibliographicDetails: "Независимый контроль. Издание 2026.",
  officialMethodologyUrl: "https://example.test/methodology",
  rightsNote: "Публикуется библиографическое описание.",
  sources: [{
    title: "Методология",
    kind: "OFFICIAL_METHODOLOGY",
    url: "https://example.test/source",
    sha256: "b".repeat(64),
    rightsStatus: "OPEN_LICENSE",
    rightsNote: "Открытая лицензия.",
    publicFileUrl: "https://example.test/source.pdf",
  }],
  criteria: [{
    stableKey: "sterilization-log",
    sourceLocator: "section-4.2",
    sectionKey: "sterilization",
    sectionTitle: "Стерилизация",
    statement: "Журнал стерилизации ведется и доступен для проверки.",
    title: "Журнал стерилизации",
    whatIsChecked: "Наличие и ведение журнала стерилизации.",
    checkQuestion: "Представлен ли журнал стерилизации?",
    factToEstablish: "Факт ведения журнала за проверяемый период.",
    confirmingPrimaryDocument: "Журнал стерилизации.",
    evidenceRequired: "Первичный журнал с датами и подписями.",
    evidenceThreshold: "Документ охватывает проверяемый период.",
    applicabilityNote: "Применимо при оказании услуг, требующих стерилизации.",
    sourceDivergenceNote: "Локальная форма не заменяет нормативное требование.",
    basisKind: "DIRECT_NORM",
    allowedStatuses: ["CONFIRMED", "REQUIRES_VERIFICATION", "NOT_CONFIRMED"],
    normLinks: [{ regulationKey: "sanitary-rules", provisionKey: "p-4-2", checkKey: "sterilization-log", role: "DIRECT_REQUIREMENT", editionBound: true }],
    isPublished: true,
    publishedAt: new Date("2026-08-12T00:00:00.000Z"),
    evidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
    sortOrder: 10,
  }],
  seo: { title: "Независимый контроль", description: "Методология проверки." },
  isPublished: true,
  publishedAt: new Date("2026-08-12T00:00:00.000Z"),
  evidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
});

test("отклоняет дубли ключей и локаторов, неверный SHA-256, будущую дату и пустые обязательные поля", () => {
  const methodology = validMethodology();
  methodology.title = "";
  methodology.publishedAt = new Date("2999-01-01T00:00:00.000Z");
  methodology.sources[0].sha256 = "invalid";
  (methodology.criteria as IndependentControlCriterion[]).push({ ...methodology.criteria[0] });

  const result = validateIndependentControlCorpus([methodology]);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("methodology:independent-control:TITLE_REQUIRED"));
  assert.ok(result.errors.includes("methodology:independent-control:FUTURE_PUBLICATION_DATE"));
  assert.ok(result.errors.includes("source:independent-control:0:INVALID_SHA256"));
  assert.ok(result.errors.includes("criterion:independent-control:sterilization-log:DUPLICATE_STABLE_KEY"));
  assert.ok(result.errors.includes("criterion:independent-control:section-4.2:DUPLICATE_SOURCE_LOCATOR"));
});

test("отклоняет direct-norm критерий без нормы и пустой обязательный вопрос проверки", () => {
  const methodology = validMethodology();
  methodology.criteria[0].normLinks = [];
  methodology.criteria[0].checkQuestion = "";

  const result = validateIndependentControlCorpus([methodology]);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("criterion:independent-control:sterilization-log:DIRECT_NORM_LINK_REQUIRED"));
  assert.ok(result.errors.includes("criterion:independent-control:sterilization-log:CHECK_QUESTION_REQUIRED"));
});
