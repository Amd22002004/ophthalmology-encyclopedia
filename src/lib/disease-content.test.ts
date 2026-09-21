import assert from "node:assert/strict";
import test from "node:test";
import { getDiseaseContent, getRichDiseaseSlugs } from "./disease-content";

const requiredSections = [
  "definition",
  "causes",
  "riskFactors",
  "symptoms",
  "types",
  "diagnosis",
  "treatment",
  "prognosis",
  "prevention",
  "whenToSeeDoctor",
] as const;

const expectedDiseaseSlugs = [
    "ambliopiya",
    "astigmatizm",
    "dakriotsistit",
    "diabeticheskaya-retinopatiya",
    "diabeticheskiy-makulyarnyy-otek",
    "glaukoma",
    "katarakta",
    "keratit",
    "keratokonus",
    "kosoglazie",
    "makulyarnyy-razryv",
    "miopiya",
    "otsloika-setchatki",
    "ptoz",
    "retinopatiya-valsalvy",
    "uveit",
    "vozrastnaya-makulyarnaya-degeneratsiya",
];

test("registry contains all existing disease routes as rich pages", () => {
  assert.deepEqual([...getRichDiseaseSlugs()].sort(), [...expectedDiseaseSlugs].sort());
});

test("each disease has compact content, source provenance, and FAQ", () => {
  for (const slug of getRichDiseaseSlugs()) {
    const content = getDiseaseContent(slug);
    assert.ok(content);
    assert.equal(content.slug, slug);
    assert.ok(content.summary.length >= 80 && content.summary.length <= 260);
    assert.ok(content.seo.title.toLocaleLowerCase().includes(content.title.toLocaleLowerCase()));
    assert.ok(
      content.seo.description
        .toLocaleLowerCase()
        .includes(content.title.toLocaleLowerCase()),
    );
    assert.ok(/\.(webp|svg)$/.test(content.image.src));
    assert.ok(content.image.alt.length > 20);
    assert.ok(content.faq.length >= 7);
    assert.ok(content.sources.length > 0);

    for (const section of requiredSections) {
      assert.ok(content[section].length > 0, `${slug} lacks ${section}`);
      assert.ok(
        content.sources.some((source) => source.sections.includes(section)),
        `${slug} lacks provenance for ${section}`,
      );
    }

    const questions = new Set(content.faq.map((item) => item.question));
    assert.equal(questions.size, content.faq.length);
    for (const source of content.sources) {
      assert.match(source.url, /^https:\/\//);
      assert.match(source.accessedAt, /^2026-08-24$/);
      assert.ok(source.sections.length > 0);
    }
  }
});

test("unknown disease does not receive rich content", () => {
  assert.equal(getDiseaseContent("unknown-disease"), null);
});
