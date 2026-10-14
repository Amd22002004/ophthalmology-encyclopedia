import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import QuestionsPage, { metadata as questionsMetadata } from "@/app/(platform)/questions/page";
import { AssociationAboutPage } from "@/components/about/association-about-page";
import { illustrationNoteText } from "@/components/entity/illustration-note";
import { getDiseaseContent } from "@/lib/disease-content";
import type { DiseaseDetail, ProcedureDetail } from "@/lib/loaders";
import { getProcedureContent } from "@/lib/procedure-content";
import { DiseaseTemplate } from "./disease-template";
import { ProcedureTemplate } from "./procedure-template";

const root = join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "generated" ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const count = (html: string, text: string) => html.split(text).length - 1;

test("service captions under images are gone from the whole project", () => {
  for (const file of sourceFiles(root)) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /Иллюстративный визуал|Иллюстративное изображение/, file);
    assert.doesNotMatch(source, /Схематичная иллюстрация/, file);
  }
});

test("a disease page with an illustration has exactly one note and no caption", () => {
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
    category: null,
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
  assert.equal(count(html, illustrationNoteText), 1);
  assert.doesNotMatch(html, /<figcaption/);
  assert.match(html, new RegExp(`alt="${editorial.image.alt}"`));
});

test("a procedure page with an illustration has exactly one note and no caption", () => {
  const editorial = getProcedureContent("smile-pro");
  assert.ok(editorial);
  const data = {
    slug: editorial.slug,
    title: editorial.title,
    summary: editorial.summary,
    description: null,
    category: null,
    diseases: [],
    doctors: [],
    clinics: [],
    equipment: [],
    publications: [],
    scientificWorks: [],
    investigations: [],
  } as unknown as ProcedureDetail;
  const html = renderToStaticMarkup(React.createElement(ProcedureTemplate, { data }));
  assert.equal(count(html, illustrationNoteText), 1);
  assert.doesNotMatch(html, /<figcaption/);
});

test("/about: meaningful or empty alt, light final block, static hero circle", () => {
  const html = renderToStaticMarkup(React.createElement(AssociationAboutPage, { clinics: [] }));
  assert.match(html, /alt="Глаз в центре схемы, связанный со значками клиники, врача, микроскопа, документа и рукопожатия"/);
  assert.match(html, /alt=""[^>]*about-association-workspace|about-association-workspace[^>]*alt=""/);
  const finalBlock = html.slice(html.indexOf('id="final-cta"') - 120, html.indexOf('id="final-cta"'));
  assert.doesNotMatch(finalBlock, /bg-primary/);
  assert.doesNotMatch(html, /animate-pulse|animate-ping|animate-bounce/);
  for (const label of ["Развиваем офтальмологию вместе", "Вступить в Ассоциацию", "Предложить сотрудничество", "Связаться"]) {
    assert.ok(html.includes(label), label);
  }
});

test("pages from the cleanup list no longer use the word encyclopedia", () => {
  for (const file of [
    "app/(platform)/search/page.tsx",
    "app/(platform)/questions/page.tsx",
    "components/entity/doctor-card.tsx",
    "components/templates/doctor-template.tsx",
    "components/templates/procedure-template.tsx",
    "components/templates/scientific-work-template.tsx",
    "components/templates/clinic-resource-template.tsx",
    "lib/loaders.ts",
    "lib/equipment-editorial.ts",
    "lib/innovation-content.ts",
    "lib/disease-content.ts",
  ]) {
    assert.doesNotMatch(readFileSync(join(root, file), "utf8"), /нциклопед/i, file);
  }
  const questions = renderToStaticMarkup(React.createElement(QuestionsPage));
  assert.doesNotMatch(questions + JSON.stringify(questionsMetadata), /нциклопед/i);
});
