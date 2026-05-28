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
      SELECT 'publication' AS type, title, slug, abstract AS summary, '/publications/' || slug AS href
      FROM "Publication", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, abstract, content)) @@ search_query.query
      UNION ALL
      SELECT 'guideline' AS type, title, slug, summary, '/guidelines/' || slug AS href
      FROM "ClinicalGuideline", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, summary, content)) @@ search_query.query
      UNION ALL
      SELECT 'regulation' AS type, title, slug, summary, '/regulations/' || slug AS href
      FROM "Regulation", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, summary, content)) @@ search_query.query
      UNION ALL
      SELECT 'history' AS type, title, slug, summary, '/history/' || slug AS href
      FROM "HistoryEntry", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, summary, content)) @@ search_query.query
      UNION ALL
      SELECT 'innovation' AS type, title, slug, summary, '/innovations/' || slug AS href
      FROM "Innovation", search_query
      WHERE to_tsvector('russian', concat_ws(' ', title, summary, content)) @@ search_query.query
      LIMIT 40
    `);
  } catch {
    return [];
  }
}
