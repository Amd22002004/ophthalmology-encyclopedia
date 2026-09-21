import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { OSTROVERHOV_SCIENTIFIC_WORKS } from "../../prisma/data/scientific-works/ostroverhov";
import {
  getScientificWorkPublicationViolations,
  isScientificWorkPubliclyVisibleAt,
} from "./scientific-work-publication";

test("пакет содержит девять уникальных evidence-validated научных работ", () => {
  assert.equal(OSTROVERHOV_SCIENTIFIC_WORKS.length, 9);
  assert.equal(
    new Set(OSTROVERHOV_SCIENTIFIC_WORKS.map((work) => work.slug)).size,
    9,
  );
  assert.equal(
    new Set(OSTROVERHOV_SCIENTIFIC_WORKS.map((work) => work.title)).size,
    9,
  );

  for (const work of OSTROVERHOV_SCIENTIFIC_WORKS) {
    assert.equal(work.doctorSlug, "ostroverhov-aleksandr-ivanovich");
    assert.ok(work.doctorAuthorIndex >= 0);
    assert.ok(work.doctorAuthorIndex < work.authors.length);
    assert.match(work.authors[work.doctorAuthorIndex], /Островерхов/);
    assert.equal(work.isPublished, true);
    assert.ok(work.evidenceValidatedAt);
    assert.ok(work.publishedAt);
    assert.equal(work.publicationBlockReason, null);
    assert.deepEqual(work.images, []);
    assert.deepEqual(work.equipmentSlugs, []);
    assert.deepEqual(work.procedureSlugs, ["krosslinking"]);
    assert.ok(work.rightsNote);
    assert.deepEqual(getScientificWorkPublicationViolations(work), []);
    assert.equal(isScientificWorkPubliclyVisibleAt(work), true);
  }
});

test("для всех материалов зафиксировано разрешение на распространение", () => {
  const openLicense = OSTROVERHOV_SCIENTIFIC_WORKS.find(
    (work) => work.slug === "glubokaya-posloynaya-peresadka-deti",
  );
  assert.ok(openLicense);
  assert.equal(openLicense.rightsBasis, "OPEN_LICENSE");
  assert.match(openLicense.rightsNote ?? "", /CC BY 4\.0/);

  for (const work of OSTROVERHOV_SCIENTIFIC_WORKS) {
    assert.ok(work.rightsVerifiedAt);
    if (work === openLicense) continue;
    assert.equal(work.rightsBasis, "USER_CONFIRMED_PERMISSION");
    assert.match(work.rightsNote ?? "", /подтверждено пользователем/i);
  }
});

test("семь журнальных PDF доступны локально и совпадают с рабочим пакетом", () => {
  const worksWithSourcePdf = OSTROVERHOV_SCIENTIFIC_WORKS.filter(
    (work) => work.sourcePdfUrl !== null,
  );

  assert.equal(worksWithSourcePdf.length, 7);

  for (const work of worksWithSourcePdf) {
    assert.notEqual(work.sourceStatus, "BIBLIOGRAPHIC_ONLY");
    assert.match(work.sourcePdfUrl ?? "", /^https:\/\//);
    assert.equal(
      work.pdfUrl,
      `/publications/ostroverhov/${work.slug}.pdf`,
    );
    assert.deepEqual(
      readFileSync(join(process.cwd(), "public", work.pdfUrl!)),
      readFileSync(
        join(process.cwd(), "ostroverhov-research", "pdf", `${work.slug}.pdf`),
      ),
    );
  }
});

test("статья 2018 года остаётся библиографической карточкой без реконструированных разделов", () => {
  const bibliographicOnly = OSTROVERHOV_SCIENTIFIC_WORKS.filter(
    (work) => work.sourceStatus === "BIBLIOGRAPHIC_ONLY",
  );

  assert.deepEqual(bibliographicOnly.map((work) => work.slug), [
    "srednesrochnye-rezultaty-ekspress-krosslinkinga",
  ]);

  for (const work of bibliographicOnly) {
    assert.equal(work.sourcePdfUrl, null);
    assert.equal(work.pdfUrl, null);
    assert.equal(work.abstractUrl, null);
    assert.deepEqual(work.images, []);
    assert.deepEqual(work.novelty, []);
    assert.deepEqual(work.practicalValue, []);
    assert.deepEqual(work.results, []);
    assert.deepEqual(work.conclusions, []);
    assert.match(work.sourceNote, /библиографическим данным/i);
  }
});

test("диссертация и автореферат опубликованы из сверенных legacy-первоисточников", () => {
  const dissertation = OSTROVERHOV_SCIENTIFIC_WORKS.find(
    (work) => work.slug === "ekspress-krosslinking-pri-keratektaziyah",
  );

  assert.ok(dissertation);
  assert.equal(dissertation.type, "Кандидатская диссертация");
  assert.equal(dissertation.sourceStatus, "FULL_TEXT");
  assert.equal(dissertation.sourcePdfUrl, null);
  assert.equal(
    dissertation.pdfUrl,
    "/doctors/ostroverhov-aleksandr-ivanovich/dissertaciya.pdf",
  );
  assert.equal(
    dissertation.abstractUrl,
    "/doctors/ostroverhov-aleksandr-ivanovich/avtoreferat.pdf",
  );
  assert.ok(readFileSync(join(process.cwd(), "public", dissertation.pdfUrl)).length > 0);
  assert.ok(readFileSync(join(process.cwd(), "public", dissertation.abstractUrl)).length > 0);
  assert.deepEqual(dissertation.diseaseSlugs, ["keratokonus"]);
  assert.ok(dissertation.novelty.length > 0);
  assert.ok(dissertation.practicalValue.length > 0);
  assert.ok(dissertation.results.length > 0);
  assert.ok(dissertation.conclusions.length > 0);
  assert.match(dissertation.sourceNote, /legacy-файлов/i);
  assert.match(dissertation.sourceNote, /опубликованы/i);
});

test("журнальные и диссертационная метаданные не смешиваются", () => {
  const articles = OSTROVERHOV_SCIENTIFIC_WORKS.filter(
    (work) => work.type === "Научная статья",
  );
  const dissertations = OSTROVERHOV_SCIENTIFIC_WORKS.filter(
    (work) => work.type === "Кандидатская диссертация",
  );

  assert.equal(articles.length, 8);
  assert.equal(dissertations.length, 1);

  for (const article of articles) {
    assert.notEqual(article.contentKind, "THESIS");
    assert.ok(article.journal);
    assert.equal(
      Object.prototype.hasOwnProperty.call(article, "organization"),
      false,
    );
  }

  const dissertation = dissertations[0];
  assert.equal(dissertation.contentKind, "THESIS");
  assert.equal(dissertation.journal, null);
  assert.equal(
    Object.prototype.hasOwnProperty.call(dissertation, "organization"),
    true,
  );
});

test("редакционное подтверждение закрепляет отчество Иванович без блокера", () => {
  for (const work of OSTROVERHOV_SCIENTIFIC_WORKS) {
    assert.equal(work.doctorSlug, "ostroverhov-aleksandr-ivanovich");
    assert.equal(work.publicationBlockReason, null);
    assert.equal(work.isPublished, true);
  }
});

test("каждая карточка содержит полную библиографию, первоисточник и SEO-проекцию", () => {
  for (const work of OSTROVERHOV_SCIENTIFIC_WORKS) {
    assert.ok(work.authors.length > 0, work.slug);
    assert.ok(work.bibliography.trim().length > 0, work.slug);
    assert.match(work.sourcePageUrl, /^https:\/\//, work.slug);
    assert.equal(work.seoTitle, `${work.title} — Островерхов А. И. | Научные публикации`);
    assert.ok(work.seoDescription.trim().length >= 80, work.slug);
    assert.equal(work.year >= 2015 && work.year <= 2023, true, work.slug);
  }
});

test("DOI привязаны только к двум подтверждённым статьям 2023 года", () => {
  const worksWithDoi = OSTROVERHOV_SCIENTIFIC_WORKS.filter((work) => work.doi !== null);
  assert.deepEqual(
    worksWithDoi.map((work) => work.doi).sort(),
    [
      "10.36979/1694-500X-2023-23-1-110-114",
      "10.36979/1694-500X-2023-23-1-88-91",
    ],
  );
});
