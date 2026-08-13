export const ASSESSMENT_STATUSES = [
  "CONFIRMED",
  "LIKELY_NON_COMPLIANCE",
  "REQUIRES_VERIFICATION",
  "NOT_CONFIRMED",
  "COMPLIANT",
] as const;

export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const RESTRICTED_INFERENCE_SIGNALS = [
  "DOCUMENT_NOT_FOUND",
  "REGISTRY_NO_MATCH",
  "OLD_MANUFACTURE_YEAR",
  "MODEL_DISCONTINUED",
  "THIRD_PARTY_STATEMENT",
] as const;

export type RestrictedInferenceSignal = (typeof RESTRICTED_INFERENCE_SIGNALS)[number];
export type TemporalApplicability = "APPLICABLE" | "NOT_APPLICABLE" | "REQUIRES_VERIFICATION";

export const INVESTIGATION_EVIDENCE_ROLES = ["SUPPORTS", "REFUTES", "CONTEXT"] as const;
export type InvestigationEvidenceRole = (typeof INVESTIGATION_EVIDENCE_ROLES)[number];

export type PrimaryEvidence = {
  role: InvestigationEvidenceRole;
  provenanceVerifiedAt?: Date | string | null;
};

export type EvidenceAssessmentInput = {
  status: AssessmentStatus;
  temporalApplicability: TemporalApplicability;
  restrictedSignals: readonly RestrictedInferenceSignal[];
  primaryEvidence: readonly PrimaryEvidence[];
  supportingEvidenceSearchCompleted: boolean;
  refutingEvidenceSearchCompleted: boolean;
  alternativeVersion?: string | null;
};

export type EvidenceAssessmentError =
  | "RESTRICTED_SIGNAL_IS_NOT_PROOF"
  | "SUPPORTING_EVIDENCE_SEARCH_REQUIRED"
  | "REFUTING_EVIDENCE_SEARCH_REQUIRED"
  | "TEMPORAL_APPLICABILITY_REQUIRED"
  | "ALTERNATIVE_VERSION_REQUIRED"
  | "STATUS_ALIGNED_PRIMARY_EVIDENCE_REQUIRED";

const CONCLUSIVE_STATUSES = new Set<AssessmentStatus>([
  "CONFIRMED",
  "LIKELY_NON_COMPLIANCE",
  "NOT_CONFIRMED",
  "COMPLIANT",
]);

/**
 * Проверяет не истинность юридического вывода, а минимальные условия, при
 * которых система вообще вправе сохранить выбранный вывод вместо осторожного
 * статуса «Требует проверки».
 */
export function validateEvidenceAssessment(input: EvidenceAssessmentInput): {
  valid: boolean;
  recommendedStatus: AssessmentStatus;
  errors: EvidenceAssessmentError[];
} {
  const errors: EvidenceAssessmentError[] = [];
  const isConclusive = CONCLUSIVE_STATUSES.has(input.status);
  const requiredEvidenceRole: InvestigationEvidenceRole | null =
    input.status === "CONFIRMED" || input.status === "LIKELY_NON_COMPLIANCE"
      ? "SUPPORTS"
      : input.status === "NOT_CONFIRMED" || input.status === "COMPLIANT"
        ? "REFUTES"
        : null;
  const hasStatusAlignedPrimaryEvidence =
    requiredEvidenceRole == null ||
    input.primaryEvidence.some(
      (evidence) =>
        evidence.role === requiredEvidenceRole && evidence.provenanceVerifiedAt != null,
    );

  if (
    isConclusive &&
    input.restrictedSignals.length > 0 &&
    !hasStatusAlignedPrimaryEvidence
  ) {
    errors.push("RESTRICTED_SIGNAL_IS_NOT_PROOF");
  }

  if (isConclusive && !hasStatusAlignedPrimaryEvidence) {
    errors.push("STATUS_ALIGNED_PRIMARY_EVIDENCE_REQUIRED");
  }

  if (isConclusive && !input.supportingEvidenceSearchCompleted) {
    errors.push("SUPPORTING_EVIDENCE_SEARCH_REQUIRED");
  }
  if (isConclusive && !input.refutingEvidenceSearchCompleted) {
    errors.push("REFUTING_EVIDENCE_SEARCH_REQUIRED");
  }
  if (isConclusive && input.temporalApplicability !== "APPLICABLE") {
    errors.push("TEMPORAL_APPLICABILITY_REQUIRED");
  }
  if (isConclusive && !input.alternativeVersion?.trim()) {
    errors.push("ALTERNATIVE_VERSION_REQUIRED");
  }

  return {
    valid: errors.length === 0,
    recommendedStatus: errors.length === 0 ? input.status : "REQUIRES_VERIFICATION",
    errors,
  };
}
