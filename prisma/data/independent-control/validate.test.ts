import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { INDEPENDENT_CONTROL_OBSERVATION_FORM } from "./observation-form";
import type { IndependentControlCriterion, IndependentControlMethodology } from "./types";
import { validateIndependentControlCorpus } from "./validate";
import {
  buildPrivateGlazcentrSourceAssessments,
  GLAZCENTR_FORMAL_NOC_SCOPE_ASSESSMENT,
} from "../investigations/glazcentr-independent-control";

const SOURCE_INFORMATION_LOCATORS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14",
  "15", "15.1", "15.2", "16", "16.1", "17", "17.1", "18", "18.1", "19", "20",
  "21", "21.1", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32",
  "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45",
  "46", "47", "47.1", "47.2", "47.3", "48", "48.1", "48.2", "48.3",
] as const;

const validMethodology = (): IndependentControlMethodology => ({
  slug: "independent-control",
  title: "Независимый контроль",
  summary: "Проверяемая методология независимого контроля.",
  legalStatusNote: "Не является нормативным актом.",
  bibliographicDetails: "Независимый контроль. Издание 2026.",
  officialMethodologyUrl: "https://example.test/methodology",
  rightsNote: "Публикуется библиографическое описание.",
  sources: [{
    key: "official-methodology",
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
    normLinks: [{ regulationKey: "sanitary-rules", editionKey: "current", provisionKey: "p-4-2", checkKey: "sterilization-log", role: "DIRECT_REQUIREMENT", editionBound: true }],
    isSourceCriterion: true,
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

test("отклоняет публичную методологию без полного публичного критерия", () => {
  const methodology = validMethodology();
  methodology.criteria = [];

  const result = validateIndependentControlCorpus([methodology]);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes(
    "methodology:independent-control:PUBLIC_COMPLETE_CRITERION_REQUIRED",
  ));
});

test("отклоняет norm link без ключей или с неподдерживаемой ролью", () => {
  const methodology = validMethodology();
  methodology.criteria[0].normLinks = [{
    regulationKey: "",
    editionKey: "",
    provisionKey: "",
    checkKey: "",
    role: "UNSUPPORTED" as never,
    editionBound: true,
  }];

  const result = validateIndependentControlCorpus([methodology]);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes(
    "norm-link:independent-control:sterilization-log:0:REGULATION_KEY_REQUIRED",
  ));
  assert.ok(result.errors.includes(
    "norm-link:independent-control:sterilization-log:0:PROVISION_KEY_REQUIRED",
  ));
  assert.ok(result.errors.includes(
    "norm-link:independent-control:sterilization-log:0:EDITION_KEY_REQUIRED",
  ));
  assert.ok(result.errors.includes(
    "norm-link:independent-control:sterilization-log:0:CHECK_KEY_REQUIRED",
  ));
  assert.ok(result.errors.includes(
    "norm-link:independent-control:sterilization-log:0:INVALID_ROLE",
  ));
});

test("принимает полный observation-form corpus с 80 исходными критериями и одним prerequisite", () => {
  const result = validateIndependentControlCorpus([INDEPENDENT_CONTROL_OBSERVATION_FORM]);
  const sourceCriteria = INDEPENDENT_CONTROL_OBSERVATION_FORM.criteria.filter(
    (criterion) => criterion.isSourceCriterion,
  );
  const prerequisites = INDEPENDENT_CONTROL_OBSERVATION_FORM.criteria.filter(
    (criterion) => !criterion.isSourceCriterion,
  );

  assert.deepEqual(result, { valid: true, errors: [] });
  assert.equal(INDEPENDENT_CONTROL_OBSERVATION_FORM.criteria.length, 81);
  assert.equal(sourceCriteria.length, 80);
  assert.deepEqual(prerequisites.map((criterion) => criterion.stableKey), ["formal-noc-scope"]);
  assert.equal(new Set(sourceCriteria.map((criterion) => criterion.stableKey)).size, 80);
  assert.equal(new Set(sourceCriteria.map((criterion) => criterion.sourceLocator)).size, 80);
});

test("сохраняет все 60 информационных локаторов и точные размеры пяти групп бланка", () => {
  const sourceCriteria = INDEPENDENT_CONTROL_OBSERVATION_FORM.criteria.filter(
    (criterion) => criterion.isSourceCriterion,
  );

  assert.deepEqual(
    sourceCriteria
      .filter((criterion) => criterion.sectionKey === "information")
      .map((criterion) => criterion.sourceLocator),
    SOURCE_INFORMATION_LOCATORS,
  );
  assert.equal(sourceCriteria.filter((criterion) => criterion.sectionKey === "presentation").length, 4);
  assert.equal(sourceCriteria.filter((criterion) => criterion.sectionKey === "comfort").length, 6);
  assert.equal(sourceCriteria.filter((criterion) => criterion.sectionKey === "facility-accessibility").length, 5);
  assert.equal(sourceCriteria.filter((criterion) => criterion.sectionKey === "service-accessibility").length, 5);
});

test("каждый исходный критерий содержит полный вопрос и edition-bound norm/check link", () => {
  const sourceCriteria = INDEPENDENT_CONTROL_OBSERVATION_FORM.criteria.filter(
    (criterion) => criterion.isSourceCriterion,
  );
  const requiredTextFields = [
    "title",
    "statement",
    "whatIsChecked",
    "checkQuestion",
    "factToEstablish",
    "confirmingPrimaryDocument",
    "evidenceRequired",
    "evidenceThreshold",
    "applicabilityNote",
    "sourceDivergenceNote",
  ] as const;

  for (const criterion of sourceCriteria) {
    for (const field of requiredTextFields) {
      assert.ok(criterion[field].trim(), `${criterion.stableKey}:${field}`);
    }
    assert.ok(criterion.normLinks.length > 0, `${criterion.stableKey}:normLinks`);
    for (const link of criterion.normLinks) {
      assert.ok(link.regulationKey.trim(), `${criterion.stableKey}:regulationKey`);
      assert.ok(link.editionKey?.trim(), `${criterion.stableKey}:editionKey`);
      assert.ok(link.provisionKey.trim(), `${criterion.stableKey}:provisionKey`);
      assert.ok(link.checkKey.trim(), `${criterion.stableKey}:checkKey`);
      assert.equal(link.editionBound, true, `${criterion.stableKey}:editionBound`);
    }
  }
});

test("не публикует локальный DOC и сохраняет обе проверенные контрольные суммы", () => {
  const local = INDEPENDENT_CONTROL_OBSERVATION_FORM.sources.find(
    (source) => source.key === "local-observation-form",
  );
  const official = INDEPENDENT_CONTROL_OBSERVATION_FORM.sources.find(
    (source) => source.key === "official-example-calculation",
  );

  assert.ok(local);
  assert.equal(local.sha256, "761612297c112102e164b23d472a79e912de157a12737485090ecd630f55158c");
  assert.equal(local.rightsStatus, "UNVERIFIED");
  assert.equal(local.rightsVerifiedAt, null);
  assert.equal(local.publicFileUrl, null);
  assert.ok(local.internalFilename?.endsWith(".doc"));
  assert.ok(official);
  assert.equal(official.sha256, "fddeabd874017be85cb7c4330c5afa1e683d50f551fb6bcb758f6f0e761bde4e");
});

test("не даёт исходным ненормативным строкам автоматический сильный статус", () => {
  for (const criterion of INDEPENDENT_CONTROL_OBSERVATION_FORM.criteria.filter(
    (item) => item.isSourceCriterion,
  )) {
    assert.notEqual(criterion.basisKind, "DIRECT_NORM", criterion.stableKey);
    assert.deepEqual(
      criterion.allowedStatuses,
      ["REQUIRES_VERIFICATION", "NOT_CONFIRMED"],
      criterion.stableKey,
    );
  }
});

test("явно сохраняет все существенные расхождения локального бланка", () => {
  const serialized = JSON.stringify(INDEPENDENT_CONTROL_OBSERVATION_FORM).toLocaleLowerCase("ru-RU");
  const markers = [
    "информационный стенд и официальный сайт",
    "не является номером статьи или пункта",
    "шкала от 1 до 10",
    "версию сайта для слабовидящих",
    "1.2, 1.3, 2.2, 2.3, 3.3",
    "строки 35–37",
    "сертификат специалиста",
    "гардероб",
    "одним посещением",
    "каналы записи",
    "услуга на дому",
    "повторно обозначен как раздел ii",
    "не устанавливает универсальную обязанность сопровождения",
  ];

  for (const marker of markers) assert.ok(serialized.includes(marker), marker);
  assert.equal(serialized.includes("глазцентр"), false);
  assert.equal(serialized.includes("1010-2571"), false);
});

test("formal-noc-scope требует доказать применимость к точному юрлицу и каждому году", () => {
  const criterion = INDEPENDENT_CONTROL_OBSERVATION_FORM.criteria.find(
    (item) => item.stableKey === "formal-noc-scope",
  );

  assert.ok(criterion);
  assert.equal(criterion.isSourceCriterion, false);
  assert.match(criterion.checkQuestion, /точн.*юридическ/i);
  assert.match(criterion.checkQuestion, /кажд.*проверяем.*год/i);
  assert.match(criterion.checkQuestion, /программ.*государственн.*гарант/i);
  assert.match(criterion.checkQuestion, /общественн.*совет/i);
  assert.match(criterion.checkQuestion, /197н/i);
  assert.ok(criterion.normLinks.some((link) =>
    link.regulationKey === "federal-law-323-fz" &&
    link.provisionKey === "article-79-1-independent-assessment" &&
    link.checkKey === "formal-noc-scope"
  ));
  assert.ok(criterion.normLinks.some((link) => link.regulationKey === "minzdrav-order-197n-2018"));
});

test("создаёт ровно 80 приватных нейтральных assessment без готовых выводов", () => {
  const assessments = buildPrivateGlazcentrSourceAssessments(
    INDEPENDENT_CONTROL_OBSERVATION_FORM.criteria,
  );

  assert.equal(assessments.length, 80);
  assert.equal(new Set(assessments.map((assessment) => assessment.criterionKey)).size, 80);
  for (const assessment of assessments) {
    assert.equal(assessment.status, "REQUIRES_VERIFICATION");
    assert.equal(assessment.applicabilityStatus, "REQUIRES_VERIFICATION");
    assert.deepEqual(assessment.restrictedSignals, []);
    assert.equal(assessment.supportingEvidenceSearchCompleted, false);
    assert.equal(assessment.refutingEvidenceSearchCompleted, false);
    assert.equal(assessment.isPublished, false);
    assert.equal(assessment.evidenceValidatedAt, null);
    assert.equal(assessment.publishedAt, null);
    assert.match(assessment.neutralConclusion, /не установлены|не установлено/i);
    assert.ok(assessment.alternativeVersion.trim(), assessment.criterionKey);
    assert.ok(assessment.evidenceGaps.trim(), assessment.criterionKey);
  }
});

test("публичным оставляет только осторожный formal-noc-scope assessment", () => {
  const assessment = GLAZCENTR_FORMAL_NOC_SCOPE_ASSESSMENT;

  assert.equal(assessment.key, "formal-noc-scope");
  assert.equal(assessment.criterionKey, "formal-noc-scope");
  assert.equal(assessment.status, "REQUIRES_VERIFICATION");
  assert.equal(assessment.applicabilityStatus, "REQUIRES_VERIFICATION");
  assert.equal(assessment.isPublished, true);
  assert.ok(assessment.evidenceValidatedAt);
  assert.ok(assessment.publishedAt);
  assert.match(assessment.neutralConclusion, /не установлена/i);
  assert.match(assessment.alternativeVersion, /частная клиника могла/i);
  assert.match(assessment.evidenceGaps, /каждому проверяемому году/i);
  assert.equal(assessment.contextDocumentSlug, "appeal-to-depzdrav");
});

test("independent-control seed path не обращается к ClinicOnEquipment", () => {
  const seedSource = readFileSync(new URL("../../seed.ts", import.meta.url), "utf8");
  const functionStart = seedSource.indexOf("async function seedIndependentControlCorpus");
  const mainStart = seedSource.indexOf("async function main", functionStart);

  assert.notEqual(functionStart, -1, "Нет seedIndependentControlCorpus");
  assert.notEqual(mainStart, -1, "Не найдена граница seedIndependentControlCorpus");
  const independentControlSeedPath = seedSource.slice(functionStart, mainStart);
  assert.equal(/clinicOnEquipment/i.test(independentControlSeedPath), false);
  assert.ok(
    seedSource.indexOf("await seedGlazcentrInvestigation()") <
      seedSource.indexOf("await seedIndependentControlCorpus()"),
    "Independent-control assessments должны создаваться после investigation/clinic/documents",
  );
});
