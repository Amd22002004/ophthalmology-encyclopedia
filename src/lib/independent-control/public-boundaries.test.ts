import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function functionSlice(input: string, start: string, next: string) {
  const from = input.indexOf(start);
  const to = input.indexOf(next, from + start.length);
  assert.notEqual(from, -1, `Не найдена функция ${start}`);
  assert.notEqual(to, -1, `Не найдена граница ${next}`);
  return input.slice(from, to);
}

test("list, detail и topic-count используют единый official-source gate", () => {
  const loaders = source("src/lib/loaders.ts");
  const list = functionSlice(loaders, "export async function getRegulations", "export async function getRegulationTopics");
  const topics = functionSlice(loaders, "export async function getRegulationTopics", "export async function getRegulation(");
  const detail = functionSlice(loaders, "export async function getRegulation(", "// ─── History");

  assert.match(list, /publicRegulationWhere\(now\)/);
  assert.match(topics, /publicRegulationWhere\(now\)/);
  assert.match(detail, /publicRegulationWhere\(now\)/);
  assert.match(detail, /sources:\s*\{[\s\S]*publicRegulationSourceWhere\(now\)/);
});

test("methodology loader не выбирает internalFileName и обязательно выполняет pure contract", () => {
  const loaders = source("src/lib/loaders.ts");
  const methodology = functionSlice(
    loaders,
    "export async function getIndependentControlMethodologies",
    "// ─── Regulations",
  );

  assert.doesNotMatch(methodology, /internalFileName/);
  assert.match(methodology, /publicIndependentControlMethodologyWhere\(now\)/);
  assert.match(methodology, /canPublishIndependentControlMethodology/);
});

test("investigation loader держит independent-control оценки отдельно и post-filter обязателен", () => {
  const loaders = source("src/lib/loaders.ts");
  const investigation = functionSlice(
    loaders,
    "export async function getInvestigation(",
    "export type NewsCatalogItem",
  );

  assert.match(investigation, /independentControlAssessments:/);
  assert.match(investigation, /publicIndependentControlAssessmentWhere\(now\)/);
  assert.match(investigation, /canPublishIndependentControlAssessment/);
  assert.match(investigation, /appliedCriterionNorm/);
  assert.match(investigation, /legalNonApplicabilityProven:\s*false/);
});

test("search содержит official RegulationSource gate и полный independent-control parent gate", () => {
  const search = source("src/lib/search.ts");

  assert.match(search, /FROM "RegulationSource"/);
  assert.match(search, /source\."isOfficial" = true/);
  assert.match(search, /source\."isPublished" = true/);
  assert.match(search, /source\."publishedAt" <= CURRENT_TIMESTAMP/);
  assert.match(search, /FROM "IndependentControlMethodology"/);
  assert.match(search, /FROM "IndependentControlSource"/);
  assert.match(search, /FROM "IndependentControlCriterion"/);
  assert.match(search, /FROM "IndependentControlCriterionNorm"/);
  assert.match(search, /FROM "RegulationSource" norm_source/);
  assert.doesNotMatch(search, /internalFileName/);
});

test("sitemap включает один стабильный маршрут и использует SSOT regulation predicate", () => {
  const sitemap = source("src/app/sitemap.ts");

  assert.equal((sitemap.match(/"\/independent-control"/g) ?? []).length, 1);
  assert.match(sitemap, /publicRegulationWhere\(now\)/);
});
