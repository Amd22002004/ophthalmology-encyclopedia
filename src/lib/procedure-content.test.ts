import assert from "node:assert/strict";
import test from "node:test";
import { getProcedureContent, procedureContentSlugs } from "./procedure-content";

const requiredSections = [
  "definition",
  "principle",
  "steps",
  "applications",
  "features",
  "limitations",
  "preparation",
  "recovery",
  "risks",
  "faq",
] as const;

const expectedProcedureSlugs = [
  "anti-vegf-terapiya",
  "blefaroplastika",
  "diagnosticheskiy-priem",
  "fakoemulsifikatsiya-katarakty",
  "femto-lasik",
  "implantatsiya-iol",
  "implantatsiya-rogovichnykh-segmentov",
  "khirurgiya-kosoglaziya",
  "krosslinking",
  "lasik",
  "lazernaya-koagulyatsiya-setchatki",
  "lazernaya-korrektsiya-zreniya",
  "navilas",
  "piling-epiretinalnykh-membran",
  "slt",
  "smile",
  "smile-pro",
  "vitrektomiya",
  "vitreolizis",
  "yag-lazernaya-gialoidopunktura",
  "zamena-khrustalika",
  "zondirovanie-sleznykh-kanalov",
];

test("procedure registry contains all existing procedure routes as rich pages", () => {
  assert.deepEqual([...procedureContentSlugs].sort(), [...expectedProcedureSlugs].sort());
});

test("each procedure has provenance, illustration, and compact medical content", () => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();

  for (const slug of procedureContentSlugs) {
    const content = getProcedureContent(slug);
    assert.ok(content);
    assert.equal(content.slug, slug);
    assert.ok(content.summary.length >= 80 && content.summary.length <= 260);
    assert.ok(content.seo.title.includes(content.title));
    assert.ok(content.seo.description.length >= 100);
    assert.ok(/\.(webp|svg)$/.test(content.image.src));
    assert.ok(content.image.alt.length > 20);
    assert.ok(content.steps.length >= 5);
    assert.ok(content.faq.length >= 6);
    assert.ok(content.sources.length >= 3);
    titles.add(content.seo.title);
    descriptions.add(content.seo.description);

    for (const section of requiredSections) {
      assert.ok(content[section].length > 0, `${slug} lacks ${section}`);
      assert.ok(
        content.sources.some((source) => source.sections.includes(section)),
        `${slug} lacks provenance for ${section}`,
      );
    }

    for (const source of content.sources) {
      assert.match(source.url, /^https:\/\//);
      assert.match(source.accessedAt, /^2026-08-24$/);
      assert.ok(source.sections.length > 0);
    }

    const allText = JSON.stringify(content).toLocaleLowerCase();
    assert.doesNotMatch(allText, /100%|самый\s+лучший|лучший\s+метод|безопасн(?:ый|ая|о)\s+для\s+всех/);
  }

  assert.equal(titles.size, expectedProcedureSlugs.length);
  assert.equal(descriptions.size, expectedProcedureSlugs.length);
});

test("unknown procedure does not receive editorial content", () => {
  assert.equal(getProcedureContent("unknown-procedure"), null);
});
