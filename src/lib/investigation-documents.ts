type DocumentTitleInput = {
  kind: string;
  mimeType?: string | null;
  source?: string | null;
  title?: string | null;
};

/**
 * These two source documents are retained for internal editorial use but are
 * intentionally not part of the public evidence set for this investigation.
 */
export const PUBLICLY_HIDDEN_INVESTIGATION_DOCUMENT_SLUGS = [
  "appeal-to-depzdrav",
  "appeal-to-roszdravnadzor",
] as const;

export const GLAZCENTR_INVESTIGATION_SLUG =
  "proverka-oborudovaniya-glaztsentr-tyumen";

const publiclyHiddenDocumentSlugs = new Set<string>(
  PUBLICLY_HIDDEN_INVESTIGATION_DOCUMENT_SLUGS,
);

export function isPubliclyHiddenInvestigationDocument(
  investigationSlug: string,
  document: { slug: string },
) {
  return investigationSlug === GLAZCENTR_INVESTIGATION_SLUG && publiclyHiddenDocumentSlugs.has(document.slug);
}

export const PUBLIC_ASSOCIATION_MATERIALS_NOTE =
  "Для уточнения происхождения и правового статуса оборудования был направлен запрос. После получения ответа ООО „Алкон Фармацевтика“ Ассоциация направила материалы в Департамент здравоохранения Тюменской области и территориальный орган Росздравнадзора для рассмотрения в пределах их полномочий.";

const INTERNAL_TITLE_PATTERN =
  /(?:chatgpt|deep[-\s]?research|midjourney|stable\s*diffusion|dall[·-]?e|исходн(?:ый|ая)\s+файл|source[-\s_]?material|\.(?:md|docx?|pdf|png|jpe?g|webp)\b)/i;

function fallbackTitle({ kind, mimeType, source }: DocumentTitleInput) {
  const sourceSuffix = source ? ` ${source}` : "";

  switch (kind) {
    case "association-appeal":
      return source ? `Официальное обращение ${source}` : "Официальное обращение";
    case "manufacturer-response":
    case "organization-response":
      return source ? `Ответ ${source}` : "Ответ организации";
    case "official-letter":
      return source ? `Письмо ${source}` : "Официальное письмо";
    case "court-document":
      return "Судебный документ";
    case "registration-document":
      return "Регистрационный документ";
    case "equipment-photo":
      return "Фотография оборудования";
    case "object-photo":
      return "Фотография объекта";
    case "expert-opinion":
      return "Экспертное заключение";
    default:
      return mimeType?.startsWith("image/") ? "Фотография" : `Документ расследования${sourceSuffix}`;
  }
}

/**
 * Public document names must identify the evidence, never a local filename,
 * generator label, temporary title or storage path. This is also the fallback
 * used for documents added by future upload flows.
 */
export function getPublicInvestigationDocumentTitle(document: DocumentTitleInput) {
  const title = document.title?.trim();
  if (title && !INTERNAL_TITLE_PATTERN.test(title)) return title;

  return fallbackTitle(document);
}
