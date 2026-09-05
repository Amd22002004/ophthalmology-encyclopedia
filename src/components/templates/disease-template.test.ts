import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getDiseaseContent } from "@/lib/disease-content";
import type { DiseaseDetail } from "@/lib/loaders";
import { DiseaseTemplate } from "./disease-template";

test("rich disease template renders the MVP medical reference contract", () => {
  const editorial = getDiseaseContent("ambliopiya");
  assert.ok(editorial);

  const data = {
    slug: editorial.slug,
    title: editorial.title,
    summary: editorial.summary,
    description: null,
    icdCode: null,
    symptoms: [],
    diagnostics: null,
    treatment: null,
    category: { slug: "refraction", title: "Нарушения рефракции" },
    procedures: [],
    doctors: [],
    clinics: [],
    guidelines: [],
    publications: [],
    equipment: [],
    scientificWorks: [],
    investigations: [],
    relatedDiseases: [],
    editorial,
  } as unknown as DiseaseDetail;

  const html = renderToStaticMarkup(React.createElement(DiseaseTemplate, { data }));

  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  for (const heading of [
    "Определение",
    "Причины",
    "Симптомы",
    "Диагностика",
    "Лечение",
    "Наблюдение и прогноз",
    "Когда обращаться к врачу",
    "Частые вопросы",
    "Источники медицинской информации",
  ]) {
    assert.match(html, new RegExp(heading));
  }
  assert.match(html, /<details/g);
  assert.match(html, /MedicalCondition/);
  assert.match(html, /MedicalWebPage/);
  assert.match(html, /FAQPage/);
  assert.match(html, /#condition/);
  assert.match(html, /ambliopiya\.webp/);
  assert.doesNotMatch(html, /Regulation|Регламент/);
});
