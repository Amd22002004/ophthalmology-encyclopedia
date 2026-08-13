import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const pagePath = "src/app/(platform)/independent-control/page.tsx";
const methodologyComponentPath =
  "src/components/independent-control/independent-control-methodologies.tsx";
const assessmentComponentPath =
  "src/components/investigations/independent-control-assessments.tsx";

test("/independent-control задаёт canonical metadata и WebPage schema, но не Legislation", () => {
  const page = source(pagePath);

  assert.match(page, /createPageMetadata\s*\(/);
  assert.match(page, /path:\s*["']\/independent-control["']/);
  assert.match(page, /["']@type["']:\s*["']WebPage["']/);
  assert.doesNotMatch(page, /Legislation/);
});

test("страница использует только public loader и объясняет ненормативный статус и права", () => {
  const page = source(pagePath);
  const component = source(methodologyComponentPath);
  const publicUi = `${page}\n${component}`;

  assert.match(page, /getIndependentControlMethodologies/);
  assert.doesNotMatch(page, /getPrisma|@\/lib\/prisma/);
  assert.match(publicUi, /не (?:является|считается) (?:законом|нормативным правовым актом)/i);
  assert.match(publicUi, /не публикуется[^.]*прав[^.]*публичн[^.]*размещ/i);
  assert.doesNotMatch(publicUi, /internalFileName/);
  assert.doesNotMatch(publicUi, /docs[\\/]Независимая оценка качества Бланк\.doc/i);
  assert.doesNotMatch(publicUi, /href=\{?[^\n}]*\.doc(?:["'}]|\b)/i);
});

test("карточка критерия показывает рабочий вопрос, доказательства, применимость и norm links", () => {
  const component = source(methodologyComponentPath);

  for (const field of [
    "criterion.checkQuestion",
    "criterion.confirmingDocument",
    "criterion.evidenceThreshold",
    "criterion.applicabilityNote",
    "criterion.sourceDivergenceNote",
  ]) {
    assert.match(component, new RegExp(field.replace(".", "\\.")));
  }
  assert.match(component, /criterion\.normLinks\.map/);
  assert.match(component, /source\.url/);
  assert.match(component, /\/regulations\/\$\{/);
  assert.match(component, /criterion\.allowedStatuses/);
  assert.match(component, /criterion\.isSourceCriterion/);
});

test("расследование выводит отдельный evidence-gated блок independent-control", () => {
  const component = source(assessmentComponentPath);
  const template = source("src/components/templates/investigation-template.tsx");

  assert.match(component, /<h2[^>]*>\s*Проверка по критериям независимой оценки\s*<\/h2>/);
  assert.match(component, /id=["']independent-control-assessments["']/);
  assert.match(template, /#independent-control-assessments/);
  assert.match(template, /data\.independentControlAssessments\.length/);
  assert.match(template, /IndependentControlAssessments/);
  assert.match(component, /Подтверждено/);
  assert.match(component, /Вероятное несоответствие/);
  assert.match(component, /Требует проверки/);
  assert.match(component, /Не подтверждено/);
  assert.match(component, /Соответствует/);
  assert.doesNotMatch(component, /regulatoryAssessments/);
});

test("расследования и независимая оценка имеют разные названия и ссылки", () => {
  const investigations = source("src/app/(platform)/investigations/page.tsx");
  const template = source("src/components/templates/investigation-template.tsx");
  const contentModel = source("src/lib/content-model.ts");

  assert.match(investigations, /title:\s*["']Расследования["']/);
  assert.match(investigations, /title=["']Расследования["']/);
  assert.match(investigations, /eyebrow=["']Расследования["']/);
  assert.doesNotMatch(investigations, /Независимый контроль/);
  assert.doesNotMatch(template, /Независимый контроль/);
  assert.match(contentModel, /href:\s*["']\/investigations["'],\s*label:\s*["']Расследования["']/);
  assert.match(contentModel, /href:\s*["']\/independent-control["'],\s*label:\s*["']Независимая оценка["']/);
});

test("карточка нормы не синтезирует источник и показывает критерии достаточности", () => {
  const detail = source("src/components/regulations/regulation-detail.tsx");

  assert.doesNotMatch(detail, /regulation\.officialPublicationUrl/);
  assert.match(detail, /evidenceThreshold\??:\s*string/);
  assert.match(detail, /nonCompliancePattern\??:\s*string/);
  assert.match(detail, /check\.evidenceThreshold/);
  assert.match(detail, /check\.nonCompliancePattern/);
  assert.match(detail, /Паттерн[^\n]*не вывод/i);
});

test("публичный UI не содержит внутренних путей и DOC-download действия", () => {
  const publicUi = [
    source(pagePath),
    source(methodologyComponentPath),
    source(assessmentComponentPath),
  ].join("\n");

  assert.doesNotMatch(publicUi, /internalFileName|rightsNote/);
  assert.doesNotMatch(publicUi, /docs[\\/]|[A-Z]:\\/i);
  assert.doesNotMatch(publicUi, /download\s*=|Скачать\s+DOC/i);
});
