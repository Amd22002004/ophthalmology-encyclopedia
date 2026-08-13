import assert from "node:assert/strict";
import test from "node:test";
import {
  RESTRICTED_INFERENCE_SIGNALS,
  validateEvidenceAssessment,
} from "./evidence";

const validLikelyAssessment = {
  status: "LIKELY_NON_COMPLIANCE" as const,
  temporalApplicability: "APPLICABLE" as const,
  restrictedSignals: [] as (typeof RESTRICTED_INFERENCE_SIGNALS)[number][],
  primaryEvidence: [
    {
      role: "SUPPORTS" as const,
      provenanceVerifiedAt: new Date("2026-08-10T00:00:00.000Z"),
    },
  ],
  supportingEvidenceSearchCompleted: true,
  refutingEvidenceSearchCompleted: true,
  alternativeVersion: "Документы могли быть оформлены на иное юридическое лицо или иной период.",
};

test("не превращает каждый запрещённый одиночный сигнал в вероятное нарушение", () => {
  for (const signal of RESTRICTED_INFERENCE_SIGNALS) {
    const result = validateEvidenceAssessment({
      ...validLikelyAssessment,
      restrictedSignals: [signal],
      primaryEvidence: [],
    });

    assert.equal(result.valid, false, signal);
    assert.equal(result.recommendedStatus, "REQUIRES_VERIFICATION", signal);
    assert.ok(result.errors.includes("RESTRICTED_SIGNAL_IS_NOT_PROOF"), signal);
  }
});

test("требует искать как подтверждающие, так и опровергающие документы", () => {
  const withoutSupportingSearch = validateEvidenceAssessment({
    ...validLikelyAssessment,
    supportingEvidenceSearchCompleted: false,
  });
  const withoutRefutingSearch = validateEvidenceAssessment({
    ...validLikelyAssessment,
    refutingEvidenceSearchCompleted: false,
  });

  assert.ok(withoutSupportingSearch.errors.includes("SUPPORTING_EVIDENCE_SEARCH_REQUIRED"));
  assert.ok(withoutRefutingSearch.errors.includes("REFUTING_EVIDENCE_SEARCH_REQUIRED"));
});

test("не разрешает юридический вывод без применимой ко времени редакции", () => {
  const result = validateEvidenceAssessment({
    ...validLikelyAssessment,
    temporalApplicability: "REQUIRES_VERIFICATION",
  });

  assert.equal(result.valid, false);
  assert.equal(result.recommendedStatus, "REQUIRES_VERIFICATION");
  assert.ok(result.errors.includes("TEMPORAL_APPLICABILITY_REQUIRED"));
});

test("требует явно зафиксировать альтернативную версию", () => {
  const result = validateEvidenceAssessment({
    ...validLikelyAssessment,
    alternativeVersion: "  ",
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("ALTERNATIVE_VERSION_REQUIRED"));
});

test("допускает осторожный статус Требует проверки без ложного вывода", () => {
  const result = validateEvidenceAssessment({
    status: "REQUIRES_VERIFICATION",
    temporalApplicability: "REQUIRES_VERIFICATION",
    restrictedSignals: ["REGISTRY_NO_MATCH"],
    primaryEvidence: [],
    supportingEvidenceSearchCompleted: true,
    refutingEvidenceSearchCompleted: true,
    alternativeVersion: "Запись может находиться под другим названием или в архивной версии реестра.",
  });

  assert.equal(result.valid, true);
  assert.equal(result.recommendedStatus, "REQUIRES_VERIFICATION");
});

test("любой итоговый статус требует первичного документа даже без запрещённого сигнала", () => {
  const result = validateEvidenceAssessment({
    ...validLikelyAssessment,
    restrictedSignals: [],
    primaryEvidence: [],
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("STATUS_ALIGNED_PRIMARY_EVIDENCE_REQUIRED"));
});

test("первичный документ должен поддерживать направление выбранного статуса", () => {
  const nonComplianceWithRefutingOnly = validateEvidenceAssessment({
    ...validLikelyAssessment,
    primaryEvidence: [
      {
        role: "REFUTES",
        provenanceVerifiedAt: new Date("2026-08-10T00:00:00.000Z"),
      },
    ],
  });
  const compliantWithSupportingOnly = validateEvidenceAssessment({
    ...validLikelyAssessment,
    status: "COMPLIANT",
    primaryEvidence: [
      {
        role: "SUPPORTS",
        provenanceVerifiedAt: new Date("2026-08-10T00:00:00.000Z"),
      },
    ],
  });

  assert.ok(
    nonComplianceWithRefutingOnly.errors.includes(
      "STATUS_ALIGNED_PRIMARY_EVIDENCE_REQUIRED",
    ),
  );
  assert.ok(
    compliantWithSupportingOnly.errors.includes(
      "STATUS_ALIGNED_PRIMARY_EVIDENCE_REQUIRED",
    ),
  );
});

test("не засчитывает первичный документ с непроверенным происхождением", () => {
  const result = validateEvidenceAssessment({
    ...validLikelyAssessment,
    primaryEvidence: [
      {
        role: "SUPPORTS",
        provenanceVerifiedAt: null,
      },
    ],
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("STATUS_ALIGNED_PRIMARY_EVIDENCE_REQUIRED"));
});

test("допускает вероятное несоответствие только при полном наборе защитных условий", () => {
  const result = validateEvidenceAssessment(validLikelyAssessment);

  assert.deepEqual(result, {
    valid: true,
    recommendedStatus: "LIKELY_NON_COMPLIANCE",
    errors: [],
  });
});
