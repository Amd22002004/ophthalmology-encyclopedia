import assert from "node:assert/strict";
import test from "node:test";
import {
  canPublishIndependentControlAssessment,
  canPublishIndependentControlCriterion,
  canPublishIndependentControlMethodology,
} from "./publication";
import type {
  IndependentControlAssessment,
  IndependentControlCriterion,
  IndependentControlMethodology,
} from "../../../prisma/data/independent-control/types";

const now = new Date("2026-08-13T00:00:00.000Z");

const criterion = (overrides: Partial<IndependentControlCriterion> = {}): IndependentControlCriterion => ({
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
  ...overrides,
});

const methodology = (overrides: Partial<IndependentControlMethodology> = {}): IndependentControlMethodology => ({
  slug: "independent-control",
  title: "Независимый контроль",
  summary: "Проверяемая методология независимого контроля.",
  legalStatusNote: "Не является нормативным актом.",
  bibliographicDetails: "Независимый контроль. Издание 2026.",
  officialMethodologyUrl: "https://example.test/methodology",
  rightsNote: "Публикуется библиографическое описание.",
  sources: [{
    title: "Локальное библиографическое описание",
    kind: "LOCAL_BIBLIOGRAPHIC",
    internalFilename: "methodology.pdf",
    sha256: "a".repeat(64),
    rightsStatus: "UNVERIFIED",
    rightsNote: "Файл не публикуется.",
    publicFileUrl: null,
  }],
  criteria: [criterion()],
  seo: { title: "Независимый контроль", description: "Методология проверки." },
  isPublished: true,
  publishedAt: new Date("2026-08-12T00:00:00.000Z"),
  evidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
  ...overrides,
});

const assessment = (
  overrides: Partial<IndependentControlAssessment> = {},
): IndependentControlAssessment => ({
  status: "CONFIRMED",
  isPublished: true,
  publishedAt: new Date("2026-08-12T00:00:00.000Z"),
  evidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
  investigationPublished: true,
  investigationEvidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
  criterion: criterion({
    allowedStatuses: [
      "CONFIRMED",
      "LIKELY_NON_COMPLIANCE",
      "REQUIRES_VERIFICATION",
      "NOT_CONFIRMED",
      "COMPLIANT",
    ],
  }),
  neutralConclusion: "Вывод ограничен проверенными материалами.",
  alternativeVersion: "Альтернативная версия проверена отдельно.",
  evidenceGaps: "Существенные пробелы не выявлены.",
  temporalApplicability: "APPLICABLE",
  supportingEvidenceSearchCompleted: true,
  refutingEvidenceSearchCompleted: true,
  primaryEvidence: [{
    role: "SUPPORTS",
    isPrimary: true,
    provenanceVerifiedAt: new Date("2026-08-12T00:00:00.000Z"),
  }],
  ...overrides,
});

test("не публикует непроверенный локальный файл, но допускает его библиографическое описание", () => {
  const bibliographyOnly = canPublishIndependentControlMethodology(methodology(), now);
  const unpublishedFile = canPublishIndependentControlMethodology(methodology({
    sources: [{
      ...methodology().sources[0],
      publicFileUrl: "https://example.test/methodology.pdf",
    }],
  }), now);

  assert.deepEqual(bibliographyOnly, { allowed: true, errors: [] });
  assert.equal(unpublishedFile.allowed, false);
  assert.ok(unpublishedFile.errors.includes("LOCAL_SOURCE_RIGHTS_VERIFICATION_REQUIRED"));
});

test("не публикует неполный публичный критерий", () => {
  const result = canPublishIndependentControlCriterion(criterion({ evidenceThreshold: "" }), now);

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("EVIDENCE_THRESHOLD_REQUIRED"));
});

test("не публикует direct-norm критерий без связи с нормой", () => {
  const result = canPublishIndependentControlCriterion(criterion({ normLinks: [] }), now);

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("DIRECT_NORM_LINK_REQUIRED"));
});

test("не публикует methodology-derived критерий с сильными allowed statuses", () => {
  const result = canPublishIndependentControlCriterion(criterion({
    basisKind: "METHODOLOGY_DERIVED",
    normLinks: [],
    allowedStatuses: ["REQUIRES_VERIFICATION", "CONFIRMED", "COMPLIANT"],
  }), now);

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("NON_NORM_STRONG_STATUS_NOT_ALLOWED"));
});

test("не публикует local-form-only критерий с сильными allowed statuses", () => {
  const result = canPublishIndependentControlCriterion(criterion({
    basisKind: "LOCAL_FORM_ONLY",
    normLinks: [],
    allowedStatuses: ["NOT_CONFIRMED", "LIKELY_NON_COMPLIANCE"],
  }), now);

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("NON_NORM_STRONG_STATUS_NOT_ALLOWED"));
});

test("не допускает сильный вывод для methodology-derived критерия", () => {
  const methodologyCriterion = criterion({
    basisKind: "METHODOLOGY_DERIVED",
    normLinks: [],
    allowedStatuses: ["REQUIRES_VERIFICATION", "NOT_CONFIRMED"],
  });
  const result = canPublishIndependentControlAssessment({
    status: "CONFIRMED",
    isPublished: true,
    publishedAt: new Date("2026-08-12T00:00:00.000Z"),
    evidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
    investigationPublished: true,
    investigationEvidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
    criterion: methodologyCriterion,
    neutralConclusion: "По представленным материалам требуется проверка.",
    alternativeVersion: "Документы могут находиться у организации.",
    evidenceGaps: "Не представлен первичный документ.",
    temporalApplicability: "APPLICABLE",
    supportingEvidenceSearchCompleted: true,
    refutingEvidenceSearchCompleted: true,
    primaryEvidence: [{ role: "SUPPORTS", isPrimary: true, provenanceVerifiedAt: now }],
  }, now);

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("STATUS_NOT_ALLOWED_FOR_CRITERION"));
  assert.ok(result.errors.includes("STRONG_STATUS_DIRECT_NORM_REQUIRED"));
});

test("осторожный статус требует редакционную проверку, альтернативу и пробелы, но не доказательство клиники", () => {
  const base: IndependentControlAssessment = {
    status: "REQUIRES_VERIFICATION",
    isPublished: true,
    publishedAt: new Date("2026-08-12T00:00:00.000Z"),
    investigationPublished: true,
    investigationEvidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
    criterion: criterion({ allowedStatuses: ["REQUIRES_VERIFICATION"] }),
    neutralConclusion: "Данных недостаточно для вывода.",
    alternativeVersion: "",
    evidenceGaps: "",
    evidenceValidatedAt: null,
    temporalApplicability: "REQUIRES_VERIFICATION",
    supportingEvidenceSearchCompleted: false,
    refutingEvidenceSearchCompleted: false,
    primaryEvidence: [],
  };
  const missingSafeguards = canPublishIndependentControlAssessment(base, now);
  const cautious = canPublishIndependentControlAssessment({
    ...base,
    evidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
    alternativeVersion: "Документы могут существовать вне представленных материалов.",
    evidenceGaps: "Не получены документы организации.",
  }, now);

  assert.equal(missingSafeguards.allowed, false);
  assert.ok(missingSafeguards.errors.includes("EVIDENCE_VALIDATION_REQUIRED"));
  assert.ok(missingSafeguards.errors.includes("ALTERNATIVE_VERSION_REQUIRED"));
  assert.ok(missingSafeguards.errors.includes("EVIDENCE_GAPS_REQUIRED"));
  assert.deepEqual(cautious, { allowed: true, errors: [] });
});

test("требует двусторонний поиск и первичное доказательство с ролью, соответствующей выводу", () => {
  const missingEvidence = canPublishIndependentControlAssessment({
    status: "CONFIRMED",
    isPublished: true,
    publishedAt: new Date("2026-08-12T00:00:00.000Z"),
    evidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
    investigationPublished: true,
    investigationEvidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
    criterion: criterion(),
    neutralConclusion: "Вывод основан на проверенных первичных документах.",
    alternativeVersion: "Иная версия проверена и не подтверждена.",
    evidenceGaps: "Существенные пробелы не выявлены.",
    temporalApplicability: "APPLICABLE",
    supportingEvidenceSearchCompleted: false,
    refutingEvidenceSearchCompleted: false,
    primaryEvidence: [{ role: "REFUTES", isPrimary: true, provenanceVerifiedAt: now }],
  }, now);

  assert.equal(missingEvidence.allowed, false);
  assert.ok(missingEvidence.errors.includes("SUPPORTING_SEARCH_REQUIRED"));
  assert.ok(missingEvidence.errors.includes("REFUTING_SEARCH_REQUIRED"));
  assert.ok(missingEvidence.errors.includes("ALIGNED_PRIMARY_EVIDENCE_REQUIRED"));
});

test("не принимает context-only ссылку как прямую edition-bound норму для сильного вывода", () => {
  const result = canPublishIndependentControlAssessment(assessment({
    criterion: criterion({
      allowedStatuses: ["CONFIRMED"],
      normLinks: [{
        regulationKey: "sanitary-rules",
        provisionKey: "p-4-2",
        checkKey: "sterilization-log",
        role: "CONTEXT",
        editionBound: true,
      }],
    }),
  }), now);

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("EDITION_BOUND_DIRECT_NORM_LINK_REQUIRED"));
});

test("NOT_CONFIRMED и COMPLIANT требуют двусторонний поиск и primary REFUTES evidence", () => {
  for (const status of ["NOT_CONFIRMED", "COMPLIANT"] as const) {
    const result = canPublishIndependentControlAssessment(assessment({
      status,
      supportingEvidenceSearchCompleted: false,
      refutingEvidenceSearchCompleted: false,
      primaryEvidence: [{ role: "SUPPORTS", isPrimary: true, provenanceVerifiedAt: now }],
    }), now);

    assert.equal(result.allowed, false, status);
    assert.ok(result.errors.includes("SUPPORTING_SEARCH_REQUIRED"), status);
    assert.ok(result.errors.includes("REFUTING_SEARCH_REQUIRED"), status);
    assert.ok(result.errors.includes("ALIGNED_PRIMARY_EVIDENCE_REQUIRED"), status);
  }
});

test("доказанная неприменимость допускает только NOT_CONFIRMED без двустороннего поиска", () => {
  const notApplicable = assessment({
    status: "NOT_CONFIRMED",
    temporalApplicability: "NOT_APPLICABLE",
    legalNonApplicabilityProven: true,
    supportingEvidenceSearchCompleted: false,
    refutingEvidenceSearchCompleted: false,
    primaryEvidence: [],
  });
  const notConfirmed = canPublishIndependentControlAssessment(notApplicable, now);
  const compliant = canPublishIndependentControlAssessment({
    ...notApplicable,
    status: "COMPLIANT",
  }, now);

  assert.deepEqual(notConfirmed, { allowed: true, errors: [] });
  assert.equal(compliant.allowed, false);
  assert.ok(compliant.errors.includes("LEGAL_NON_APPLICABILITY_REQUIRES_NOT_CONFIRMED"));
});

test("не принимает restricted signal как primary evidence сильного вывода", () => {
  const result = canPublishIndependentControlAssessment(assessment({
    restrictedSignals: ["REGISTRY_NO_MATCH"],
    primaryEvidence: [{
      role: "SUPPORTS",
      isPrimary: true,
      provenanceVerifiedAt: now,
      isRestrictedSignal: true,
    }],
  }), now);

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("ALIGNED_PRIMARY_EVIDENCE_REQUIRED"));
});

test("публикует conclusive вывод только с прямой применимой нормой и aligned primary evidence", () => {
  const confirmed = canPublishIndependentControlAssessment(assessment(), now);
  const compliant = canPublishIndependentControlAssessment(assessment({
    status: "COMPLIANT",
    primaryEvidence: [{ role: "REFUTES", isPrimary: true, provenanceVerifiedAt: now }],
  }), now);

  assert.deepEqual(confirmed, { allowed: true, errors: [] });
  assert.deepEqual(compliant, { allowed: true, errors: [] });
});
