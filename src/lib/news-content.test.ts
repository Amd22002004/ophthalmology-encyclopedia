import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { OCTOBER_2026_CONGRESSES_NEWS } from "../../prisma/data/news/kongressy-oktyabr-2026";
import { groupNewsBlocks, newsFigureSources, newsOpenGraphImage, parseNewsContent, parseNewsInlines, safeNewsHref } from "./news-content";

const VMEDA =
  "https://www.vmeda.org/segodnya-v-rossijskom-oftalmologicheskom-soobshhestve-sostoyalos-znachimoe-sobytie-otkrytie-konferenczii-oftalmotravmatologiya-priurochennoj-k-105-letiyu-so-dnya-rozhdeniya-v-v/";
const TOMSK =
  "https://mntk-nsk.ru/o-klinike/news/718-konferentsiya-v-tomske-v-chest-135-letiya-kafedry-oftalmologii";
const ROOF = "https://igb.ru/news/news-list/itogi-roof-2026/";
const KRYM = "https://roszdravnadzor.gov.ru/news/49737";

const ALLOWED_HREFS = new Set([
  "https://camopht.org/",
  VMEDA,
  TOMSK,
  ROOF,
  "https://www.avo-portal.ru/images/roof/programma_roof_2026_20260921.pdf",
  "https://edu.rosminzdrav.ru/news/novosti/news/retinopatija-i-makuljarnyi-otek-pri-sakharnom-diabete-u-v/",
  "https://www.consultant.ru/legalnews/32736/",
  "https://www.consultant.ru/document/cons_doc_LAW_519754/",
  "https://pharmpeople.ru/obstanovka/v-rossii-zapatentovali-avtomatizirovannuyu-sistemu-dlya-lazernogo-lecheniya-glaz/",
  KRYM,
  "https://vospalenie.oor.ru/",
  "https://pirogoveyeforum.ru/",
  "https://igb.ru/news/news-list/nauchno-prakticheskaya-konferentsiya-s-mezhdunarodnym-uchastiem-aktualnye-voprosy-oftalmoonkologii-i/",
  "https://eyeboc.ru/",
  "http://eyenews.ru/congress/178/",
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

test("consecutive news figures stay one group until text breaks the run", () => {
  const sections = parseNewsContent(`![Первое](/images/news/a.webp){800x400}
Подпись.

![Второе](/images/news/b.webp){800x400}
Подпись.

![Третье](/images/news/c.webp){600x800}
Подпись.

Абзац между группами.

- Пункт между группами

![Четвёртое](/images/news/d.webp){900x500}
Подпись.`);

  const flows = groupNewsBlocks(sections[0]?.blocks ?? []);
  assert.deepEqual(
    flows.map((block) => (block.type === "figures" ? block.figures.map((figure) => figure.src) : block.type)),
    [
      ["/images/news/a.webp", "/images/news/b.webp", "/images/news/c.webp"],
      "paragraph",
      "list",
      ["/images/news/d.webp"],
    ],
  );
});

test("October 2026 congress news follows the approved draft and sourced photos", () => {
  const news = OCTOBER_2026_CONGRESSES_NEWS;
  assert.equal(news.slug, "kongressy-oktyabr-2026");
  assert.equal(
    news.title,
    "Офтальмологические конгрессы России: итоги второй половины сентября — середины октября 2026 года и ближайшие события",
  );
  assert.equal(news.seoTitle, news.title);

  const sections = parseNewsContent(news.content);
  assert.deepEqual(
    sections.map((section) => section.title),
    [
      "Прошедшие конгрессы",
      "Всероссийская научная конференция «Офтальмотравматология»",
      "Научно-практическая конференция «Инновационные технологии в офтальмологии — 2026»",
      "XIX Российский общенациональный офтальмологический форум (РООФ-2026)",
      "Другие важные новости для клиник и врачей",
      "Ближайшие конгрессы",
    ],
  );

  const figures = newsFigureSources(news.content);
  assert.deepEqual(
    figures.map((figure) => [figure.src, figure.width, figure.height, figure.alt]),
    [
      ["/images/news/kongressy-oktyabr-2026/oftalmotravma-1.webp", 1280, 961, "Президиум конференции «Офтальмотравматология» и участники в зале"],
      ["/images/news/kongressy-oktyabr-2026/oftalmotravma-2.webp", 1280, 961, "Доклад на конференции «Офтальмотравматология»: на экране слайд, слушатели в зале"],
      ["/images/news/kongressy-oktyabr-2026/oftalmotravma-3.webp", 1280, 961, "Участники конференции «Офтальмотравматология» в зале"],
      ["/images/news/kongressy-oktyabr-2026/tomsk-1.webp", 1080, 720, "Сцена конференции в Томске: президиум и докладчик у трибуны"],
      ["/images/news/kongressy-oktyabr-2026/tomsk-2.webp", 810, 1080, "Докладчица у трибуны на фоне слайда о кистозных макулярных отёках"],
      ["/images/news/kongressy-oktyabr-2026/tomsk-3.webp", 782, 1080, "Докладчица у трибуны на фоне слайда со статистикой операций на стекловидном теле"],
      ["/images/news/kongressy-oktyabr-2026/roof-1.webp", 800, 533, "Полный зал участников РООФ-2026"],
      ["/images/news/kongressy-oktyabr-2026/roof-2.webp", 800, 533, "Пленарный доклад на сцене РООФ-2026"],
      ["/images/news/kongressy-oktyabr-2026/roof-3.webp", 800, 533, "Заседание экспертного совета в рамках РООФ-2026"],
      ["/images/news/kongressy-oktyabr-2026/krym-1.webp", 1600, 1067, "Хирург-офтальмолог работает с операционным микроскопом"],
      ["/images/news/kongressy-oktyabr-2026/krym-2.webp", 1600, 1067, "Команда офтальмологов у операционного микроскопа и лазерной установки"],
      ["/images/news/kongressy-oktyabr-2026/krym-3.webp", 1600, 1067, "Экран лазерной системы во время офтальмологической операции"],
    ],
  );
  assert.equal(newsOpenGraphImage(news.content)?.src, "/images/news/kongressy-oktyabr-2026/roof-1.webp");

  for (const title of [
    "Всероссийская научная конференция «Офтальмотравматология»",
    "Научно-практическая конференция «Инновационные технологии в офтальмологии — 2026»",
    "XIX Российский общенациональный офтальмологический форум (РООФ-2026)",
    "Другие важные новости для клиник и врачей",
  ]) {
    const groups = groupNewsBlocks(sections.find((section) => section.title === title)?.blocks ?? []).filter(
      (block) => block.type === "figures",
    );
    assert.equal(groups.length, 1, title);
    assert.equal(groups[0]?.type === "figures" ? groups[0].figures.length : 0, 3, title);
  }

  for (const figure of figures) {
    assert.equal(existsSync(resolve(process.cwd(), "public", figure.src.slice(1))), true);
    assert.equal(
      figure.caption.map((part) => (part.type === "text" ? part.text : part.text)).join(""),
      figure.caption[0]?.type === "text" ? `Источник: ${figure.caption.slice(1).map((part) => part.type === "text" ? part.text : part.text).join("")}` : "",
    );
    assert.equal(figure.caption[0]?.type === "text" && figure.caption[0].text.startsWith("Источник:"), true);
    assert.equal(figure.caption.some((part) => part.type === "link"), true);
  }

  const hrefs = sections.flatMap((section) =>
    section.blocks.flatMap((block) => {
      if (block.type === "paragraph") return block.inlines;
      if (block.type === "figure") return block.caption;
      if (block.type === "list") return block.items.flat();
      return [];
    }),
  ).flatMap((inline) => (inline.type === "link" ? [inline.href] : []));

  assert.deepEqual(new Set(hrefs), ALLOWED_HREFS);
  for (const phrase of [
    "Донск",
    "ДонЭкспо",
    "don-conf",
    "Уфим",
    "eastwestufa",
    "Вчера, сегодня, завтра",
    "Тюменский офтальмологический форум",
    "30 октября",
    "6 ноября",
    "11 декабря",
    "Менеджмент качества",
    "2025",
    "нужно проверить",
    "katarakta",
    "Сильвер Холл",
    "15 октября",
  ]) {
    assert.equal(news.content.includes(phrase), false, phrase);
    assert.equal(news.summary.includes(phrase), false, phrase);
  }
  assert.equal(existsSync(resolve(process.cwd(), "public/images/news/kongressy-oktyabr-2026/katarakta-2026.webp")), false);
});

test("callout and quote stay inside the article order", () => {
  const sections = parseNewsContent(`## Раздел

Абзац.

:::callout Из клинической практики конференции
- Кейс 1. Описание
:::

:::quote
Юрий Тахтаев
д.м.н., профессор
«Цитата».
:::`);

  assert.equal(sections[0].blocks[1]?.type, "callout");
  assert.equal(sections[0].blocks[2]?.type, "quote");
  if (sections[0].blocks[2]?.type === "quote") {
    assert.equal(sections[0].blocks[2].name, "Юрий Тахтаев");
    assert.equal(sections[0].blocks[2].credentials, "д.м.н., профессор");
    assert.equal(sections[0].blocks[2].text, "«Цитата».");
  }
});
