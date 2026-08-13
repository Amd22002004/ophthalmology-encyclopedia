import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export type SearchResult = {
  type: string;
  title: string;
  slug: string;
  summary: string | null;
  href: string;
};

export async function searchEntities(query: string): Promise<SearchResult[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const prisma = getPrisma();

  if (!prisma) {
    return [];
  }

  try {
    return await prisma.$queryRaw<SearchResult[]>(Prisma.sql`
      WITH search_query AS (
        SELECT websearch_to_tsquery('russian', ${normalizedQuery}) AS query
      )
      SELECT 'disease' AS type, title, slug, summary, '/diseases/' || slug AS href
      FROM "Disease", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, summary, description)) @@ search_query.query
      UNION ALL
      SELECT 'doctor' AS type, concat_ws(' ', "lastName", "firstName", "middleName") AS title, slug, bio AS summary, '/doctors/' || slug AS href
      FROM "Doctor", search_query
      WHERE to_tsvector('russian', concat_ws(' ', "lastName", "firstName", "middleName", bio)) @@ search_query.query
      UNION ALL
      SELECT 'clinic' AS type, title, slug, description AS summary, '/clinics/' || slug AS href
      FROM "Clinic", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, description, region)) @@ search_query.query
      UNION ALL
      SELECT 'supplier' AS type, title, slug, description AS summary, '/suppliers/' || slug AS href
      FROM "Supplier", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, description)) @@ search_query.query
      UNION ALL
      SELECT 'equipment' AS type, title, slug, description AS summary, '/equipment/' || slug AS href
      FROM "Equipment", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, description)) @@ search_query.query
      UNION ALL
      SELECT 'publication' AS type, p.title, p.slug, p.abstract AS summary, '/publications/' || p.slug AS href
      FROM "Publication" p, search_query
      WHERE NOT EXISTS (
          SELECT 1 FROM "ScientificWork" sw WHERE sw.slug = p.slug
        )
        AND to_tsvector('russian', concat_ws(' ', p.title, p.abstract, p.content)) @@ search_query.query
      UNION ALL
      SELECT 'scientific-work' AS type, title, slug, summary, '/publications/' || slug AS href
      FROM "ScientificWork", search_query
      WHERE slug <> ''
        AND "isPublished" = true
        AND "publishedAt" <= CURRENT_TIMESTAMP
        AND "evidenceValidatedAt" IS NOT NULL
        AND "publicationBlockReason" IS NULL
        AND (
          (
            "rightsVerifiedAt" IS NOT NULL
            AND "rightsBasis" <> 'UNVERIFIED'
          )
          OR (
            "pdfUrl" IS NULL
            AND "abstractUrl" IS NULL
            AND COALESCE(cardinality(images), 0) = 0
          )
        )
        AND (
          "sourceStatus" <> 'BIBLIOGRAPHIC_ONLY'
          OR (
            "pdfUrl" IS NULL
            AND "abstractUrl" IS NULL
            AND "sourcePdfUrl" IS NULL
            AND COALESCE(cardinality(images), 0) = 0
            AND COALESCE(cardinality(novelty), 0) = 0
            AND COALESCE(cardinality("practicalValue"), 0) = 0
            AND COALESCE(cardinality(results), 0) = 0
            AND COALESCE(cardinality(conclusions), 0) = 0
          )
        )
        AND ("sourcePageUrl" IS NULL OR "sourcePageUrl" LIKE 'https://%')
        AND ("sourcePdfUrl" IS NULL OR "sourcePdfUrl" LIKE 'https://%')
        AND to_tsvector(
          'russian',
          concat_ws(' ', title, summary, bibliography, journal, array_to_string(authors, ' '))
        ) @@ search_query.query
      UNION ALL
      SELECT 'guideline' AS type, title, slug, summary, '/guidelines/' || slug AS href
      FROM "ClinicalGuideline", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, summary, content)) @@ search_query.query
      UNION ALL
      SELECT 'regulation' AS type, title, slug, summary, '/regulations/' || slug AS href
      FROM "Regulation", search_query
      WHERE "isPublished" = true
        AND "publishedAt" <= CURRENT_TIMESTAMP
        AND EXISTS (
          SELECT 1
          FROM "RegulationSource" source
          WHERE source."regulationId" = "Regulation".id
            AND source."isOfficial" = true
            AND source."isPublished" = true
            AND source."publishedAt" IS NOT NULL
            AND source."publishedAt" <= CURRENT_TIMESTAMP
        )
        AND EXISTS (
          SELECT 1
          FROM "RegulationEdition" edition
          JOIN "RegulationProvision" provision ON provision."editionId" = edition.id
          JOIN "RegulatoryCheck" check_item ON check_item."provisionId" = provision.id
          WHERE edition."regulationId" = "Regulation".id
            AND edition."isPublished" = true
            AND edition."publishedAt" <= CURRENT_TIMESTAMP
            AND provision."isPublished" = true
            AND provision."publishedAt" <= CURRENT_TIMESTAMP
            AND check_item."isPublished" = true
            AND check_item."publishedAt" <= CURRENT_TIMESTAMP
            AND btrim(check_item.question) <> ''
            AND btrim(check_item."factToEstablish") <> ''
            AND btrim(check_item."primaryEvidenceType") <> ''
            AND btrim(COALESCE(check_item."evidenceThreshold", '')) <> ''
            AND btrim(COALESCE(check_item."nonCompliancePattern", '')) <> ''
        )
        AND (
          to_tsvector('russian', concat_ws(' ', title, summary, content)) @@ search_query.query
          OR EXISTS (
            SELECT 1
            FROM "RegulationEdition" search_edition
            JOIN "RegulationProvision" search_provision ON search_provision."editionId" = search_edition.id
            JOIN "RegulatoryCheck" search_check ON search_check."provisionId" = search_provision.id
            WHERE search_edition."regulationId" = "Regulation".id
              AND search_edition."isPublished" = true
              AND search_edition."publishedAt" <= CURRENT_TIMESTAMP
              AND search_provision."isPublished" = true
              AND search_provision."publishedAt" <= CURRENT_TIMESTAMP
              AND search_check."isPublished" = true
              AND search_check."publishedAt" <= CURRENT_TIMESTAMP
              AND btrim(search_check.question) <> ''
              AND btrim(search_check."factToEstablish") <> ''
              AND btrim(search_check."primaryEvidenceType") <> ''
              AND btrim(COALESCE(search_check."evidenceThreshold", '')) <> ''
              AND btrim(COALESCE(search_check."nonCompliancePattern", '')) <> ''
              AND to_tsvector(
                'russian',
                concat_ws(
                  ' ',
                  search_provision.locator,
                  search_provision.title,
                  search_provision.requirement,
                  search_check.question,
                  search_check."factToEstablish",
                  search_check."primaryEvidenceType"
                )
              ) @@ search_query.query
          )
        )
      UNION ALL
      SELECT
        'independent-control' AS type,
        methodology.title,
        methodology.slug,
        methodology.summary,
        '/independent-control' AS href
      FROM "IndependentControlMethodology" methodology, search_query
      WHERE methodology."isPublished" = true
        AND methodology."publishedAt" IS NOT NULL
        AND methodology."publishedAt" <= CURRENT_TIMESTAMP
        AND methodology."evidenceValidatedAt" IS NOT NULL
        AND btrim(methodology.slug) <> ''
        AND btrim(methodology.title) <> ''
        AND btrim(methodology.summary) <> ''
        AND btrim(COALESCE(methodology.description, '')) <> ''
        AND btrim(methodology."legalStatusNote") <> ''
        AND btrim(methodology."bibliographicCitation") <> ''
        AND btrim(methodology."officialMethodologyUrl") <> ''
        AND btrim(COALESCE(methodology."seoTitle", '')) <> ''
        AND btrim(COALESCE(methodology."seoDescription", '')) <> ''
        AND EXISTS (
          SELECT 1
          FROM "IndependentControlSource" methodology_source
          WHERE methodology_source."methodologyId" = methodology.id
            AND methodology_source."isPublished" = true
            AND methodology_source."publishedAt" IS NOT NULL
            AND methodology_source."publishedAt" <= CURRENT_TIMESTAMP
            AND methodology_source."evidenceValidatedAt" IS NOT NULL
            AND (
              methodology_source."publicFileUrl" IS NULL
              OR (
                methodology_source."rightsBasis" <> 'UNVERIFIED'
                AND methodology_source."rightsVerifiedAt" IS NOT NULL
              )
            )
        )
        AND EXISTS (
          SELECT 1
          FROM "IndependentControlCriterion" criterion
          WHERE criterion."methodologyId" = methodology.id
            AND criterion."isPublished" = true
            AND criterion."publishedAt" IS NOT NULL
            AND criterion."publishedAt" <= CURRENT_TIMESTAMP
            AND criterion."evidenceValidatedAt" IS NOT NULL
            AND btrim(criterion.key) <> ''
            AND btrim(criterion."sourceLocator") <> ''
            AND btrim(criterion."sectionKey") <> ''
            AND btrim(criterion."sectionTitle") <> ''
            AND btrim(criterion.statement) <> ''
            AND btrim(criterion.title) <> ''
            AND btrim(criterion."whatIsChecked") <> ''
            AND btrim(criterion."checkQuestion") <> ''
            AND btrim(criterion."factToEstablish") <> ''
            AND btrim(criterion."confirmingDocument") <> ''
            AND btrim(criterion."evidenceRequired") <> ''
            AND btrim(criterion."evidenceThreshold") <> ''
            AND btrim(criterion."applicabilityNote") <> ''
            AND btrim(COALESCE(criterion."sourceDivergenceNote", '')) <> ''
            AND COALESCE(cardinality(criterion."allowedStatuses"), 0) > 0
            AND (
              criterion."basisKind" = 'DIRECT_NORM'::"IndependentControlBasisKind"
              OR NOT (
                criterion."allowedStatuses" && ARRAY['CONFIRMED', 'LIKELY_NON_COMPLIANCE', 'COMPLIANT']::"RegulatoryAssessmentStatus"[]
              )
            )
            AND EXISTS (
              SELECT 1
              FROM "IndependentControlCriterionNorm" criterion_norm
              JOIN "RegulatoryCheck" norm_check
                ON norm_check.id = criterion_norm."regulatoryCheckId"
              JOIN "RegulationProvision" norm_provision
                ON norm_provision.id = norm_check."provisionId"
              JOIN "RegulationEdition" norm_edition
                ON norm_edition.id = norm_provision."editionId"
              JOIN "Regulation" norm_regulation
                ON norm_regulation.id = norm_edition."regulationId"
              WHERE criterion_norm."criterionId" = criterion.id
                AND criterion_norm."isPublished" = true
                AND criterion_norm."publishedAt" IS NOT NULL
                AND criterion_norm."publishedAt" <= CURRENT_TIMESTAMP
                AND criterion_norm."evidenceValidatedAt" IS NOT NULL
                AND norm_check."isPublished" = true
                AND norm_check."publishedAt" IS NOT NULL
                AND norm_check."publishedAt" <= CURRENT_TIMESTAMP
                AND btrim(norm_check.question) <> ''
                AND btrim(norm_check."factToEstablish") <> ''
                AND btrim(norm_check."primaryEvidenceType") <> ''
                AND btrim(COALESCE(norm_check."evidenceThreshold", '')) <> ''
                AND btrim(COALESCE(norm_check."nonCompliancePattern", '')) <> ''
                AND norm_provision."isPublished" = true
                AND norm_provision."publishedAt" IS NOT NULL
                AND norm_provision."publishedAt" <= CURRENT_TIMESTAMP
                AND norm_edition."isPublished" = true
                AND norm_edition."publishedAt" IS NOT NULL
                AND norm_edition."publishedAt" <= CURRENT_TIMESTAMP
                AND norm_regulation."isPublished" = true
                AND norm_regulation."publishedAt" IS NOT NULL
                AND norm_regulation."publishedAt" <= CURRENT_TIMESTAMP
                AND EXISTS (
                  SELECT 1
                  FROM "RegulationSource" norm_source
                  WHERE norm_source."regulationId" = norm_regulation.id
                    AND norm_source."isOfficial" = true
                    AND norm_source."isPublished" = true
                    AND norm_source."publishedAt" IS NOT NULL
                    AND norm_source."publishedAt" <= CURRENT_TIMESTAMP
                )
            )
            AND to_tsvector(
              'russian',
              concat_ws(
                ' ',
                methodology.title,
                methodology.summary,
                methodology."legalStatusNote",
                methodology."bibliographicCitation",
                criterion.title,
                criterion.statement,
                criterion."whatIsChecked",
                criterion."checkQuestion",
                criterion."factToEstablish",
                criterion."confirmingDocument",
                criterion."evidenceRequired",
                criterion."applicabilityNote",
                criterion."sourceDivergenceNote"
              )
            ) @@ search_query.query
        )
      UNION ALL
      SELECT 'history' AS type, title, slug, summary, '/history/' || slug AS href
      FROM "HistoryEntry", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, summary, content)) @@ search_query.query
      UNION ALL
      SELECT 'innovation' AS type, title, slug, summary, '/innovations/' || slug AS href
      FROM "Innovation", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, summary, content)) @@ search_query.query
      UNION ALL
      SELECT 'investigation' AS type, title, slug, summary, '/investigations/' || slug AS href
      FROM "Investigation", search_query
      WHERE "isPublished" = true
        AND "publishedAt" <= CURRENT_TIMESTAMP
        AND "evidenceValidatedAt" IS NOT NULL
        AND to_tsvector('russian', concat_ws(' ', title, summary, status, "statusNote")) @@ search_query.query
      UNION ALL
      SELECT 'news' AS type, title, slug, summary, '/news/' || slug AS href
      FROM "News", search_query
      WHERE "isPublished" = true
        AND "publishedAt" <= CURRENT_TIMESTAMP
        AND to_tsvector('russian', concat_ws(' ', title, summary, content)) @@ search_query.query
      LIMIT 40
    `);
  } catch {
    return [];
  }
}
