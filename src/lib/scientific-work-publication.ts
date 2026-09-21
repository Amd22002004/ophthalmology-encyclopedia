import type { Prisma } from "@/generated/prisma/client";

export type ScientificWorkSourceStatus =
  | "BIBLIOGRAPHIC_ONLY"
  | "FULL_TEXT"
  | "EXTRACTED_PAGES"
  | "SCANNED_PAGES";

export type ScientificWorkPublicationInput = {
  slug: string | null;
  sourceStatus: ScientificWorkSourceStatus;
  isPublished: boolean;
  publishedAt: Date | null;
  evidenceValidatedAt: Date | null;
  publicationBlockReason?: string | null;
  rightsVerifiedAt: Date | null;
  rightsBasis:
    | "UNVERIFIED"
    | "OPEN_LICENSE"
    | "AUTHOR_PERMISSION"
    | "PUBLISHER_PERMISSION"
    | "USER_CONFIRMED_PERMISSION"
    | "PUBLIC_DOMAIN";
  rightsNote?: string | null;
  pdfUrl: string | null;
  abstractUrl: string | null;
  sourcePageUrl: string | null;
  sourcePdfUrl: string | null;
  images: readonly string[];
  novelty: readonly string[];
  practicalValue: readonly string[];
  results: readonly string[];
  conclusions: readonly string[];
  sourceNote?: string | null;
};

export type ScientificWorkPublicationViolation =
  | "LOCAL_ASSETS_REQUIRE_RIGHTS"
  | "LOCAL_ASSETS_REQUIRE_RIGHTS_BASIS"
  | "BIBLIOGRAPHIC_ONLY_HAS_PDF"
  | "BIBLIOGRAPHIC_ONLY_HAS_ABSTRACT"
  | "BIBLIOGRAPHIC_ONLY_HAS_SOURCE_PDF"
  | "BIBLIOGRAPHIC_ONLY_HAS_IMAGES"
  | "BIBLIOGRAPHIC_ONLY_HAS_NOVELTY"
  | "BIBLIOGRAPHIC_ONLY_HAS_PRACTICAL_VALUE"
  | "BIBLIOGRAPHIC_ONLY_HAS_RESULTS"
  | "BIBLIOGRAPHIC_ONLY_HAS_CONCLUSIONS"
  | "SOURCE_PAGE_MUST_BE_EXTERNAL_HTTPS"
  | "SOURCE_PDF_MUST_BE_EXTERNAL_HTTPS"
  | "PUBLICATION_HAS_EDITORIAL_BLOCKER";

/**
 * SSOT-фильтр для всех публичных Prisma-запросов ScientificWork.
 * Поля pdfUrl/abstractUrl/images зарезервированы для локальных файлов; внешние
 * ссылки издателя хранятся отдельно в sourcePdfUrl/sourcePageUrl.
 */
export function publicScientificWorkWhere(
  now = new Date(),
): Prisma.ScientificWorkWhereInput {
  const noLocalAssets: Prisma.ScientificWorkWhereInput = {
    pdfUrl: null,
    abstractUrl: null,
    images: { isEmpty: true },
  };

  return {
    slug: { not: "" },
    isPublished: true,
    publishedAt: { lte: now },
    evidenceValidatedAt: { not: null },
    publicationBlockReason: null,
    AND: [
      {
        OR: [
          {
            rightsVerifiedAt: { not: null },
            rightsBasis: { not: "UNVERIFIED" },
          },
          noLocalAssets,
        ],
      },
      {
        OR: [
          { sourcePageUrl: null },
          { sourcePageUrl: { startsWith: "https://" } },
        ],
      },
      {
        OR: [{ sourcePdfUrl: null }, { sourcePdfUrl: { startsWith: "https://" } }],
      },
      {
        OR: [
          { sourceStatus: { not: "BIBLIOGRAPHIC_ONLY" } },
          {
            sourceStatus: "BIBLIOGRAPHIC_ONLY",
            ...noLocalAssets,
            sourcePdfUrl: null,
            novelty: { isEmpty: true },
            practicalValue: { isEmpty: true },
            results: { isEmpty: true },
            conclusions: { isEmpty: true },
          },
        ],
      },
    ],
  };
}

function hasValue(value: string | null) {
  return value !== null && value.trim().length > 0;
}

export function getScientificWorkPublicationViolations(
  work: ScientificWorkPublicationInput,
): ScientificWorkPublicationViolation[] {
  const violations: ScientificWorkPublicationViolation[] = [];

  if (work.publicationBlockReason !== null && work.publicationBlockReason !== undefined) {
    violations.push("PUBLICATION_HAS_EDITORIAL_BLOCKER");
  }

  if (work.sourcePageUrl !== null && !work.sourcePageUrl.startsWith("https://")) {
    violations.push("SOURCE_PAGE_MUST_BE_EXTERNAL_HTTPS");
  }
  if (work.sourcePdfUrl !== null && !work.sourcePdfUrl.startsWith("https://")) {
    violations.push("SOURCE_PDF_MUST_BE_EXTERNAL_HTTPS");
  }

  if (work.sourceStatus === "BIBLIOGRAPHIC_ONLY") {
    if (hasValue(work.pdfUrl)) violations.push("BIBLIOGRAPHIC_ONLY_HAS_PDF");
    if (hasValue(work.abstractUrl)) violations.push("BIBLIOGRAPHIC_ONLY_HAS_ABSTRACT");
    if (hasValue(work.sourcePdfUrl)) {
      violations.push("BIBLIOGRAPHIC_ONLY_HAS_SOURCE_PDF");
    }
    if (work.images.length > 0) violations.push("BIBLIOGRAPHIC_ONLY_HAS_IMAGES");
    if (work.novelty.length > 0) violations.push("BIBLIOGRAPHIC_ONLY_HAS_NOVELTY");
    if (work.practicalValue.length > 0) {
      violations.push("BIBLIOGRAPHIC_ONLY_HAS_PRACTICAL_VALUE");
    }
    if (work.results.length > 0) violations.push("BIBLIOGRAPHIC_ONLY_HAS_RESULTS");
    if (work.conclusions.length > 0) violations.push("BIBLIOGRAPHIC_ONLY_HAS_CONCLUSIONS");

    return violations;
  }

  const hasLocalAssets =
    hasValue(work.pdfUrl) || hasValue(work.abstractUrl) || work.images.length > 0;

  if (hasLocalAssets && work.rightsVerifiedAt === null) {
    violations.push("LOCAL_ASSETS_REQUIRE_RIGHTS");
  }
  if (hasLocalAssets && work.rightsBasis === "UNVERIFIED") {
    violations.push("LOCAL_ASSETS_REQUIRE_RIGHTS_BASIS");
  }

  return violations;
}

/**
 * Публичный slug сам по себе не публикует запись: видимость открывается только
 * после наступления даты, evidence-validation и прохождения файловых инвариантов.
 */
export function isScientificWorkPubliclyVisibleAt(
  work: ScientificWorkPublicationInput,
  now = new Date(),
) {
  return (
    work.slug !== null &&
    work.slug.trim().length > 0 &&
    work.isPublished &&
    work.publishedAt !== null &&
    work.publishedAt.getTime() <= now.getTime() &&
    work.evidenceValidatedAt !== null &&
    getScientificWorkPublicationViolations(work).length === 0
  );
}
