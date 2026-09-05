import assert from "node:assert/strict";
import { test } from "node:test";
import { getDiseaseContent, getRichDiseaseSlugs } from "./disease-content";

test("all existing diseases keep their approved canonical routes", () => {
  assert.deepEqual([...getRichDiseaseSlugs()].sort(), [
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
  ].sort());

  for (const slug of getRichDiseaseSlugs()) {
    const disease = getDiseaseContent(slug);
    assert.ok(disease);
    assert.equal(disease.slug, slug);
    assert.match(disease.image.src, new RegExp(`/images/diseases/${slug}\\.(webp|svg)$`));
    assert.ok(disease.sources.length > 0);
    assert.ok(disease.faq.length > 0);
    assert.ok(!disease.relatedDiseaseSlugs.includes(slug));
  }
});
