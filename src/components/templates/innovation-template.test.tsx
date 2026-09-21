import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { InnovationDetail } from "@/lib/loaders";
import { getInnovationContent } from "@/lib/innovation-content";
import { InnovationTemplate } from "./innovation-template";

test("rich innovation template renders an evidence-first medical device page", () => {
  const editorial = getInnovationContent("clareon-panoptix-pro");
  assert.ok(editorial);

  const data = {
    slug: editorial.slug,
    title: editorial.title,
    summary: editorial.summary,
    content: null,
    sourceUrl: editorial.sources[0].url,
    publishedAt: new Date("2026-08-21T00:00:00.000Z"),
    createdAt: new Date("2026-08-21T00:00:00.000Z"),
    updatedAt: new Date("2026-08-21T00:00:00.000Z"),
  } as InnovationDetail;

  const html = renderToStaticMarkup(React.createElement(InnovationTemplate, { data }));

  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  for (const heading of [
    "Что такое Clareon PanOptix Pro",
    "ENLIGHTEN NXT: оптическая технология PanOptix Pro",
    "Кому может рассматриваться такая ИОЛ",
    "Особенности PanOptix Pro",
    "Что важно учитывать",
    "Частые вопросы",
    "Источники",
  ]) {
    assert.match(html, new RegExp(heading));
  }
  assert.match(html, /MedicalWebPage/);
  assert.match(html, /MedicalDevice/);
  assert.match(html, /BreadcrumbList/);
  assert.match(html, /FAQPage/);
  assert.match(html, /clareon-panoptix-pro\.webp/);
  assert.match(html, /clareon-panoptix-pro-distances\.webp/);
  assert.match(html, /clareon-panoptix-pro-enlighten-nxt\.webp/);
  assert.match(html, /P190018/);
  assert.match(html, /94%/);
  assert.match(html, /88%/);
  assert.doesNotMatch(html, /Регламент|стоимость|цена|\/clinics\//i);
});
