import assert from "node:assert/strict";
import test from "node:test";
import {
  canPublishInvestigationAssessment,
  canPublishRegulationProvision,
} from "./publication";

test("не публикует норму без рабочего check question и первичного документа", () => {
  const now = new Date("2026-08-12T00:00:00.000Z");
  assert.equal(
    canPublishRegulationProvision({
      isPublished: true,
      publishedAt: now,
      editionPublished: true,
      regulationPublished: true,
      checks: [],
    }, now).allowed,
    false,
  );

  const result = canPublishRegulationProvision({
    isPublished: true,
    publishedAt: now,
    editionPublished: true,
    regulationPublished: true,
    checks: [
      {
        isPublished: true,
        publishedAt: now,
        question: "Каким документом подтверждается ввод изделия в эксплуатацию?",
        factToEstablish: "Дата и основание ввода конкретного экземпляра",
        primaryEvidenceType: "Акт ввода в эксплуатацию",
        officialSearchUrl: null,
      },
    ],
  }, now);

  assert.equal(result.allowed, true);
});

test("не засчитывает черновой или пустой check question", () => {
  const now = new Date("2026-08-12T00:00:00.000Z");
  const result = canPublishRegulationProvision({
    isPublished: true,
    publishedAt: now,
    editionPublished: true,
    regulationPublished: true,
    checks: [
      {
        isPublished: false,
        publishedAt: null,
        question: "Есть ли документ?",
        factToEstablish: "Наличие документа",
        primaryEvidenceType: "Документ",
        officialSearchUrl: null,
      },
      {
        isPublished: true,
        publishedAt: now,
        question: " ",
        factToEstablish: "Наличие документа",
        primaryEvidenceType: "Документ",
        officialSearchUrl: null,
      },
    ],
  }, now);

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("PUBLISHED_CHECK_REQUIRED"));
});

test("не публикует положение раньше даты публикации или без публичных родителей", () => {
  const now = new Date("2026-08-12T00:00:00.000Z");
  const result = canPublishRegulationProvision({
    isPublished: true,
    publishedAt: new Date("2026-08-13T00:00:00.000Z"),
    editionPublished: false,
    regulationPublished: false,
    checks: [
      {
        isPublished: true,
        publishedAt: now,
        question: "Что проверить?",
        factToEstablish: "Факт",
        primaryEvidenceType: "Первичный документ",
      },
    ],
  }, now);

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("PUBLICATION_DATE_NOT_REACHED"));
  assert.ok(result.errors.includes("PARENT_EDITION_NOT_PUBLISHED"));
  assert.ok(result.errors.includes("PARENT_REGULATION_NOT_PUBLISHED"));
});

test("не публикует положение с обратным периодом действия", () => {
  const now = new Date("2026-08-12T00:00:00.000Z");
  const result = canPublishRegulationProvision({
    isPublished: true,
    publishedAt: now,
    effectiveFrom: new Date("2026-09-01T00:00:00.000Z"),
    effectiveTo: new Date("2026-08-31T00:00:00.000Z"),
    editionPublished: true,
    regulationPublished: true,
    checks: [{
      isPublished: true,
      publishedAt: now,
      question: "Что проверить?",
      factToEstablish: "Факт",
      primaryEvidenceType: "Первичный документ",
    }],
  }, now);

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("INVALID_PROVISION_EFFECTIVE_PERIOD"));
});

const publishableAssessment = {
  status: "CONFIRMED" as const,
  isPublished: true,
  publishedAt: new Date("2026-08-10T00:00:00.000Z"),
  evidenceValidatedAt: new Date("2026-08-10T00:00:00.000Z"),
  investigationPublished: true,
  regulationPublished: true,
  editionPublished: true,
  provisionPublished: true,
  regulatoryCheckPublished: true,
  applicabilityStatus: "APPLICABLE" as const,
  appliedEdition: {
    id: "edition-current",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    verifiedAt: "2026-01-01",
    historicalUseAllowed: true,
  },
  provisionEffectiveFrom: "2026-01-01",
  provisionEffectiveTo: "2026-12-31",
  eventFrom: "2026-08-10",
  eventTo: "2026-08-10",
  restrictedSignals: [] as const,
  primaryEvidence: [
    {
      role: "SUPPORTS" as const,
      provenanceVerifiedAt: new Date("2026-08-10T00:00:00.000Z"),
    },
  ],
  appliedEditionPublished: true,
  appliedEditionMatchesProvision: true,
  supportingEvidenceSearchCompleted: true,
  refutingEvidenceSearchCompleted: true,
  subjectRelationsPublished: true,
  neutralConclusion: "По представленным документам вопрос требует дополнительной проверки.",
  alternativeVersion: "Документы могут существовать, но отсутствовать в материалах расследования.",
};

test("не публикует оценку до двустороннего поиска доказательств", () => {
  const now = new Date("2026-08-12T00:00:00.000Z");
  const result = canPublishInvestigationAssessment(
    {
      ...publishableAssessment,
      supportingEvidenceSearchCompleted: false,
      refutingEvidenceSearchCompleted: false,
    },
    now,
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("SUPPORTING_EVIDENCE_SEARCH_REQUIRED"));
  assert.ok(result.errors.includes("REFUTING_EVIDENCE_SEARCH_REQUIRED"));
});

test("не публикует оценку без доказанной временной применимости редакции", () => {
  const now = new Date("2026-08-12T00:00:00.000Z");
  const result = canPublishInvestigationAssessment(
    {
      ...publishableAssessment,
      applicabilityStatus: "REQUIRES_VERIFICATION",
      appliedEditionPublished: false,
      appliedEditionMatchesProvision: false,
    },
    now,
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("TEMPORAL_APPLICABILITY_REQUIRED"));
  assert.ok(result.errors.includes("APPLIED_EDITION_NOT_PUBLISHED"));
  assert.ok(result.errors.includes("APPLIED_EDITION_MISMATCH"));
});

test("не публикует оценку, если дата события вне применённой редакции", () => {
  const result = canPublishInvestigationAssessment(
    {
      ...publishableAssessment,
      eventFrom: "2010-01-01",
      eventTo: "2010-01-01",
    },
    new Date("2026-08-12T00:00:00.000Z"),
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("EVENT_PERIOD_NOT_COVERED_BY_APPLIED_EDITION"));
});

test("не публикует оценку, если дата события вне периода самого положения", () => {
  const result = canPublishInvestigationAssessment(
    {
      ...publishableAssessment,
      provisionEffectiveFrom: "2026-09-01",
      provisionEffectiveTo: "2026-12-31",
    },
    new Date("2026-08-12T00:00:00.000Z"),
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("EVENT_PERIOD_NOT_COVERED_BY_PROVISION"));
});

test("не публикует сильный вывод по запрещённому сигналу без независимого первичного доказательства", () => {
  const result = canPublishInvestigationAssessment(
    {
      ...publishableAssessment,
      restrictedSignals: ["REGISTRY_NO_MATCH"],
      primaryEvidence: [],
    },
    new Date("2026-08-12T00:00:00.000Z"),
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("EVIDENCE_RESTRICTED_SIGNAL_IS_NOT_PROOF"));
});

test("требует роль первичного доказательства, соответствующую итоговому статусу", () => {
  const noSupport = canPublishInvestigationAssessment(
    {
      ...publishableAssessment,
      primaryEvidence: [
        {
          role: "REFUTES",
          provenanceVerifiedAt: new Date("2026-08-10T00:00:00.000Z"),
        },
      ],
    },
    new Date("2026-08-12T00:00:00.000Z"),
  );
  const noRefutation = canPublishInvestigationAssessment(
    {
      ...publishableAssessment,
      status: "COMPLIANT",
      primaryEvidence: [
        {
          role: "SUPPORTS",
          provenanceVerifiedAt: new Date("2026-08-10T00:00:00.000Z"),
        },
      ],
    },
    new Date("2026-08-12T00:00:00.000Z"),
  );

  assert.ok(noSupport.errors.includes("EVIDENCE_STATUS_ALIGNED_PRIMARY_EVIDENCE_REQUIRED"));
  assert.ok(noRefutation.errors.includes("EVIDENCE_STATUS_ALIGNED_PRIMARY_EVIDENCE_REQUIRED"));
});

test("не публикует оценку до evidence-validation", () => {
  const result = canPublishInvestigationAssessment(
    { ...publishableAssessment, evidenceValidatedAt: null },
    new Date("2026-08-12T00:00:00.000Z"),
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("EVIDENCE_VALIDATION_REQUIRED"));
});

test("не публикует оценку через непроверенную связь с клиникой или процедурой", () => {
  const result = canPublishInvestigationAssessment(
    { ...publishableAssessment, subjectRelationsPublished: false },
    new Date("2026-08-12T00:00:00.000Z"),
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("SUBJECT_RELATION_NOT_PUBLISHED"));
});

test("не публикует будущую, черновую или осиротевшую оценку", () => {
  const result = canPublishInvestigationAssessment(
    {
      ...publishableAssessment,
      publishedAt: new Date("2026-08-13T00:00:00.000Z"),
      investigationPublished: false,
      regulationPublished: false,
      editionPublished: false,
      provisionPublished: false,
      regulatoryCheckPublished: false,
    },
    new Date("2026-08-12T00:00:00.000Z"),
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.includes("PUBLICATION_DATE_NOT_REACHED"));
  assert.ok(result.errors.includes("PARENT_INVESTIGATION_NOT_PUBLISHED"));
  assert.ok(result.errors.includes("PARENT_REGULATION_NOT_PUBLISHED"));
  assert.ok(result.errors.includes("PARENT_EDITION_NOT_PUBLISHED"));
  assert.ok(result.errors.includes("PARENT_PROVISION_NOT_PUBLISHED"));
  assert.ok(result.errors.includes("REGULATORY_CHECK_NOT_PUBLISHED"));
});

test("публикует только прошедшую шлюз нейтральную оценку", () => {
  const result = canPublishInvestigationAssessment(
    publishableAssessment,
    new Date("2026-08-12T00:00:00.000Z"),
  );

  assert.deepEqual(result, { allowed: true, errors: [] });
});
