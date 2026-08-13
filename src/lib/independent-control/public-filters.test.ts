import assert from "node:assert/strict";
import test from "node:test";
import {
  canPublishLoadedIndependentControlAssessment,
  publicIndependentControlAssessmentWhere,
  publicIndependentControlCriterionNormWhere,
  publicIndependentControlCriterionWhere,
  publicIndependentControlMethodologyWhere,
  publicIndependentControlSourceWhere,
} from "./public-filters";
import type { LoadedIndependentControlAssessmentForPublication } from "./public-filters";

const NOW = new Date("2026-08-13T12:00:00.000Z");
const reachedEvidenceGate = {
  isPublished: true,
  publishedAt: { lte: NOW },
  evidenceValidatedAt: { not: null },
} as const;

test("источник допускает библиографию без файла, но файл требует проверенного права", () => {
  assert.deepEqual(publicIndependentControlSourceWhere(NOW), {
    ...reachedEvidenceGate,
    OR: [
      { publicFileUrl: null },
      {
        publicFileUrl: { not: null },
        rightsBasis: { not: "UNVERIFIED" },
        rightsVerifiedAt: { not: null },
      },
    ],
  });
});

test("связь критерия с нормой проходит всю официальную нормативную цепочку", () => {
  const predicate = publicIndependentControlCriterionNormWhere(NOW);

  assert.deepEqual(predicate.isPublished, true);
  assert.deepEqual(predicate.publishedAt, { lte: NOW });
  assert.deepEqual(predicate.evidenceValidatedAt, { not: null });
  assert.deepEqual(predicate.regulatoryCheck.question, { not: "" });
  assert.deepEqual(predicate.regulatoryCheck.factToEstablish, { not: "" });
  assert.deepEqual(predicate.regulatoryCheck.primaryEvidenceType, { not: "" });
  assert.deepEqual(predicate.regulatoryCheck.evidenceThreshold, { not: "" });
  assert.deepEqual(
    predicate.regulatoryCheck.provision.edition.regulation.sources.some,
    {
      isOfficial: true,
      isPublished: true,
      publishedAt: { lte: NOW },
    },
  );
});

test("публичный критерий требует все поля матрицы, статусы и публичную norm-связь", () => {
  const predicate = publicIndependentControlCriterionWhere(NOW);

  for (const field of [
    "key",
    "sourceLocator",
    "sectionKey",
    "sectionTitle",
    "statement",
    "title",
    "whatIsChecked",
    "checkQuestion",
    "factToEstablish",
    "confirmingDocument",
    "evidenceRequired",
    "evidenceThreshold",
    "applicabilityNote",
    "sourceDivergenceNote",
  ] as const) {
    assert.deepEqual(predicate[field], { not: "" }, field);
  }
  assert.deepEqual(predicate.allowedStatuses, { isEmpty: false });
  assert.ok("some" in predicate.normLinks);
});

test("публичная методика требует библиографию, SEO, источник и полный критерий", () => {
  const predicate = publicIndependentControlMethodologyWhere(NOW);

  for (const field of [
    "slug",
    "title",
    "summary",
    "description",
    "legalStatusNote",
    "bibliographicCitation",
    "officialMethodologyUrl",
    "seoTitle",
    "seoDescription",
  ] as const) {
    assert.deepEqual(predicate[field], { not: "" }, field);
  }
  assert.ok("some" in predicate.sources);
  assert.ok("some" in predicate.criteria);
});

test("assessment prefilter требует публичных родителей, clinic edge, applied norm и документы", () => {
  const predicate = publicIndependentControlAssessmentWhere(NOW);
  const serialized = JSON.stringify(predicate);

  assert.match(serialized, /"investigation"/);
  assert.match(serialized, /"criterion"/);
  assert.match(serialized, /"methodology"/);
  assert.match(serialized, /"investigationClinic"/);
  assert.match(serialized, /"appliedCriterionNorm"/);
  assert.match(serialized, /"document"/);
  assert.match(serialized, /"isOfficial":true/);
  assert.match(serialized, /"evidenceValidatedAt":\{"not":null\}/);
});

type LoadedCriterion = LoadedIndependentControlAssessmentForPublication["criterion"];

const criterion = (
  overrides: Partial<LoadedCriterion> = {},
): LoadedCriterion => ({
  stableKey: "formal-scope",
  sourceLocator: "system-prerequisite",
  sectionKey: "scope",
  sectionTitle: "Применимость",
  statement: "Требуется установить формальную применимость методики.",
  title: "Формальная применимость",
  whatIsChecked: "Включение точного юридического лица в цикл оценки.",
  checkQuestion: "Подтверждено ли включение организации в цикл оценки?",
  factToEstablish: "Факт включения в применимый период.",
  confirmingPrimaryDocument: "Официальный перечень организаций.",
  evidenceRequired: "Официальный перечень с точным юридическим лицом.",
  evidenceThreshold: "Совпадают юридическое лицо, период и цикл оценки.",
  applicabilityNote: "Применяется только после установления формального охвата.",
  sourceDivergenceNote: "Это системный prerequisite, а не строка локального бланка.",
  basisKind: "DIRECT_NORM",
  allowedStatuses: ["REQUIRES_VERIFICATION", "CONFIRMED"],
  normLinks: [{
    id: "norm-1",
    regulationKey: "federal-law-323-fz",
    editionKey: "current",
    provisionKey: "article-79-1",
    checkKey: "formal-scope",
    role: "DIRECT_REQUIREMENT",
    editionBound: true,
  }],
  isSourceCriterion: false,
  isPublished: true,
  publishedAt: new Date("2026-08-13T00:00:00.000Z"),
  evidenceValidatedAt: new Date("2026-08-13T00:00:00.000Z"),
  sortOrder: 80,
  ...overrides,
});

function loadedAssessment(
  overrides: Partial<LoadedIndependentControlAssessmentForPublication> = {},
): LoadedIndependentControlAssessmentForPublication {
  return {
    status: "REQUIRES_VERIFICATION" as const,
    isPublished: true,
    publishedAt: new Date("2026-08-13T00:00:00.000Z"),
    evidenceValidatedAt: new Date("2026-08-13T00:00:00.000Z"),
    investigationPublished: true,
    investigationEvidenceValidatedAt: new Date("2026-08-13T00:00:00.000Z"),
    criterion: criterion(),
    neutralConclusion: "Представленных данных недостаточно для правового вывода.",
    alternativeVersion: "Организация могла не входить в соответствующий цикл оценки.",
    evidenceGaps: "Нет официального перечня с точным юридическим лицом.",
    temporalApplicability: "REQUIRES_VERIFICATION" as const,
    legalNonApplicabilityProven: false,
    supportingEvidenceSearchCompleted: false,
    refutingEvidenceSearchCompleted: false,
    primaryEvidence: [],
    appliedCriterionNormId: null,
    ...overrides,
  };
}

test("pure post-filter допускает осторожную scope-карточку, но отсекает private и неполную", () => {
  assert.equal(
    canPublishLoadedIndependentControlAssessment(loadedAssessment(), NOW).allowed,
    true,
  );
  assert.equal(
    canPublishLoadedIndependentControlAssessment(
      loadedAssessment({ isPublished: false }),
      NOW,
    ).allowed,
    false,
  );
  assert.equal(
    canPublishLoadedIndependentControlAssessment(
      loadedAssessment({ criterion: criterion({ evidenceThreshold: "" }) }),
      NOW,
    ).allowed,
    false,
  );
});

test("pure post-filter не допускает сильный вывод без фактически applied norm", () => {
  const result = canPublishLoadedIndependentControlAssessment(
    loadedAssessment({
      status: "CONFIRMED",
      temporalApplicability: "APPLICABLE",
      supportingEvidenceSearchCompleted: true,
      refutingEvidenceSearchCompleted: true,
      primaryEvidence: [{
        role: "SUPPORTS",
        isPrimary: true,
        provenanceVerifiedAt: new Date("2026-08-13T00:00:00.000Z"),
      }],
      appliedCriterionNormId: null,
    }),
    NOW,
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("APPLIED_CRITERION_NORM_REQUIRED"));
});

test("pure post-filter не засчитывает evidence при неразрешённом restricted signal", () => {
  const result = canPublishLoadedIndependentControlAssessment(
    loadedAssessment({
      status: "CONFIRMED",
      temporalApplicability: "APPLICABLE",
      supportingEvidenceSearchCompleted: true,
      refutingEvidenceSearchCompleted: true,
      restrictedSignals: ["REGISTRY_NO_MATCH"],
      primaryEvidence: [{
        role: "SUPPORTS",
        isPrimary: true,
        provenanceVerifiedAt: new Date("2026-08-13T00:00:00.000Z"),
      }],
      appliedCriterionNormId: "norm-1",
    }),
    NOW,
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("ALIGNED_PRIMARY_EVIDENCE_REQUIRED"));
});

test("pure post-filter не применяет supporting norm как основание итогового статуса", () => {
  const result = canPublishLoadedIndependentControlAssessment(
    loadedAssessment({
      status: "COMPLIANT",
      criterion: criterion({
        allowedStatuses: ["COMPLIANT"],
        normLinks: [{
          ...criterion().normLinks[0],
          role: "CONTEXT",
        }],
      }),
      temporalApplicability: "APPLICABLE",
      supportingEvidenceSearchCompleted: true,
      refutingEvidenceSearchCompleted: true,
      primaryEvidence: [{
        role: "REFUTES",
        isPrimary: true,
        provenanceVerifiedAt: new Date("2026-08-13T00:00:00.000Z"),
      }],
      appliedCriterionNormId: "norm-1",
    }),
    NOW,
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("APPLIED_DIRECT_CRITERION_NORM_REQUIRED"));
});
