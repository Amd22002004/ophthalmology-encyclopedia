import assert from "node:assert/strict";
import test from "node:test";
import {
  publicInvestigationEquipmentInstanceWhere,
  publicInvestigationRelationWhere,
  publicRegulatoryCheckWhere,
  publicRegulationWhere,
  publicRegulationSourceWhere,
} from "./public-filters";

const NOW = new Date("2026-08-12T10:00:00.000Z");

test("публичный нормативный источник должен быть официальным и опубликованным", () => {
  assert.deepEqual(publicRegulationSourceWhere(NOW), {
    isOfficial: true,
    isPublished: true,
    publishedAt: { lte: NOW },
  });
});

test("публичный нормативный акт обязательно имеет достигший даты официальный источник", () => {
  assert.deepEqual(publicRegulationWhere(NOW), {
    isPublished: true,
    publishedAt: { lte: NOW },
    sources: {
      some: {
        isOfficial: true,
        isPublished: true,
        publishedAt: { lte: NOW },
      },
    },
  });
});

test("публичный check question содержит все рабочие поля доказательной матрицы", () => {
  assert.deepEqual(publicRegulatoryCheckWhere(NOW), {
    isPublished: true,
    publishedAt: { lte: NOW },
    question: { not: "" },
    factToEstablish: { not: "" },
    primaryEvidenceType: { not: "" },
    evidenceThreshold: { not: "" },
  });
});

test("экземпляр публичен только с опубликованной проверенной идентификацией", () => {
  assert.deepEqual(publicInvestigationEquipmentInstanceWhere(NOW), {
    isPublished: true,
    publishedAt: { lte: NOW },
    identificationEvidence: {
      some: {
        isPublished: true,
        publishedAt: { lte: NOW },
        evidenceValidatedAt: { not: null },
        document: {
          isEvidence: true,
          isPublished: true,
          publishedAt: { lte: NOW },
          evidenceValidatedAt: { not: null },
        },
      },
    },
  });
});

test("связь расследования с сущностью проходит собственный evidence gate", () => {
  assert.deepEqual(publicInvestigationRelationWhere(NOW), {
    isPublished: true,
    publishedAt: { lte: NOW },
    evidenceValidatedAt: { not: null },
  });
});
