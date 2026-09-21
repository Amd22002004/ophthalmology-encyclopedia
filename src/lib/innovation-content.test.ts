import assert from "node:assert/strict";
import test from "node:test";
import { getInnovationContent, innovationContentSlugs } from "./innovation-content";

const requiredSections = [
  "definition",
  "technology",
  "candidateSelection",
  "features",
  "limitations",
  "faq",
] as const;

test("innovation registry contains the approved PanOptix Pro route", () => {
  assert.deepEqual(innovationContentSlugs, ["clareon-panoptix-pro"]);
});

test("PanOptix Pro content has provenance, visual assets, and evidence boundaries", () => {
  const content = getInnovationContent("clareon-panoptix-pro");
  assert.ok(content);
  assert.equal(content.slug, "clareon-panoptix-pro");
  assert.equal(content.title, "Clareon PanOptix Pro");
  assert.equal(content.eyebrow, "ИНТРАОКУЛЯРНЫЕ ЛИНЗЫ");
  assert.equal(content.subtitle, "Трифокальная интраокулярная линза нового поколения");
  assert.ok(content.summary.length >= 100);
  assert.ok(content.seo.title.includes("Clareon PanOptix Pro"));
  assert.equal(content.images.length, 3);
  assert.ok(content.comparison.length >= 2);
  assert.ok(content.faq.length >= 6);
  assert.ok(content.sources.length >= 2);

  for (const section of requiredSections) {
    assert.ok(content[section].length > 0, `missing ${section}`);
    assert.ok(
      content.sources.some((source) => source.sections.includes(section)),
      `missing provenance for ${section}`,
    );
  }

  for (const image of content.images) {
    assert.match(image.src, /^\/images\/innovations\/.+\.webp$/);
    assert.ok(image.alt.length > 20);
    assert.ok(image.width >= 1000);
    assert.ok(image.height >= 600);
  }

  for (const source of content.sources) {
    assert.match(source.url, /^https:\/\//);
    assert.equal(source.accessedAt, "2026-08-21");
    assert.ok(source.sections.length > 0);
  }

  const allText = JSON.stringify(content).toLocaleLowerCase();
  assert.match(allText, /bench|симулятор|лаборатор/);
  assert.match(allText, /не является.*гарант|не.*индивидуальн/);
  assert.doesNotMatch(allText, /гарантирует идеальное зрение|лучшая линза|подходит всем/);
  assert.doesNotMatch(allText, /цена|стоимость|руб\./);
});

test("unknown innovation does not receive editorial content", () => {
  assert.equal(getInnovationContent("unknown-innovation"), null);
});
