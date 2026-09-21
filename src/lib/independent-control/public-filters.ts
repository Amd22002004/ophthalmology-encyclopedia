import {
  evidenceValidatedContentWhere,
  publishedContentWhere,
} from "@/lib/publication-gate";
import { publicInvestigationRelationWhere } from "@/lib/regulations/public-filters";
import {
  publicRegulatoryCheckWhere,
  publicRegulationWhere,
} from "@/lib/regulations/public-filters";
import { canPublishIndependentControlAssessment } from "@/lib/independent-control/publication";
import type {
  IndependentControlAssessment,
  IndependentControlCriterion,
  IndependentControlNormLink,
} from "../../../prisma/data/independent-control/types";
import type {
  IndependentControlRightsBasis,
  IndependentControlSourceKind,
  Prisma,
} from "@/generated/prisma/client";

type LoadedIndependentControlNormLink = IndependentControlNormLink & {
  id: string;
};

export type LoadedIndependentControlAssessmentForPublication = Omit<
  IndependentControlAssessment,
  "criterion"
> & {
  criterion: Omit<IndependentControlCriterion, "normLinks"> & {
    normLinks: readonly LoadedIndependentControlNormLink[];
  };
  appliedCriterionNormId: string | null;
};

function requiredTextWhere() {
  return { not: "" } as const;
}

type IndependentControlSourcePublicInput = {
  key: string;
  kind: IndependentControlSourceKind;
  title: string;
  bibliographicCitation: string | null;
  sourceUrl: string | null;
  sha256: string | null;
  rightsBasis: IndependentControlRightsBasis;
  rightsVerifiedAt: Date | null;
  publicFileUrl: string | null;
  internalFileName?: string | null;
  rightsNote?: string | null;
};

/**
 * Explicit public DTO boundary: internal storage names and editorial rights
 * notes are accepted only so this function can prove that it discards them.
 */
export function sanitizeIndependentControlSource(
  source: IndependentControlSourcePublicInput,
) {
  return {
    key: source.key,
    kind: source.kind,
    title: source.title,
    bibliographicCitation: source.bibliographicCitation,
    sourceUrl: source.sourceUrl,
    sha256: source.sha256,
    rightsBasis: source.rightsBasis,
    rightsVerifiedAt: source.rightsVerifiedAt,
    publicFileUrl: source.publicFileUrl,
  };
}

export function publicIndependentControlSourceWhere(now = new Date()) {
  const where = {
    ...evidenceValidatedContentWhere(now),
    OR: [
      { publicFileUrl: null },
      {
        publicFileUrl: { not: null },
        rightsBasis: { not: "UNVERIFIED" },
        rightsVerifiedAt: { not: null },
      },
    ],
  } satisfies Prisma.IndependentControlSourceWhereInput;
  return where;
}

export function publicIndependentControlCriterionNormWhere(now = new Date()) {
  const where = {
    ...evidenceValidatedContentWhere(now),
    regulatoryCheck: {
      ...publicRegulatoryCheckWhere(now),
      provision: {
        ...publishedContentWhere(now),
        edition: {
          ...publishedContentWhere(now),
          regulation: publicRegulationWhere(now),
        },
      },
    },
  } satisfies Prisma.IndependentControlCriterionNormWhereInput;
  return where;
}

export function publicIndependentControlCriterionWhere(now = new Date()) {
  const where = {
    ...evidenceValidatedContentWhere(now),
    key: requiredTextWhere(),
    sourceLocator: requiredTextWhere(),
    sectionKey: requiredTextWhere(),
    sectionTitle: requiredTextWhere(),
    statement: requiredTextWhere(),
    title: requiredTextWhere(),
    whatIsChecked: requiredTextWhere(),
    checkQuestion: requiredTextWhere(),
    factToEstablish: requiredTextWhere(),
    confirmingDocument: requiredTextWhere(),
    evidenceRequired: requiredTextWhere(),
    evidenceThreshold: requiredTextWhere(),
    applicabilityNote: requiredTextWhere(),
    sourceDivergenceNote: requiredTextWhere(),
    allowedStatuses: { isEmpty: false },
    normLinks: { some: publicIndependentControlCriterionNormWhere(now) },
  } satisfies Prisma.IndependentControlCriterionWhereInput;
  return where;
}

function publicIndependentControlMethodologyParentWhere(now: Date) {
  const where = {
    ...evidenceValidatedContentWhere(now),
    slug: requiredTextWhere(),
    title: requiredTextWhere(),
    summary: requiredTextWhere(),
    description: requiredTextWhere(),
    legalStatusNote: requiredTextWhere(),
    bibliographicCitation: requiredTextWhere(),
    officialMethodologyUrl: requiredTextWhere(),
    seoTitle: requiredTextWhere(),
    seoDescription: requiredTextWhere(),
    sources: { some: publicIndependentControlSourceWhere(now) },
  } satisfies Prisma.IndependentControlMethodologyWhereInput;
  return where;
}

export function publicIndependentControlMethodologyWhere(now = new Date()) {
  const where = {
    ...publicIndependentControlMethodologyParentWhere(now),
    criteria: { some: publicIndependentControlCriterionWhere(now) },
  } satisfies Prisma.IndependentControlMethodologyWhereInput;
  return where;
}

/**
 * Safe relational prefilter only. Status-sensitive evidence sufficiency is
 * enforced after loading by canPublishIndependentControlAssessment.
 */
export function publicIndependentControlAssessmentWhere(now = new Date()) {
  const where = {
    ...evidenceValidatedContentWhere(now),
    investigation: evidenceValidatedContentWhere(now),
    criterion: {
      ...publicIndependentControlCriterionWhere(now),
      methodology: publicIndependentControlMethodologyParentWhere(now),
    },
    AND: [
      {
        OR: [
          { clinicId: null },
          {
            investigationClinic: {
              is: publicInvestigationRelationWhere(now),
            },
          },
        ],
      },
      {
        OR: [
          { appliedCriterionNormId: null },
          {
            appliedCriterionNorm: {
              is: publicIndependentControlCriterionNormWhere(now),
            },
          },
        ],
      },
    ],
    evidence: {
      every: {
        document: {
          isEvidence: true,
          ...evidenceValidatedContentWhere(now),
        },
      },
    },
  } satisfies Prisma.InvestigationIndependentControlAssessmentWhereInput;
  return where;
}

/**
 * Mandatory status-sensitive pass after the broad relational DB prefilter.
 * Conclusive statuses see only the exact applied norm link; a merely related
 * criterion norm can never stand in for the norm actually applied.
 */
export function canPublishLoadedIndependentControlAssessment(
  input: LoadedIndependentControlAssessmentForPublication,
  now = new Date(),
) {
  const { appliedCriterionNormId, criterion, ...assessment } = input;
  const conclusive = assessment.status !== "REQUIRES_VERIFICATION";
  const normLinks = conclusive
    ? criterion.normLinks.filter(
        (link) => link.id === appliedCriterionNormId && link.editionBound,
      )
    : criterion.normLinks.filter((link) => link.editionBound);
  const result = canPublishIndependentControlAssessment(
    {
      ...assessment,
      primaryEvidence: assessment.primaryEvidence.map((evidence) => ({
        ...evidence,
        isRestrictedSignal:
          evidence.isRestrictedSignal === true ||
          (assessment.restrictedSignals?.length ?? 0) > 0,
      })),
      criterion: { ...criterion, normLinks },
    },
    now,
  );

  if (conclusive && normLinks.length === 0) {
    return {
      allowed: false,
      errors: [...result.errors, "APPLIED_CRITERION_NORM_REQUIRED"],
    };
  }
  if (
    conclusive &&
    !normLinks.some((link) => link.role === "DIRECT_REQUIREMENT")
  ) {
    return {
      allowed: false,
      errors: [
        ...result.errors,
        "APPLIED_DIRECT_CRITERION_NORM_REQUIRED",
      ],
    };
  }

  return result;
}
