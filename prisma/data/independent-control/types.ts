export const INDEPENDENT_CONTROL_BASIS_KINDS = [
  "DIRECT_NORM",
  "METHODOLOGY_DERIVED",
  "LOCAL_FORM_ONLY",
] as const;

export type IndependentControlBasisKind =
  (typeof INDEPENDENT_CONTROL_BASIS_KINDS)[number];

export const INDEPENDENT_CONTROL_SOURCE_RIGHTS = [
  "UNVERIFIED",
  "OPEN_LICENSE",
  "AUTHOR_PERMISSION",
  "PUBLISHER_PERMISSION",
  "USER_CONFIRMED_PERMISSION",
  "PUBLIC_DOMAIN",
] as const;

export type IndependentControlSourceRights =
  (typeof INDEPENDENT_CONTROL_SOURCE_RIGHTS)[number];

export const INDEPENDENT_CONTROL_ASSESSMENT_STATUSES = [
  "CONFIRMED",
  "LIKELY_NON_COMPLIANCE",
  "REQUIRES_VERIFICATION",
  "NOT_CONFIRMED",
  "COMPLIANT",
] as const;

export type IndependentControlAssessmentStatus =
  (typeof INDEPENDENT_CONTROL_ASSESSMENT_STATUSES)[number];

export type IndependentControlSource = {
  title: string;
  kind: "LOCAL_BIBLIOGRAPHIC" | "OFFICIAL_METHODOLOGY";
  url?: string | null;
  internalFilename?: string | null;
  sha256: string;
  rightsStatus: IndependentControlSourceRights;
  rightsNote: string;
  rightsVerifiedAt?: Date | null;
  publicFileUrl?: string | null;
};

export type IndependentControlNormLink = {
  regulationKey: string;
  provisionKey: string;
  checkKey: string;
  role: "DIRECT_REQUIREMENT" | "CONTEXT";
  editionBound: boolean;
};

export type IndependentControlCriterion = {
  stableKey: string;
  sourceLocator: string;
  sectionKey: string;
  sectionTitle: string;
  statement: string;
  title: string;
  whatIsChecked: string;
  checkQuestion: string;
  factToEstablish: string;
  confirmingPrimaryDocument: string;
  evidenceRequired: string;
  evidenceThreshold: string;
  applicabilityNote: string;
  sourceDivergenceNote: string;
  basisKind: IndependentControlBasisKind;
  allowedStatuses: readonly IndependentControlAssessmentStatus[];
  normLinks: readonly IndependentControlNormLink[];
  isPublished: boolean;
  publishedAt?: Date | null;
  evidenceValidatedAt?: Date | null;
  sortOrder: number;
};

export type IndependentControlMethodology = {
  slug: string;
  title: string;
  summary: string;
  legalStatusNote: string;
  bibliographicDetails: string;
  officialMethodologyUrl: string;
  rightsNote: string;
  sources: readonly IndependentControlSource[];
  criteria: readonly IndependentControlCriterion[];
  seo: { title: string; description: string };
  isPublished: boolean;
  publishedAt?: Date | null;
  evidenceValidatedAt?: Date | null;
};

export type IndependentControlAssessmentEvidence = {
  role: "SUPPORTS" | "REFUTES" | "CONTEXT";
  isPrimary: boolean;
  provenanceVerifiedAt?: Date | null;
  isRestrictedSignal?: boolean;
};

export type IndependentControlAssessment = {
  status: IndependentControlAssessmentStatus;
  isPublished: boolean;
  publishedAt?: Date | null;
  evidenceValidatedAt?: Date | null;
  investigationPublished: boolean;
  investigationEvidenceValidatedAt?: Date | null;
  criterion: IndependentControlCriterion;
  neutralConclusion: string;
  alternativeVersion: string;
  evidenceGaps: string;
  temporalApplicability: "APPLICABLE" | "NOT_APPLICABLE" | "REQUIRES_VERIFICATION";
  legalNonApplicabilityProven?: boolean;
  supportingEvidenceSearchCompleted: boolean;
  refutingEvidenceSearchCompleted: boolean;
  primaryEvidence: readonly IndependentControlAssessmentEvidence[];
  restrictedSignals?: readonly string[];
};
