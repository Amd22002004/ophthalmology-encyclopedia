import {
  canPublishIndependentControlCriterion,
  canPublishIndependentControlMethodology,
} from "../../../src/lib/independent-control/publication";
import type {
  IndependentControlCriterion,
  IndependentControlMethodology,
} from "./types";
import { INDEPENDENT_CONTROL_NORM_LINK_ROLES } from "./types";

type CorpusValidationResult = { valid: boolean; errors: string[] };

const requiredMethodologyFields: Array<[keyof IndependentControlMethodology, string]> = [
  ["slug", "SLUG_REQUIRED"],
  ["title", "TITLE_REQUIRED"],
  ["summary", "SUMMARY_REQUIRED"],
  ["legalStatusNote", "LEGAL_STATUS_NOTE_REQUIRED"],
  ["bibliographicDetails", "BIBLIOGRAPHIC_DETAILS_REQUIRED"],
  ["officialMethodologyUrl", "OFFICIAL_METHODOLOGY_URL_REQUIRED"],
  ["rightsNote", "RIGHTS_NOTE_REQUIRED"],
];

const requiredCriterionFields: Array<[keyof IndependentControlCriterion, string]> = [
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

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isFuture(date: Date | null | undefined, now: Date) {
  return date != null && (!Number.isFinite(date.getTime()) || date.getTime() > now.getTime());
}

export function validateIndependentControlCorpus(
  methodologies: readonly IndependentControlMethodology[],
): CorpusValidationResult {
  const errors: string[] = [];
  const now = new Date();
  const methodologySlugs = new Set<string>();

  for (const methodology of methodologies) {
    const methodologyId = methodology.slug || "missing-slug";
    if (methodologySlugs.has(methodology.slug)) {
      errors.push(`methodology:${methodologyId}:DUPLICATE_SLUG`);
    }
    methodologySlugs.add(methodology.slug);
    for (const [field, error] of requiredMethodologyFields) {
      if (!hasText(methodology[field])) errors.push(`methodology:${methodologyId}:${error}`);
    }
    if (!hasText(methodology.seo.title)) errors.push(`methodology:${methodologyId}:SEO_TITLE_REQUIRED`);
    if (!hasText(methodology.seo.description)) errors.push(`methodology:${methodologyId}:SEO_DESCRIPTION_REQUIRED`);
    if (methodology.isPublished && methodology.publishedAt == null) {
      errors.push(`methodology:${methodologyId}:PUBLICATION_DATE_REQUIRED`);
    }
    if (isFuture(methodology.publishedAt, now)) {
      errors.push(`methodology:${methodologyId}:FUTURE_PUBLICATION_DATE`);
    }
    if (methodology.isPublished && methodology.evidenceValidatedAt == null) {
      errors.push(`methodology:${methodologyId}:EVIDENCE_VALIDATION_REQUIRED`);
    }
    if (methodology.sources.length === 0) errors.push(`methodology:${methodologyId}:BIBLIOGRAPHY_REQUIRED`);
    if (
      methodology.isPublished &&
      canPublishIndependentControlMethodology(methodology, now).errors.includes(
        "PUBLIC_COMPLETE_CRITERION_REQUIRED",
      )
    ) {
      errors.push(`methodology:${methodologyId}:PUBLIC_COMPLETE_CRITERION_REQUIRED`);
    }

    methodology.sources.forEach((source, index) => {
      const sourceId = `source:${methodologyId}:${index}`;
      if (!hasText(source.title)) errors.push(`${sourceId}:TITLE_REQUIRED`);
      if (!hasText(source.url) && !hasText(source.internalFilename)) {
        errors.push(`${sourceId}:REFERENCE_REQUIRED`);
      }
      if (!/^[a-fA-F0-9]{64}$/.test(source.sha256)) errors.push(`${sourceId}:INVALID_SHA256`);
      if (!hasText(source.rightsNote)) errors.push(`${sourceId}:RIGHTS_NOTE_REQUIRED`);
      if (
        source.kind === "LOCAL_BIBLIOGRAPHIC" &&
        source.publicFileUrl != null &&
        (source.rightsStatus === "UNVERIFIED" || source.rightsVerifiedAt == null)
      ) {
        errors.push(`${sourceId}:LOCAL_SOURCE_RIGHTS_VERIFICATION_REQUIRED`);
      }
    });

    const stableKeys = new Set<string>();
    const locators = new Set<string>();
    methodology.criteria.forEach((criterion) => {
      const criterionId = `criterion:${methodologyId}:${criterion.stableKey || "missing-key"}`;
      if (stableKeys.has(criterion.stableKey)) errors.push(`${criterionId}:DUPLICATE_STABLE_KEY`);
      stableKeys.add(criterion.stableKey);
      if (locators.has(criterion.sourceLocator)) {
        errors.push(`criterion:${methodologyId}:${criterion.sourceLocator || "missing-locator"}:DUPLICATE_SOURCE_LOCATOR`);
      }
      locators.add(criterion.sourceLocator);
      for (const [field, error] of requiredCriterionFields) {
        if (!hasText(criterion[field])) errors.push(`${criterionId}:${error}`);
      }
      if (criterion.allowedStatuses.length === 0) errors.push(`${criterionId}:ALLOWED_STATUSES_REQUIRED`);
      if (criterion.basisKind === "DIRECT_NORM" && criterion.normLinks.length === 0) {
        errors.push(`${criterionId}:DIRECT_NORM_LINK_REQUIRED`);
      }
      criterion.normLinks.forEach((link, index) => {
        const linkId = `norm-link:${methodologyId}:${criterion.stableKey || "missing-key"}:${index}`;
        if (!hasText(link.regulationKey)) errors.push(`${linkId}:REGULATION_KEY_REQUIRED`);
        if (!hasText(link.provisionKey)) errors.push(`${linkId}:PROVISION_KEY_REQUIRED`);
        if (!hasText(link.checkKey)) errors.push(`${linkId}:CHECK_KEY_REQUIRED`);
        if (!(INDEPENDENT_CONTROL_NORM_LINK_ROLES as readonly string[]).includes(link.role)) {
          errors.push(`${linkId}:INVALID_ROLE`);
        }
      });
      if (criterion.isPublished && criterion.publishedAt == null) {
        errors.push(`${criterionId}:PUBLICATION_DATE_REQUIRED`);
      }
      if (isFuture(criterion.publishedAt, now)) {
        errors.push(`${criterionId}:FUTURE_PUBLICATION_DATE`);
      }
      if (criterion.isPublished && criterion.evidenceValidatedAt == null) {
        errors.push(`${criterionId}:EVIDENCE_VALIDATION_REQUIRED`);
      }
      if (criterion.isPublished && !canPublishIndependentControlCriterion(criterion, now).allowed) {
        errors.push(`${criterionId}:PUBLICATION_CONTRACT_FAILED`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
