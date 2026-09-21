import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { InvestigationDetail } from "@/lib/loaders";
import { InvestigationTemplate } from "./investigation-template";

const HIDDEN_DEPZDRAV_URL = "/investigations/glaztsentr-tyumen/appeal-to-depzdrav.docx";
const HIDDEN_ROSZDRAV_URL = "/investigations/glaztsentr-tyumen/appeal-to-roszdravnadzor.docx";
const NEUTRAL_MATERIALS_NOTE =
  "Для уточнения происхождения и правового статуса оборудования был направлен запрос. После получения ответа ООО „Алкон Фармацевтика“ Ассоциация направила материалы в Департамент здравоохранения Тюменской области и территориальный орган Росздравнадзора для рассмотрения в пределах их полномочий";

function buildInvestigationData() {
  return {
    slug: "proverka-oborudovaniya-glaztsentr-tyumen",
    title: "Проверка сведений об использовании ALLEGRETTO Wave Eye-Q в ООО „Глазцентр-Тюмень“",
    summary: "Краткое описание материала.",
    status: "Опубликовано; ожидаются результаты проверок компетентных органов",
    statusNote: "Нейтральная оговорка о границах опубликованных материалов.",
    publishedAt: new Date("2026-08-05T00:00:00.000Z"),
    updatedAt: new Date("2026-08-13T00:00:00.000Z"),
    sections: [
      {
        id: "official-documents-section",
        key: "official-documents",
        title: "Официальные документы",
        content: "Старая выгрузка обращений не должна отображаться.",
      },
      {
        id: "manufacturer-responses-section",
        key: "manufacturer-responses",
        title: "Ответы производителя",
        content: "Ответ производителя остаётся публичным.",
      },
    ],
    timeline: [],
    documents: [
      {
        id: "manufacturer-response",
        slug: "alcon-response-2026-04-07",
        kind: "manufacturer-response",
        title: "Ответ ООО «Алкон Фармацевтика» от 07.04.2026 № 22-04-2026/L",
        summary: "Публичный ответ производителя.",
        source: "ООО «Алкон Фармацевтика»",
        documentDate: new Date("2026-04-07T00:00:00.000Z"),
        fileUrl: "/investigations/glaztsentr-tyumen/alcon-response-2026-04-07.jpg",
        previewImageUrl: "/investigations/glaztsentr-tyumen/alcon-response-2026-04-07.jpg",
        mimeType: "image/jpeg",
        content: null,
        isEvidence: true,
      },
      {
        id: "hidden-depzdrav",
        slug: "appeal-to-depzdrav",
        kind: "association-appeal",
        title: "Обращение Ассоциации в Департамент здравоохранения Тюменской области",
        summary: "Скрываемое обращение.",
        source: "Ассоциация офтальмологических клиник",
        documentDate: null,
        fileUrl: HIDDEN_DEPZDRAV_URL,
        previewImageUrl: "/private/depzdrav-preview.jpg",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        content: "СЕКРЕТНАЯ ПОЛНАЯ ТЕКСТОВАЯ РАСШИФРОВКА ДЕПЗДРАВА",
        isEvidence: true,
      },
      {
        id: "hidden-roszdrav",
        slug: "appeal-to-roszdravnadzor",
        kind: "association-appeal",
        title: "Обращение Ассоциации в территориальный орган Росздравнадзора",
        summary: "Скрываемое обращение.",
        source: "Ассоциация офтальмологических клиник",
        documentDate: null,
        fileUrl: HIDDEN_ROSZDRAV_URL,
        previewImageUrl: "/private/roszdrav-preview.jpg",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        content: "СЕКРЕТНАЯ ПОЛНАЯ ТЕКСТОВАЯ РАСШИФРОВКА РОСЗДРАВНАДЗОРА",
        isEvidence: true,
      },
    ],
    clinics: [],
    equipment: [],
    diseases: [],
    procedures: [],
    news: [],
    equipmentInstances: [],
    regulatoryAssessments: [],
    registryChecks: [],
    independentControlAssessments: [],
    _count: { appeals: 0 },
  } as unknown as InvestigationDetail;
}

test("публичная страница заменяет обращения единым нейтральным блоком", () => {
  const html = renderToStaticMarkup(
    React.createElement(InvestigationTemplate, { data: buildInvestigationData() }),
  );

  assert.match(html, new RegExp(NEUTRAL_MATERIALS_NOTE));
  assert.equal(html.split(NEUTRAL_MATERIALS_NOTE).length - 1, 1);
  assert.doesNotMatch(html, /Старая выгрузка обращений/);
  assert.doesNotMatch(html, /appeal-to-depzdrav|appeal-to-roszdravnadzor/);
  assert.doesNotMatch(html, /СЕКРЕТНАЯ ПОЛНАЯ ТЕКСТОВАЯ РАСШИФРОВКА/);
  assert.doesNotMatch(html, /depzdrav-preview|roszdrav-preview/);
  assert.doesNotMatch(html, /\.docx|Текстовая расшифровка|Просмотреть|Скачать оригинал/);
  assert.match(html, /alcon-response-2026-04-07\.jpg/);
});
