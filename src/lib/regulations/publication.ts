import {
  validateEvidenceAssessment,
  type AssessmentStatus,
  type RestrictedInferenceSignal,
} from "./evidence";
import { selectApplicableEdition, type TemporalEdition } from "./temporal";

type PublicationGateResult = {
  allowed: boolean;
  errors: string[];
};

function provisionCoversEvent(
  effectiveFrom: Date | string | null | undefined,
  effectiveTo: Date | string | null | undefined,
  eventFrom: Date | string | null | undefined,
  eventTo: Date | string | null | undefined,
) {
  if (eventFrom == null || eventTo == null) return false;
  const from = new Date(eventFrom).getTime();
  const to = new Date(eventTo).getTime();
  const provisionFrom =
    effectiveFrom == null ? Number.NEGATIVE_INFINITY : new Date(effectiveFrom).getTime();
  const provisionTo =
    effectiveTo == null ? Number.POSITIVE_INFINITY : new Date(effectiveTo).getTime();
  return (
    Number.isFinite(from) &&
    Number.isFinite(to) &&
    from <= to &&
    provisionFrom <= from &&
    provisionTo >= to
  );
}

type PublishableCheck = {
  isPublished: boolean;
  publishedAt?: Date | null;
  question?: string | null;
  factToEstablish?: string | null;
  primaryEvidenceType?: string | null;
  officialSearchUrl?: string | null;
};

export function canPublishRegulationProvision(input: {
  isPublished: boolean;
  publishedAt?: Date | null;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  editionPublished: boolean;
  regulationPublished: boolean;
  checks: readonly PublishableCheck[];
}, now = new Date()): PublicationGateResult {
  const errors: string[] = [];
  if (!input.isPublished) errors.push("PROVISION_NOT_PUBLISHED");
  if (input.publishedAt == null) {
    errors.push("PUBLICATION_DATE_REQUIRED");
  } else if (input.publishedAt.getTime() > now.getTime()) {
    errors.push("PUBLICATION_DATE_NOT_REACHED");
  }
  if (!input.editionPublished) errors.push("PARENT_EDITION_NOT_PUBLISHED");
  if (!input.regulationPublished) errors.push("PARENT_REGULATION_NOT_PUBLISHED");
  if (
    input.effectiveFrom != null &&
    input.effectiveTo != null &&
    input.effectiveFrom.getTime() > input.effectiveTo.getTime()
  ) {
    errors.push("INVALID_PROVISION_EFFECTIVE_PERIOD");
  }

  const hasWorkingCheck = input.checks.some(
    (check) =>
      check.isPublished &&
      check.publishedAt != null &&
      check.publishedAt.getTime() <= now.getTime() &&
      Boolean(check.question?.trim()) &&
      Boolean(check.factToEstablish?.trim()) &&
      Boolean(check.primaryEvidenceType?.trim()),
  );
  if (!hasWorkingCheck) errors.push("PUBLISHED_CHECK_REQUIRED");

  return { allowed: errors.length === 0, errors };
}

export function canPublishInvestigationAssessment(
  input: {
    status: AssessmentStatus;
    isPublished: boolean;
    publishedAt?: Date | null;
    evidenceValidatedAt?: Date | null;
    investigationPublished: boolean;
    regulationPublished: boolean;
    editionPublished: boolean;
    provisionPublished: boolean;
    regulatoryCheckPublished: boolean;
    applicabilityStatus: "APPLICABLE" | "NOT_APPLICABLE" | "REQUIRES_VERIFICATION";
    appliedEdition?: TemporalEdition | null;
    provisionEffectiveFrom?: Date | string | null;
    provisionEffectiveTo?: Date | string | null;
    eventFrom?: Date | string | null;
    eventTo?: Date | string | null;
    restrictedSignals: readonly RestrictedInferenceSignal[];
    primaryEvidence: readonly {
      role: "SUPPORTS" | "REFUTES" | "CONTEXT";
      provenanceVerifiedAt?: Date | string | null;
    }[];
    appliedEditionPublished: boolean;
    appliedEditionMatchesProvision: boolean;
    supportingEvidenceSearchCompleted: boolean;
    refutingEvidenceSearchCompleted: boolean;
    subjectRelationsPublished: boolean;
    neutralConclusion?: string | null;
    alternativeVersion?: string | null;
  },
  now = new Date(),
): PublicationGateResult {
  const errors: string[] = [];

  const event =
    input.eventFrom != null &&
    input.eventTo != null &&
    new Date(input.eventFrom).getTime() === new Date(input.eventTo).getTime()
      ? { date: input.eventFrom }
      : { from: input.eventFrom, to: input.eventTo };
  const temporal = input.appliedEdition
    ? selectApplicableEdition([input.appliedEdition], event)
    : { status: "REQUIRES_VERIFICATION" as const };
  const evidence = validateEvidenceAssessment({
    status: input.status,
    temporalApplicability: input.applicabilityStatus,
    restrictedSignals: input.restrictedSignals,
    primaryEvidence: input.primaryEvidence,
    supportingEvidenceSearchCompleted: input.supportingEvidenceSearchCompleted,
    refutingEvidenceSearchCompleted: input.refutingEvidenceSearchCompleted,
    alternativeVersion: input.alternativeVersion,
  });

  if (!input.isPublished) errors.push("ASSESSMENT_NOT_PUBLISHED");
  if (input.publishedAt == null) {
    errors.push("PUBLICATION_DATE_REQUIRED");
  } else if (input.publishedAt.getTime() > now.getTime()) {
    errors.push("PUBLICATION_DATE_NOT_REACHED");
  }
  if (input.evidenceValidatedAt == null) errors.push("EVIDENCE_VALIDATION_REQUIRED");
  if (!input.investigationPublished) errors.push("PARENT_INVESTIGATION_NOT_PUBLISHED");
  if (!input.regulationPublished) errors.push("PARENT_REGULATION_NOT_PUBLISHED");
  if (!input.editionPublished) errors.push("PARENT_EDITION_NOT_PUBLISHED");
  if (!input.provisionPublished) errors.push("PARENT_PROVISION_NOT_PUBLISHED");
  if (!input.regulatoryCheckPublished) errors.push("REGULATORY_CHECK_NOT_PUBLISHED");
  if (input.applicabilityStatus !== "APPLICABLE") {
    errors.push("TEMPORAL_APPLICABILITY_REQUIRED");
  }
  if (temporal.status !== "APPLICABLE" || temporal.edition.id !== input.appliedEdition?.id) {
    errors.push("EVENT_PERIOD_NOT_COVERED_BY_APPLIED_EDITION");
  }
  if (
    !provisionCoversEvent(
      input.provisionEffectiveFrom,
      input.provisionEffectiveTo,
      input.eventFrom,
      input.eventTo,
    )
  ) {
    errors.push("EVENT_PERIOD_NOT_COVERED_BY_PROVISION");
  }
  if (!input.appliedEditionPublished) errors.push("APPLIED_EDITION_NOT_PUBLISHED");
  if (!input.appliedEditionMatchesProvision) errors.push("APPLIED_EDITION_MISMATCH");
  if (!input.supportingEvidenceSearchCompleted) {
    errors.push("SUPPORTING_EVIDENCE_SEARCH_REQUIRED");
  }
  if (!input.refutingEvidenceSearchCompleted) {
    errors.push("REFUTING_EVIDENCE_SEARCH_REQUIRED");
  }
  if (!input.subjectRelationsPublished) {
    errors.push("SUBJECT_RELATION_NOT_PUBLISHED");
  }
  if (!input.neutralConclusion?.trim()) errors.push("NEUTRAL_CONCLUSION_REQUIRED");
  if (!input.alternativeVersion?.trim()) errors.push("ALTERNATIVE_VERSION_REQUIRED");
  if (!evidence.valid) {
    errors.push(...evidence.errors.map((error) => `EVIDENCE_${error}`));
  }

  return { allowed: errors.length === 0, errors };
}
