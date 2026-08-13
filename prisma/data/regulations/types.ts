export const REGULATION_LEGAL_STATUSES = ["DRAFT", "IN_FORCE", "FUTURE", "EXPIRED"] as const;
export type RegulationLegalStatusSeed = (typeof REGULATION_LEGAL_STATUSES)[number];

export const REGULATION_SOURCE_KINDS = [
  "OFFICIAL_PUBLICATION",
  "OFFICIAL_CONSOLIDATED_TEXT",
  "OFFICIAL_REGISTER",
  "OFFICIAL_GUIDANCE",
] as const;
export type RegulationSourceKindSeed = (typeof REGULATION_SOURCE_KINDS)[number];

export const REGULATION_RELATION_TYPES = ["AMENDS", "REPEALS", "REPLACES", "EXTENDS", "IMPLEMENTS"] as const;
export type RegulationRelationTypeSeed = (typeof REGULATION_RELATION_TYPES)[number];

export type RegulationTopicSeed = {
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
  isPublished: boolean;
};

export type RegulatoryCheckSeed = {
  key: string;
  question: string;
  factToEstablish: string;
  primaryEvidenceType: string;
  officialSearchUrl?: string;
  officialSearchLabel?: string;
  nonCompliancePattern?: string;
  evidenceThreshold: string;
  applicabilityNote?: string;
  isPublished: boolean;
  publishedAt?: string;
  sortOrder: number;
};

export type RegulationEquipmentRequirementSeed = {
  stableKey: string;
  appendix: string;
  subsection?: string;
  tableTitle?: string;
  position: string;
  deviceTypeCode?: string;
  regulatoryName: string;
  displayName?: string;
  quantity: string;
  applicabilityCondition?: string;
  isPublished: boolean;
  publishedAt?: string;
  sortOrder: number;
};

export type RegulationProvisionSeed = {
  key: string;
  topicSlug: string;
  locator: string;
  title: string;
  requirement: string;
  applicability: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isPublished: boolean;
  publishedAt?: string;
  sortOrder: number;
  checks: RegulatoryCheckSeed[];
  equipmentRequirements?: RegulationEquipmentRequirementSeed[];
};

export type RegulationEditionSeed = {
  key: string;
  title: string;
  effectiveFrom: string;
  effectiveTo?: string;
  legalStatus: RegulationLegalStatusSeed;
  transitionNote?: string;
  officialTextUrl: string;
  verifiedAt: string;
  historicalUseAllowed: boolean;
  verificationNote: string;
  isPublished: boolean;
  publishedAt?: string;
  provisions: RegulationProvisionSeed[];
};

export type RegulationSourceSeed = {
  kind: RegulationSourceKindSeed;
  title: string;
  url: string;
  isOfficial: boolean;
  isPublished?: boolean;
  publishedAt?: string;
  sourceDate?: string;
  editionKey?: string;
  sortOrder: number;
};

export type RegulationRelationSeed = {
  targetSlug: string;
  type: RegulationRelationTypeSeed;
  legalEffectFrom?: string;
  note?: string;
  officialSourceUrl?: string;
  isPublished: boolean;
};

export type RegulationSeed = {
  slug: string;
  title: string;
  summary: string;
  content?: string;
  documentType: string;
  number: string;
  adoptedAt: string;
  issuingAuthority: string;
  jurisdiction: string;
  officialPublicationUrl: string;
  legalStatus: RegulationLegalStatusSeed;
  effectiveFrom: string;
  effectiveTo?: string;
  isPublished: boolean;
  publishedAt?: string;
  seoTitle: string;
  seoDescription: string;
  topicSlugs: string[];
  sources: RegulationSourceSeed[];
  editions: RegulationEditionSeed[];
  relations?: RegulationRelationSeed[];
};
