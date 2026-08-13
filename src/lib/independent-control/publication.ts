import type {
  IndependentControlAssessment,
  IndependentControlAssessmentStatus,
  IndependentControlCriterion,
  IndependentControlMethodology,
} from "../../../prisma/data/independent-control/types";

export type IndependentControlPublicationResult = {
  allowed: boolean;
  errors: string[];
};

const strongStatuses: readonly IndependentControlAssessmentStatus[] = [
  "CONFIRMED",
  "LIKELY_NON_COMPLIANCE",
];
const refutingStatuses: readonly IndependentControlAssessmentStatus[] = [
  "NOT_CONFIRMED",
  "COMPLIANT",
];
const nonNormProhibitedStatuses: readonly IndependentControlAssessmentStatus[] = [
  "CONFIRMED",
  "LIKELY_NON_COMPLIANCE",
  "COMPLIANT",
];

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function reached(date: Date | null | undefined, now: Date) {
  return date != null && Number.isFinite(date.getTime()) && date.getTime() <= now.getTime();
}

function publicationErrors(
  input: { isPublished: boolean; publishedAt?: Date | null; evidenceValidatedAt?: Date | null },
  now: Date,
) {
  const errors: string[] = [];
  if (!input.isPublished) errors.push("NOT_MARKED_FOR_PUBLICATION");
  if (input.publishedAt == null) errors.push("PUBLICATION_DATE_REQUIRED");
  else if (!reached(input.publishedAt, now)) errors.push("PUBLICATION_DATE_NOT_REACHED");
  if (input.evidenceValidatedAt == null) errors.push("EVIDENCE_VALIDATION_REQUIRED");
  return errors;
}

export function canPublishIndependentControlCriterion(
  input: IndependentControlCriterion,
  now = new Date(),
): IndependentControlPublicationResult {
  const errors = publicationErrors(input, now);
  const requiredText: Array<[keyof IndependentControlCriterion, string]> = [
    ["stableKey", "STABLE_KEY_REQUIRED"],
    ["sourceLocator", "SOURCE_LOCATOR_REQUIRED"],
    ["sectionKey", "SECTION_KEY_REQUIRED"],
    ["sectionTitle", "SECTION_TITLE_REQUIRED"],
    ["statement", "STATEMENT_REQUIRED"],
    ["title", "TITLE_REQUIRED"],
    ["whatIsChecked", "WHAT_IS_CHECKED_REQUIRED"],
    ["checkQuestion", "CHECK_QUESTION_REQUIRED"],
    ["factToEstablish", "FACT_TO_ESTABLISH_REQUIRED"],
    ["confirmingPrimaryDocument", "CONFIRMING_PRIMARY_DOCUMENT_REQUIRED"],
    ["evidenceRequired", "EVIDENCE_REQUIRED_REQUIRED"],
    ["evidenceThreshold", "EVIDENCE_THRESHOLD_REQUIRED"],
    ["applicabilityNote", "APPLICABILITY_NOTE_REQUIRED"],
    ["sourceDivergenceNote", "SOURCE_DIVERGENCE_NOTE_REQUIRED"],
  ];
  for (const [field, error] of requiredText) {
    if (!hasText(input[field] as string)) errors.push(error);
  }
  if (input.allowedStatuses.length === 0) errors.push("ALLOWED_STATUSES_REQUIRED");
  if (input.basisKind === "DIRECT_NORM" && input.normLinks.length === 0) {
    errors.push("DIRECT_NORM_LINK_REQUIRED");
  }
  if (
    input.basisKind !== "DIRECT_NORM" &&
    input.allowedStatuses.some((status) => nonNormProhibitedStatuses.includes(status))
  ) {
    errors.push("NON_NORM_STRONG_STATUS_NOT_ALLOWED");
  }

  return { allowed: errors.length === 0, errors };
}

export function canPublishIndependentControlMethodology(
  input: IndependentControlMethodology,
  now = new Date(),
): IndependentControlPublicationResult {
  const errors = publicationErrors(input, now);
  const requiredText: Array<[keyof IndependentControlMethodology, string]> = [
    ["slug", "SLUG_REQUIRED"],
    ["title", "TITLE_REQUIRED"],
    ["summary", "SUMMARY_REQUIRED"],
    ["legalStatusNote", "LEGAL_STATUS_NOTE_REQUIRED"],
    ["bibliographicDetails", "BIBLIOGRAPHIC_DETAILS_REQUIRED"],
    ["officialMethodologyUrl", "OFFICIAL_METHODOLOGY_URL_REQUIRED"],
    ["rightsNote", "RIGHTS_NOTE_REQUIRED"],
  ];
  for (const [field, error] of requiredText) {
    if (!hasText(input[field] as string)) errors.push(error);
  }
  if (!hasText(input.seo.title)) errors.push("SEO_TITLE_REQUIRED");
  if (!hasText(input.seo.description)) errors.push("SEO_DESCRIPTION_REQUIRED");
  if (input.sources.length === 0) errors.push("BIBLIOGRAPHY_REQUIRED");
  for (const source of input.sources) {
    if (
      source.kind === "LOCAL_BIBLIOGRAPHIC" &&
      source.publicFileUrl != null &&
      (source.rightsStatus === "UNVERIFIED" || source.rightsVerifiedAt == null)
    ) {
      errors.push("LOCAL_SOURCE_RIGHTS_VERIFICATION_REQUIRED");
    }
  }
  if (!input.criteria.some((criterion) => canPublishIndependentControlCriterion(criterion, now).allowed)) {
    errors.push("PUBLIC_COMPLETE_CRITERION_REQUIRED");
  }

  return { allowed: errors.length === 0, errors };
}

export function canPublishIndependentControlAssessment(
  input: IndependentControlAssessment,
  now = new Date(),
): IndependentControlPublicationResult {
  const errors = publicationErrors(input, now);
  if (!input.investigationPublished) errors.push("PARENT_INVESTIGATION_NOT_PUBLISHED");
  if (input.investigationEvidenceValidatedAt == null) {
    errors.push("PARENT_INVESTIGATION_EVIDENCE_VALIDATION_REQUIRED");
  }
  if (!canPublishIndependentControlCriterion(input.criterion, now).allowed) {
    errors.push("PARENT_CRITERION_NOT_PUBLISHABLE");
  }
  if (!input.criterion.allowedStatuses.includes(input.status)) {
    errors.push("STATUS_NOT_ALLOWED_FOR_CRITERION");
  }
  if (!hasText(input.neutralConclusion)) errors.push("NEUTRAL_CONCLUSION_REQUIRED");
  if (!hasText(input.alternativeVersion)) errors.push("ALTERNATIVE_VERSION_REQUIRED");
  if (!hasText(input.evidenceGaps)) errors.push("EVIDENCE_GAPS_REQUIRED");

  if (strongStatuses.includes(input.status)) {
    if (input.criterion.basisKind !== "DIRECT_NORM") {
      errors.push("STRONG_STATUS_DIRECT_NORM_REQUIRED");
    }
    if (!input.criterion.normLinks.some(
      (link) => link.role === "DIRECT_REQUIREMENT" && link.editionBound,
    )) {
      errors.push("EDITION_BOUND_DIRECT_NORM_LINK_REQUIRED");
    }
    if (input.temporalApplicability !== "APPLICABLE") {
      errors.push("TEMPORAL_APPLICABILITY_REQUIRED");
    }
  }

  const legalNonApplicabilityClaimed = input.legalNonApplicabilityProven === true;
  if (legalNonApplicabilityClaimed && input.status !== "NOT_CONFIRMED") {
    errors.push("LEGAL_NON_APPLICABILITY_REQUIRES_NOT_CONFIRMED");
  }
  if (legalNonApplicabilityClaimed && input.temporalApplicability !== "NOT_APPLICABLE") {
    errors.push("LEGAL_NON_APPLICABILITY_REQUIRES_NOT_APPLICABLE");
  }
  const legalNonApplicability =
    legalNonApplicabilityClaimed &&
    input.status === "NOT_CONFIRMED" &&
    input.temporalApplicability === "NOT_APPLICABLE";
  const requiresConclusiveEvidence =
    strongStatuses.includes(input.status) ||
    (refutingStatuses.includes(input.status) && !legalNonApplicability);
  if (requiresConclusiveEvidence) {
    if (!input.supportingEvidenceSearchCompleted) errors.push("SUPPORTING_SEARCH_REQUIRED");
    if (!input.refutingEvidenceSearchCompleted) errors.push("REFUTING_SEARCH_REQUIRED");
    const expectedRole = strongStatuses.includes(input.status) ? "SUPPORTS" : "REFUTES";
    const hasAlignedPrimaryEvidence = input.primaryEvidence.some(
      (evidence) =>
        evidence.role === expectedRole &&
        evidence.isPrimary &&
        !evidence.isRestrictedSignal &&
        evidence.provenanceVerifiedAt != null,
    );
    if (!hasAlignedPrimaryEvidence) errors.push("ALIGNED_PRIMARY_EVIDENCE_REQUIRED");
  }

  return { allowed: errors.length === 0, errors };
}
