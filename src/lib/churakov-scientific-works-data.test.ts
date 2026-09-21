import assert from "node:assert/strict";
import test from "node:test";
import { CHURAKOV_SCIENTIFIC_WORKS } from "../../prisma/data/scientific-works/churakov";
import {
  getScientificWorkPublicationViolations,
  isScientificWorkPubliclyVisibleAt,
} from "./scientific-work-publication";

test("пакет Чуракова содержит шесть проверенных библиографических работ", () => {
  assert.equal(CHURAKOV_SCIENTIFIC_WORKS.length, 6);
  assert.equal(
    new Set(CHURAKOV_SCIENTIFIC_WORKS.map((work) => work.slug)).size,
    6,
  );
  assert.equal(
    new Set(CHURAKOV_SCIENTIFIC_WORKS.map((work) => work.title)).size,
    6,
  );

  for (const work of CHURAKOV_SCIENTIFIC_WORKS) {
    assert.equal(work.doctorSlug, "churakov-timur-kasimovich");
    assert.equal(work.sourceStatus, "BIBLIOGRAPHIC_ONLY");
    assert.equal(work.isPublished, true);
    assert.ok(work.evidenceValidatedAt);
    assert.ok(work.publishedAt);
    assert.match(work.sourcePageUrl, /^https:\/\//);
    assert.equal(work.sourcePdfUrl, null);
    assert.equal(work.pdfUrl, null);
    assert.equal(work.abstractUrl, null);
    assert.deepEqual(work.images, []);
    assert.deepEqual(work.novelty, []);
    assert.deepEqual(work.practicalValue, []);
    assert.deepEqual(work.results, []);
    assert.deepEqual(work.conclusions, []);
    assert.deepEqual(getScientificWorkPublicationViolations(work), []);
    assert.equal(isScientificWorkPubliclyVisibleAt(work), true);
  }
});

test("научные темы Чуракова не превращаются в прямые клинические направления", () => {
  const dissertation = CHURAKOV_SCIENTIFIC_WORKS.find((work) => work.year === 2016 && work.contentKind === "THESIS");
  const pentacam = CHURAKOV_SCIENTIFIC_WORKS.find((work) => work.slug === "indeksy-pentacam-krosslinking-keratokonus-churakov");

  assert.deepEqual(dissertation?.diseaseSlugs, ["miopiya"]);
  assert.deepEqual(dissertation?.procedureSlugs, ["lasik"]);
  assert.deepEqual(pentacam?.diseaseSlugs, ["keratokonus"]);
  assert.deepEqual(pentacam?.procedureSlugs, ["krosslinking"]);
  assert.deepEqual(
    CHURAKOV_SCIENTIFIC_WORKS.flatMap((work) => work.equipmentSlugs),
    [],
  );
});
