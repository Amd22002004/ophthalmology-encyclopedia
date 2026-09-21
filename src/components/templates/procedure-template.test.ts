import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getProcedureContent } from "@/lib/procedure-content";
import type { ProcedureDetail } from "@/lib/loaders";
import { ProcedureTemplate } from "./procedure-template";

test("rich procedure template renders the MVP medical reference contract", () => {
  const editorial = getProcedureContent("smile-pro");
  assert.ok(editorial);

  const data = {
    slug: editorial.slug,
    title: editorial.title,
    summary: editorial.summary,
    description: null,
    category: { slug: "laser-correction", title: "Лазерная коррекция зрения" },
    diseases: [{ disease: { slug: "astigmatizm", title: "Астигматизм" } }],
    doctors: [],
    clinics: [],
    equipment: [],
    publications: [],
    scientificWorks: [],
    investigations: [],
  } as unknown as ProcedureDetail;

  const html = renderToStaticMarkup(React.createElement(ProcedureTemplate, { data }));

  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  for (const heading of [
    "Что такое метод",
    "Принцип действия",
    "Этапы процедуры",
    "При каких нарушениях зрения применяется",
    "Ограничения и противопоказания",
    "Подготовка",
    "Восстановление",
    "Возможные риски и осложнения",
    "Сравнение методов лазерной коррекции зрения",
    "Частые вопросы",
    "Источники",
  ]) {
    assert.match(html, new RegExp(heading));
  }
  assert.match(html, /<details/g);
  assert.match(html, /MedicalProcedure/);
  assert.match(html, /MedicalWebPage/);
  assert.match(html, /FAQPage/);
  assert.match(html, /#procedure/);
  assert.match(html, /smile-pro\.webp/);
  assert.match(html, /\/diseases\/astigmatizm/);
  assert.doesNotMatch(html, /Regulation|Регламент/);
});
