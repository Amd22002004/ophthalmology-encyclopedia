import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { OCTOBER_2026_CONGRESSES_NEWS } from "../../prisma/data/news/kongressy-oktyabr-2026";
import { newsFigureSources, parseNewsContent, parseNewsInlines, safeNewsHref } from "./news-content";

const ALLOWED_HREFS = new Set([
  "https://don-conf.ru/",
  "https://don-conf.ru/program_2026",
  "/events/sovremennye-tehnologii-v-oftalmologii-2026",
  "https://eastwestufa.ru/conference/diskussionnye-voprosy-klinicheskoy-oftalmologii/",
  "https://cataract-congress.ru/",
  "https://www.mntk.ru/news/spec_news/view/1932/",
  "https://mntk.ru/news/patients_news/view/1977/",
]);

test("news notation keeps headings, paragraphs and lists", () => {
  const sections = parseNewsContent(`Вводный абзац.

## Раздел

- Первый пункт
- Второй пункт`);

  assert.equal(sections[0]?.blocks[0]?.type, "paragraph");
  assert.equal(sections[1]?.title, "Раздел");
  assert.deepEqual(sections[1]?.blocks[0], {
    type: "list",
    items: [
      [{ type: "text", text: "Первый пункт" }],
      [{ type: "text", text: "Второй пункт" }],
    ],
  });
});

test("news figures keep a local image and a source caption", () => {
  const sections = parseNewsContent(`![Анонс](/images/news/example.webp){800x400}
Подпись. Источник: [example.com](https://example.com/page).`);
  const figure = sections[0]?.blocks[0];

  assert.equal(figure?.type, "figure");
  if (figure?.type !== "figure") return;
  assert.equal(figure.src, "/images/news/example.webp");
  assert.equal(figure.width, 800);
  assert.equal(figure.height, 400);
  assert.deepEqual(figure.caption[1], {
    type: "link",
    href: "https://example.com/page",
    text: "example.com",
  });
});

test("news notation does not publish an unsafe image or link", () => {
  const sections = parseNewsContent(`![Чужой файл](https://example.com/a.webp){10x10}
Текст.

Абзац со [скриптом](javascript:alert(1)).`);

  assert.equal(sections[0]?.blocks[0]?.type, "paragraph");
  assert.equal(safeNewsHref("javascript:alert(1)"), null);
  const inlines = parseNewsInlines("Текст [ссылка](javascript:alert(1)).");
  assert.equal(inlines.some((inline) => inline.type === "link"), false);
});

test("October 2026 congress news cites only checked organizer pages", () => {
  const news = OCTOBER_2026_CONGRESSES_NEWS;
  assert.equal(news.slug, "kongressy-oktyabr-2026");
  assert.ok(news.seoDescription.length <= 180);

  const sections = parseNewsContent(news.content);
  assert.deepEqual(
    sections.map((section) => section.title),
    [
      "Какие даты подтверждены",
      "2 октября, Ростов-на-Дону",
      "15 октября, Тюмень",
      "23 октября, Уфа",
      "Конгресс, перенесённый с октября",
      "Граница обзора",
    ],
  );

  const figures = newsFigureSources(news.content);
  assert.equal(figures.length, 2);
  for (const figure of figures) {
    assert.ok(figure.caption.some((part) => part.type === "link"));
    assert.equal(existsSync(resolve(process.cwd(), "public", figure.src.slice(1))), true);
  }

  const hrefs = sections.flatMap((section) =>
    section.blocks.flatMap((block) => {
      if (block.type === "paragraph") return block.inlines;
      if (block.type === "figure") return block.caption;
      return block.items.flat();
    }),
  ).flatMap((inline) => (inline.type === "link" ? [inline.href] : []));

  assert.deepEqual(new Set(hrefs), ALLOWED_HREFS);
  for (const phrase of ["Макаровские чтения", "Ставрополь", "EURETINA", "Стукалов", "совет НМО", "РЖД-Медицина"]) {
    assert.equal(news.content.includes(phrase), false, phrase);
  }
});
