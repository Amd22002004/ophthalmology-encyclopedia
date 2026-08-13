import assert from "node:assert/strict";
import test from "node:test";
import { REGULATION_TOPICS, REGULATIONS } from "../../../prisma/data/regulations/core";
import { EXTENDED_REGULATIONS } from "../../../prisma/data/regulations/extended";
import { INDEPENDENT_CONTROL_REGULATIONS } from "../../../prisma/data/regulations/independent-control";
import { ORDER_633N } from "../../../prisma/data/regulations/order-633n";
import { validateRegulationCorpus } from "../../../prisma/data/regulations/validate";

const EXPECTED_TOPICS = [
  "medical-activity-licensing",
  "medical-device-registration",
  "medical-device-operation",
  "maintenance",
  "technical-documentation",
  "ophthalmology-equipment",
  "internal-quality-control",
  "roszdravnadzor-control",
  "metrology",
  "decommissioning",
  "independent-quality-assessment",
  "public-medical-information",
  "healthcare-accessibility",
  "paid-medical-services",
];

const REGULATORY_CORPUS = [
  ...REGULATIONS,
  ...EXTENDED_REGULATIONS,
  ...INDEPENDENT_CONTROL_REGULATIONS,
  ORDER_633N,
];

test("использует ровно согласованные категории нормативного графа", () => {
  assert.deepEqual(
    REGULATION_TOPICS.map((topic) => topic.slug),
    EXPECTED_TOPICS,
  );
});

test("не допускает публичных норм без официального источника и рабочего вопроса", () => {
  const result = validateRegulationCorpus(REGULATORY_CORPUS, REGULATION_TOPICS);

  assert.deepEqual(result, { valid: true, errors: [] });
});

test("не считает опубликованной карточку без даты публикации", () => {
  const source = REGULATIONS.find((item) => item.slug === "federal-law-323-fz");
  assert.ok(source);
  const invalid = { ...source, publishedAt: undefined };

  const result = validateRegulationCorpus([invalid], REGULATION_TOPICS);

  assert.equal(result.valid, false);
  assert.ok(
    result.errors.includes(
      "regulation:federal-law-323-fz: публичный акт не имеет publishedAt",
    ),
  );
});

test("фиксирует переходы текущих и будущих правил без ретроактивного применения", () => {
  const bySlug = new Map(REGULATORY_CORPUS.map((regulation) => [regulation.slug, regulation]));

  assert.equal(bySlug.get("minzdrav-order-633n-2025")?.legalStatus, "IN_FORCE");
  assert.equal(bySlug.get("minzdrav-order-902n-2012")?.legalStatus, "EXPIRED");
  assert.equal(bySlug.has("minzdrav-order-327n-2026"), false);
  assert.equal(bySlug.get("minzdrav-order-980n-2020")?.effectiveTo, "2026-08-31");
  assert.equal(bySlug.get("minzdrav-order-540n-2026")?.effectiveFrom, "2026-09-01");
  assert.equal(bySlug.get("minzdrav-order-1113n-2020")?.effectiveTo, "2026-08-31");
  assert.equal(bySlug.get("minzdrav-order-541n-2026")?.effectiveFrom, "2026-09-01");

  assert.deepEqual(
    [
      ["minzdrav-order-956n-2014", "EXPIRED", "2015-03-09", "2025-08-31"],
      ["minzdrav-order-118n-2025", "IN_FORCE", "2025-09-01", "2031-02-28"],
      ["minzdrav-order-802n-2015", "EXPIRED", "2016-01-01", "2025-08-31"],
      ["minzdrav-order-210n-2025", "IN_FORCE", "2025-09-01", "2031-08-31"],
      ["government-resolution-736-2023", "IN_FORCE", "2023-09-01", "2026-08-31"],
      ["government-resolution-659-2026", "FUTURE", "2026-09-01", "2031-08-31"],
    ].map(([slug]) => {
      const regulation = bySlug.get(slug);
      return [slug, regulation?.legalStatus, regulation?.effectiveFrom, regulation?.effectiveTo];
    }),
    [
      ["minzdrav-order-956n-2014", "EXPIRED", "2015-03-09", "2025-08-31"],
      ["minzdrav-order-118n-2025", "IN_FORCE", "2025-09-01", "2031-02-28"],
      ["minzdrav-order-802n-2015", "EXPIRED", "2016-01-01", "2025-08-31"],
      ["minzdrav-order-210n-2025", "IN_FORCE", "2025-09-01", "2031-08-31"],
      ["government-resolution-736-2023", "IN_FORCE", "2023-09-01", "2026-08-31"],
      ["government-resolution-659-2026", "FUTURE", "2026-09-01", "2031-08-31"],
    ],
  );
});

test("хранит точные официальные источники целевых актов и статью 79.1", () => {
  const officialUrls = new Map([
    ["minzdrav-order-956n-2014", "https://publication.pravo.gov.ru/document/0001201502260018"],
    ["minzdrav-order-118n-2025", "https://publication.pravo.gov.ru/document/0001202504110006"],
    ["mintrud-order-344n-2018", "https://publication.pravo.gov.ru/document/0001201810120032"],
    ["minzdrav-order-210n-2025", "https://publication.pravo.gov.ru/document/0001202505200003"],
    ["government-resolution-736-2023", "https://publication.pravo.gov.ru/document/0001202305120025"],
    ["government-resolution-659-2026", "https://publication.pravo.gov.ru/document/0001202606010083"],
  ]);
  const bySlug = new Map(REGULATORY_CORPUS.map((regulation) => [regulation.slug, regulation]));

  for (const [slug, url] of officialUrls) {
    const regulation = bySlug.get(slug);
    assert.ok(regulation, `Нет акта ${slug}`);
    assert.equal(regulation.officialPublicationUrl, url, slug);
    assert.ok(regulation.sources.some((source) => source.isOfficial && source.url === url), slug);
  }

  const law323 = bySlug.get("federal-law-323-fz");
  assert.ok(law323);
  const article791 = law323.editions.flatMap((edition) => edition.provisions)
    .find((provision) => provision.key === "article-79-1-independent-assessment");
  assert.ok(article791);
  assert.equal(article791.locator, "Статья 79.1, части 1 и 5");
  assert.equal(article791.effectiveFrom, "2018-03-06");
  assert.ok(article791.checks.some((check) => check.key === "formal-noc-scope"));
});

test("не приписывает текущую формулировку статьи 15 всему периоду с 1995 года", () => {
  const law181 = REGULATORY_CORPUS.find((item) => item.slug === "federal-law-181-fz");
  assert.ok(law181);

  const edition = law181.editions.find((item) => item.key === "consolidated-2026-08-13");
  assert.ok(edition);
  const article15 = edition.provisions.find((item) => item.key === "article-15-accessibility");
  assert.ok(article15);

  assert.equal(edition.effectiveFrom, "2024-01-01");
  assert.equal(edition.effectiveTo, "2026-08-31");
  assert.equal(article15.effectiveFrom, edition.effectiveFrom);
  assert.equal(article15.effectiveTo, edition.effectiveTo);
  assert.equal(edition.historicalUseAllowed, false);
  assert.match(edition.transitionNote ?? "", /архивн.*редакц/i);

  const futureEdition = law181.editions.find((item) => item.key === "future-2026-09-01");
  assert.ok(futureEdition);
  assert.equal(futureEdition.effectiveFrom, "2026-09-01");
  assert.equal(futureEdition.legalStatus, "FUTURE");
  assert.ok(
    law181.sources.some(
      (source) =>
        source.editionKey === futureEdition.key &&
        source.url === "https://publication.pravo.gov.ru/document/0001202512290040",
    ),
  );
});

test("633н разделяет оснащение по каждому применимому приложению", () => {
  const expectedAppendices = new Map([
    ["3", 67],
    ["6", 54],
    ["9", 142],
    ["12", 17],
    ["15", 26],
    ["18", 25],
    ["23", 143],
    ["26", 216],
    ["29", 27],
    ["32", 5],
  ]);
  const provisions = ORDER_633N.editions.flatMap((edition) => edition.provisions);

  for (const [appendix, expectedRows] of expectedAppendices) {
    const provision = provisions.find((item) => item.locator.includes(`Приложение № ${appendix}`));
    assert.ok(provision, `Нет положения для приложения № ${appendix}`);
    assert.equal(
      provision.equipmentRequirements?.length,
      expectedRows,
      `Нарушена полнота приложения № ${appendix}`,
    );
    assert.ok(provision.checks.some((check) => check.isPublished), `Нет check question для приложения № ${appendix}`);
  }

  const requirements = provisions.flatMap((provision) => provision.equipmentRequirements ?? []);
  assert.equal(requirements.length, 722);
  assert.equal(new Set(requirements.map((item) => item.stableKey)).size, 722);
  assert.equal(
    requirements.filter((item) => item.quantity === "В официальном тексте не указано").length,
    4,
  );
});

test("не смешивает нормативный корпус с конкретной клиникой", () => {
  const serialized = JSON.stringify(REGULATORY_CORPUS).toLocaleLowerCase("ru-RU");

  assert.equal(serialized.includes("глазцентр"), false);
  assert.equal(serialized.includes("1010-2571"), false);
  assert.equal(serialized.includes("независимая оценка качества бланк.doc"), false);
});
