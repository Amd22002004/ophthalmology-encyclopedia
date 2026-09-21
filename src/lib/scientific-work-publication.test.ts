import assert from "node:assert/strict";
import test from "node:test";
import {
  getScientificWorkPublicationViolations,
  isScientificWorkPubliclyVisibleAt,
  publicScientificWorkWhere,
  type ScientificWorkPublicationInput,
} from "./scientific-work-publication";

const NOW = new Date("2026-08-12T10:00:00.000Z");

test("Prisma-фильтр повторяет evidence, date, rights и bibliographic-only gate", () => {
  assert.deepEqual(publicScientificWorkWhere(NOW), {
    slug: { not: "" },
    isPublished: true,
    publishedAt: { lte: NOW },
    evidenceValidatedAt: { not: null },
    publicationBlockReason: null,
    AND: [
      {
        OR: [
          {
            rightsVerifiedAt: { not: null },
            rightsBasis: { not: "UNVERIFIED" },
          },
          { pdfUrl: null, abstractUrl: null, images: { isEmpty: true } },
        ],
      },
      {
        OR: [{ sourcePageUrl: null }, { sourcePageUrl: { startsWith: "https://" } }],
      },
      {
        OR: [{ sourcePdfUrl: null }, { sourcePdfUrl: { startsWith: "https://" } }],
      },
      {
        OR: [
          { sourceStatus: { not: "BIBLIOGRAPHIC_ONLY" } },
          {
            sourceStatus: "BIBLIOGRAPHIC_ONLY",
            pdfUrl: null,
            abstractUrl: null,
            images: { isEmpty: true },
            sourcePdfUrl: null,
            novelty: { isEmpty: true },
            practicalValue: { isEmpty: true },
            results: { isEmpty: true },
            conclusions: { isEmpty: true },
          },
        ],
      },
    ],
  });
});

function fullTextWork(
  overrides: Partial<ScientificWorkPublicationInput> = {},
): ScientificWorkPublicationInput {
  return {
    slug: "verified-scientific-work",
    sourceStatus: "FULL_TEXT",
    isPublished: true,
    publishedAt: new Date("2026-08-12T10:00:00.000Z"),
    evidenceValidatedAt: new Date("2026-08-11T10:00:00.000Z"),
    publicationBlockReason: null,
    rightsVerifiedAt: new Date("2026-08-11T10:00:00.000Z"),
    rightsBasis: "OPEN_LICENSE",
    rightsNote: "Лицензия и основание размещения зафиксированы редактором.",
    pdfUrl: "/scientific-works/verified-scientific-work.pdf",
    abstractUrl: null,
    sourcePageUrl: "https://journal.example/verified-scientific-work",
    sourcePdfUrl: "https://journal.example/verified-scientific-work.pdf",
    sourceNote: "Полный текст проверен по первоисточнику.",
    images: [],
    novelty: ["Актуальность подтверждена полным текстом статьи."],
    practicalValue: ["Методика описана в полном тексте статьи."],
    results: ["Результат приведён в полном тексте статьи."],
    conclusions: ["Вывод авторов приведён отдельно."],
    ...overrides,
  };
}

test("полностью проверенная работа становится публичной точно в publishedAt", () => {
  assert.equal(isScientificWorkPubliclyVisibleAt(fullTextWork(), NOW), true);
});

test("стабильный slug не делает черновик публичным", () => {
  assert.equal(
    isScientificWorkPubliclyVisibleAt(
      fullTextWork({
        slug: "stable-draft-slug",
        isPublished: false,
      }),
      NOW,
    ),
    false,
  );
});

test("явный редакционный блокер нельзя обойти публикационными флагами", () => {
  const work = fullTextWork({
    publicationBlockReason: "Требуется сверка личности автора.",
  });

  assert.deepEqual(getScientificWorkPublicationViolations(work), [
    "PUBLICATION_HAS_EDITORIAL_BLOCKER",
  ]);
  assert.equal(isScientificWorkPubliclyVisibleAt(work, NOW), false);
});

test("публичный шлюз отклоняет запись без стабильного slug", () => {
  assert.equal(isScientificWorkPubliclyVisibleAt(fullTextWork({ slug: null }), NOW), false);
  assert.equal(isScientificWorkPubliclyVisibleAt(fullTextWork({ slug: "   " }), NOW), false);
});

test("публичный шлюз отклоняет запись без даты, с будущей датой или без evidence-validation", () => {
  assert.equal(isScientificWorkPubliclyVisibleAt(fullTextWork({ publishedAt: null }), NOW), false);
  assert.equal(
    isScientificWorkPubliclyVisibleAt(
      fullTextWork({ publishedAt: new Date("2026-08-12T10:00:00.001Z") }),
      NOW,
    ),
    false,
  );
  assert.equal(
    isScientificWorkPubliclyVisibleAt(fullTextWork({ evidenceValidatedAt: null }), NOW),
    false,
  );
});

test("локальные PDF, автореферат или изображения требуют подтверждённых прав", () => {
  for (const assets of [
    { pdfUrl: "/files/article.pdf", abstractUrl: null, images: [] },
    { pdfUrl: null, abstractUrl: "/files/abstract.pdf", images: [] },
    { pdfUrl: null, abstractUrl: null, images: ["/files/page-1.png"] },
  ]) {
    const work = fullTextWork({
      ...assets,
      rightsVerifiedAt: null,
    });

    assert.deepEqual(getScientificWorkPublicationViolations(work), [
      "LOCAL_ASSETS_REQUIRE_RIGHTS",
    ]);
    assert.equal(isScientificWorkPubliclyVisibleAt(work, NOW), false);
  }
});

test("timestamp проверки прав без структурированного основания недостаточен", () => {
  const work = fullTextWork({ rightsBasis: "UNVERIFIED" });

  assert.deepEqual(getScientificWorkPublicationViolations(work), [
    "LOCAL_ASSETS_REQUIRE_RIGHTS_BASIS",
  ]);
  assert.equal(isScientificWorkPubliclyVisibleAt(work, NOW), false);
});

test("внешний источник хранится отдельно, а поле локальной копии требует прав", () => {
  const work = fullTextWork({
    pdfUrl: "https://journal.example/article.pdf",
    rightsVerifiedAt: null,
  });

  assert.deepEqual(getScientificWorkPublicationViolations(work), [
    "LOCAL_ASSETS_REQUIRE_RIGHTS",
  ]);
  assert.equal(isScientificWorkPubliclyVisibleAt(work, NOW), false);
});

test("sourcePdfUrl допускает только внешний HTTPS-первоисточник", () => {
  for (const sourcePdfUrl of ["/files/article.pdf", "http://journal.example/article.pdf"]) {
    const work = fullTextWork({ sourcePdfUrl });
    assert.deepEqual(getScientificWorkPublicationViolations(work), [
      "SOURCE_PDF_MUST_BE_EXTERNAL_HTTPS",
    ]);
    assert.equal(isScientificWorkPubliclyVisibleAt(work, NOW), false);
  }
});

test("sourcePageUrl допускает только внешнюю HTTPS-страницу первоисточника", () => {
  for (const sourcePageUrl of ["/publications/article", "http://journal.example/article"]) {
    const work = fullTextWork({ sourcePageUrl });
    assert.deepEqual(getScientificWorkPublicationViolations(work), [
      "SOURCE_PAGE_MUST_BE_EXTERNAL_HTTPS",
    ]);
    assert.equal(isScientificWorkPubliclyVisibleAt(work, NOW), false);
  }
});

test("библиографическая карточка запрещает файлы и неподтверждённые разделы исследования", () => {
  const work = fullTextWork({
    sourceStatus: "BIBLIOGRAPHIC_ONLY",
    pdfUrl: "/files/article.pdf",
    abstractUrl: "/files/abstract.pdf",
    sourcePdfUrl: "https://journal.example/article.pdf",
    images: ["/files/page-1.png"],
    novelty: ["Актуальность"],
    practicalValue: ["Методика"],
    results: ["Результаты"],
    conclusions: ["Вывод"],
  });

  assert.deepEqual(getScientificWorkPublicationViolations(work), [
    "BIBLIOGRAPHIC_ONLY_HAS_PDF",
    "BIBLIOGRAPHIC_ONLY_HAS_ABSTRACT",
    "BIBLIOGRAPHIC_ONLY_HAS_SOURCE_PDF",
    "BIBLIOGRAPHIC_ONLY_HAS_IMAGES",
    "BIBLIOGRAPHIC_ONLY_HAS_NOVELTY",
    "BIBLIOGRAPHIC_ONLY_HAS_PRACTICAL_VALUE",
    "BIBLIOGRAPHIC_ONLY_HAS_RESULTS",
    "BIBLIOGRAPHIC_ONLY_HAS_CONCLUSIONS",
  ]);
  assert.equal(isScientificWorkPubliclyVisibleAt(work, NOW), false);
});

test("чистая библиографическая карточка может пройти шлюз без локальных файлов", () => {
  const work = fullTextWork({
    sourceStatus: "BIBLIOGRAPHIC_ONLY",
    rightsVerifiedAt: null,
    pdfUrl: null,
    abstractUrl: null,
    sourcePdfUrl: null,
    images: [],
    novelty: [],
    practicalValue: [],
    results: [],
    conclusions: [],
  });

  assert.deepEqual(getScientificWorkPublicationViolations(work), []);
  assert.equal(isScientificWorkPubliclyVisibleAt(work, NOW), true);
});

test("статус библиографической карточки сам задаёт обязательное публичное пояснение", () => {
  const work = fullTextWork({
    sourceStatus: "BIBLIOGRAPHIC_ONLY",
    sourceNote: "   ",
    rightsVerifiedAt: null,
    pdfUrl: null,
    abstractUrl: null,
    sourcePdfUrl: null,
    images: [],
    novelty: [],
    practicalValue: [],
    results: [],
    conclusions: [],
  });

  assert.deepEqual(getScientificWorkPublicationViolations(work), []);
  assert.equal(isScientificWorkPubliclyVisibleAt(work, NOW), true);
});
