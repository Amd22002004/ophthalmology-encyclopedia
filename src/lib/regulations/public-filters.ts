import {
  evidenceValidatedContentWhere,
  publishedContentWhere,
} from "@/lib/publication-gate";

export function publicRegulationSourceWhere(now = new Date()) {
  return {
    isOfficial: true,
    ...publishedContentWhere(now),
  } as const;
}

/**
 * A published flag is not enough for a legal check: the public graph must
 * contain the question, the fact to establish, the primary evidence type and
 * the evidentiary threshold.  Keeping this predicate shared prevents list,
 * detail and sitemap queries from drifting apart.
 */
export function publicRegulatoryCheckWhere(now = new Date()) {
  return {
    ...publishedContentWhere(now),
    question: { not: "" },
    factToEstablish: { not: "" },
    primaryEvidenceType: { not: "" },
    evidenceThreshold: { not: "" },
  } as const;
}

export function publicRegulationWhere(now = new Date()) {
  return {
    ...publishedContentWhere(now),
    sources: { some: publicRegulationSourceWhere(now) },
  } as const;
}

export function publicInvestigationEquipmentInstanceWhere(now = new Date()) {
  return {
    ...publishedContentWhere(now),
    identificationEvidence: {
      some: {
        ...evidenceValidatedContentWhere(now),
        document: {
          isEvidence: true,
          ...evidenceValidatedContentWhere(now),
        },
      },
    },
  } as const;
}

export function publicInvestigationRelationWhere(now = new Date()) {
  return evidenceValidatedContentWhere(now);
}
