import assert from "node:assert/strict";
import test from "node:test";
import {
  evidenceValidatedContentWhere,
  isPubliclyVisibleAt,
  publishedContentWhere,
} from "./publication-gate";

const NOW = new Date("2026-08-12T10:00:00.000Z");

test("публичный фильтр требует флаг публикации и наступившую дату", () => {
  assert.deepEqual(publishedContentWhere(NOW), {
    isPublished: true,
    publishedAt: { lte: NOW },
  });
});

test("доказательный публичный фильтр дополнительно требует evidence-validation", () => {
  assert.deepEqual(evidenceValidatedContentWhere(NOW), {
    isPublished: true,
    publishedAt: { lte: NOW },
    evidenceValidatedAt: { not: null },
  });
});

test("публикация становится видимой точно в publishedAt", () => {
  assert.equal(
    isPubliclyVisibleAt(
      { isPublished: true, publishedAt: new Date("2026-08-12T10:00:00.000Z") },
      NOW,
    ),
    true,
  );
});

test("черновик, запись без даты и будущая публикация не видимы", () => {
  assert.equal(
    isPubliclyVisibleAt(
      { isPublished: false, publishedAt: new Date("2026-08-11T10:00:00.000Z") },
      NOW,
    ),
    false,
  );
  assert.equal(isPubliclyVisibleAt({ isPublished: true, publishedAt: null }, NOW), false);
  assert.equal(
    isPubliclyVisibleAt(
      { isPublished: true, publishedAt: new Date("2026-08-12T10:00:00.001Z") },
      NOW,
    ),
    false,
  );
});
