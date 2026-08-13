import type { RegulationSeed, RegulationTopicSeed } from "./types";

const OFFICIAL_HOSTS = new Set([
  "publication.pravo.gov.ru",
  "www.publication.pravo.gov.ru",
  "pravo.gov.ru",
  "www.pravo.gov.ru",
  "roszdravnadzor.gov.ru",
  "www.roszdravnadzor.gov.ru",
  "minzdrav.gov.ru",
  "www.minzdrav.gov.ru",
  "fgis.gost.ru",
  "www.fgis.gost.ru",
]);

function isNonEmpty(value: string | undefined) {
  return Boolean(value?.trim());
}

function isIsoDate(value: string | undefined) {
  return value == null || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isOfficialUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && OFFICIAL_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function isPublishedByDate(isPublished: boolean, publishedAt: string | undefined) {
  return !isPublished || (publishedAt != null && isIsoDate(publishedAt));
}

export function validateRegulationCorpus(
  regulations: readonly RegulationSeed[],
  topics: readonly RegulationTopicSeed[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const topicSlugs = new Set(topics.map((topic) => topic.slug));
  const regulationSlugs = new Set(regulations.map((regulation) => regulation.slug));

  if (topicSlugs.size !== topics.length) errors.push("topics: повторяющийся slug");
  if (regulationSlugs.size !== regulations.length) errors.push("regulations: повторяющийся slug");

  for (const topic of topics) {
    if (!isNonEmpty(topic.title) || !isNonEmpty(topic.description)) {
      errors.push(`topic:${topic.slug}: пустое название или описание`);
    }
  }

  for (const regulation of regulations) {
    const prefix = `regulation:${regulation.slug}`;
    if (!isNonEmpty(regulation.title) || !isNonEmpty(regulation.number) || !isNonEmpty(regulation.issuingAuthority)) {
      errors.push(`${prefix}: отсутствуют идентификационные реквизиты`);
    }
    if (!isIsoDate(regulation.adoptedAt) || !isIsoDate(regulation.effectiveFrom) || !isIsoDate(regulation.effectiveTo)) {
      errors.push(`${prefix}: дата должна иметь формат YYYY-MM-DD`);
    }
    if (!isOfficialUrl(regulation.officialPublicationUrl)) {
      errors.push(`${prefix}: основной URL не является официальным HTTPS-источником`);
    }
    if (
      regulation.isPublished &&
      !regulation.sources.some(
        (source) =>
          source.isOfficial &&
          source.isPublished === true &&
          source.publishedAt != null &&
          isOfficialUrl(source.url),
      )
    ) {
      errors.push(`${prefix}: нет официального источника`);
    }
    if (!isPublishedByDate(regulation.isPublished, regulation.publishedAt)) {
      errors.push(`${prefix}: публичный акт не имеет publishedAt`);
    }
    if (regulation.topicSlugs.some((slug) => !topicSlugs.has(slug))) {
      errors.push(`${prefix}: неизвестная тема`);
    }
    if (regulation.editions.length === 0) errors.push(`${prefix}: нет редакций`);
    if (/глазцентр|1010-2571/i.test(JSON.stringify(regulation))) {
      errors.push(`${prefix}: нормативная карточка содержит данные конкретного расследования`);
    }

    for (const source of regulation.sources) {
      if (source.isOfficial && !isOfficialUrl(source.url)) {
        errors.push(`${prefix}: источник ${source.url} помечен официальным ошибочно`);
      }
      if (!isPublishedByDate(source.isPublished ?? false, source.publishedAt)) {
        errors.push(`${prefix}: публичный источник ${source.url} не имеет publishedAt`);
      }
    }

    for (const relation of regulation.relations ?? []) {
      if (!regulationSlugs.has(relation.targetSlug)) {
        errors.push(`${prefix}: связь указывает на отсутствующий акт ${relation.targetSlug}`);
      }
      if (relation.officialSourceUrl && !isOfficialUrl(relation.officialSourceUrl)) {
        errors.push(`${prefix}: связь не имеет официального URL`);
      }
    }

    const editionKeys = new Set<string>();
    for (const edition of regulation.editions) {
      const editionPrefix = `${prefix}:edition:${edition.key}`;
      if (editionKeys.has(edition.key)) errors.push(`${editionPrefix}: повторяющийся key`);
      editionKeys.add(edition.key);
      if (!isIsoDate(edition.effectiveFrom) || !isIsoDate(edition.effectiveTo)) {
        errors.push(`${editionPrefix}: дата должна иметь формат YYYY-MM-DD`);
      }
      if (!isOfficialUrl(edition.officialTextUrl)) {
        errors.push(`${editionPrefix}: текст редакции не ведёт на официальный источник`);
      }
      if (!isIsoDate(edition.verifiedAt) || !isNonEmpty(edition.verificationNote)) {
        errors.push(`${editionPrefix}: нет даты и границы проверки редакции`);
      }
      if (!isPublishedByDate(edition.isPublished, edition.publishedAt)) {
        errors.push(`${editionPrefix}: публичная редакция не имеет publishedAt`);
      }
      if (edition.isPublished && edition.provisions.length === 0) {
        errors.push(`${editionPrefix}: публичная редакция не содержит положений`);
      }

      const provisionKeys = new Set<string>();
      for (const provision of edition.provisions) {
        const provisionPrefix = `${editionPrefix}:provision:${provision.key}`;
        if (provisionKeys.has(provision.key)) errors.push(`${provisionPrefix}: повторяющийся key`);
        provisionKeys.add(provision.key);
        if (!topicSlugs.has(provision.topicSlug)) errors.push(`${provisionPrefix}: неизвестная тема`);
        if (
          !isNonEmpty(provision.locator) ||
          !isNonEmpty(provision.requirement) ||
          !isNonEmpty(provision.applicability)
        ) {
          errors.push(`${provisionPrefix}: нет locator, требования или применимости`);
        }

        const publishedChecks = provision.checks.filter(
          (check) =>
            check.isPublished &&
            isNonEmpty(check.question) &&
            isNonEmpty(check.factToEstablish) &&
            isNonEmpty(check.primaryEvidenceType) &&
            isNonEmpty(check.evidenceThreshold),
        );
        if (provision.isPublished && publishedChecks.length === 0) {
          errors.push(`${provisionPrefix}: PUBLISHED_CHECK_REQUIRED`);
        }
        if (!isPublishedByDate(provision.isPublished, provision.publishedAt)) {
          errors.push(`${provisionPrefix}: публичная норма не имеет publishedAt`);
        }
        for (const check of provision.checks) {
          if (
            check.isPublished &&
            (!isNonEmpty(check.question) ||
              !isNonEmpty(check.factToEstablish) ||
              !isNonEmpty(check.primaryEvidenceType) ||
              !isNonEmpty(check.evidenceThreshold))
          ) {
            errors.push(`${provisionPrefix}:check:${check.key}: неполный публичный проверочный вопрос`);
          }
          if (!isPublishedByDate(check.isPublished, check.publishedAt)) {
            errors.push(`${provisionPrefix}:check:${check.key}: нет publishedAt`);
          }
          if (
            check.isPublished &&
            (!check.question.trim() ||
              !check.factToEstablish.trim() ||
              !check.primaryEvidenceType.trim() ||
              !check.evidenceThreshold.trim())
          ) {
            errors.push(`${provisionPrefix}:check:${check.key}: пробельное обязательное поле`);
          }
          if (check.officialSearchUrl && !isOfficialUrl(check.officialSearchUrl)) {
            errors.push(`${provisionPrefix}:check:${check.key}: неофициальный search URL`);
          }
        }

        for (const item of provision.equipmentRequirements ?? []) {
          if (
            !isNonEmpty(item.appendix) ||
            !isNonEmpty(item.position) ||
            !isNonEmpty(item.regulatoryName) ||
            !isNonEmpty(item.quantity)
          ) {
            errors.push(`${provisionPrefix}:equipment:${item.stableKey}: неполная строка оснащения`);
          }
          if (!isPublishedByDate(item.isPublished, item.publishedAt)) {
            errors.push(`${provisionPrefix}:equipment:${item.stableKey}: нет publishedAt`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
