import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { WEEK_12_18_OCTOBER_2026_NEWS } from "../../../prisma/data/news/kongressy-12-18-oktyabrya-2026";
import { groupNewsBlocks, newsFigureSources, parseNewsContent } from "../news-content";

const APPROVED_LINKS = [
  "https://www.lvrach.ru/event/1795",
  "https://medialnn.ru/?id=76558",
  "https://vesti-omsk.ru/news/zdorove/omsk-sobral-vedushhih-vrachej-oftalmologov-iz-raznyh-regionov-rossii/",
  "https://omsk-osma.ru/news/priglashaem-prinyat-uchastie-v-konferencii-151",
  "https://onco-academy.ru/conferences/conf-384",
  "https://www.ronc.ru/about/press-tsentr/eto-ne-prosto-shkola-eto-soobshchestvo/",
  "https://t.me/onco_academy/2434",
  "https://susmu.su/science/konferencii-i-drugie-meroprijatija/konferentsii-yuugmu/17609/",
  "https://susmu.su/kafedri/glaznykh-bolezney/fayly-kafedry/Conference_17.10.2026.pdf",
  "https://www.mntk-nsk.ru/o-klinike/news/721-meeting-of-the-ophthalmological-society-october-21-2026",
  "https://ovis.ru/visus/news-portal-video-organum-visus/ophthalmology-in-tyumen-2026/",
  "https://www.mntk.ru/specialists/Konferents/vospalenie-glaza/",
  "https://orch-conf.ru/",
];

test("week of 12–18 October 2026 keeps the approved roundup", () => {
  const news = WEEK_12_18_OCTOBER_2026_NEWS;
  assert.equal(news.slug, "kongressy-12-18-oktyabrya-2026");
  assert.equal(news.publishedAt, "2026-10-19T00:00:00.000Z");
  assert.equal(news.title, "Офтальмологические конференции в России: обзор недели 12–18 октября 2026 года");
  assert.equal(news.coverImageUrl, "/images/news/kongressy-12-18-oktyabrya-2026/omsk-1.webp");
  assert.match(news.summary, /Нижнем Новгороде, Омске, Москве и Челябинске/);
  for (const href of APPROVED_LINKS) assert.equal(news.content.includes(href), true, href);
  assert.equal(news.content.includes("Где искал"), false);
  assert.equal(news.content.includes("Есть 1 из 3"), false);
  assert.equal(news.content.includes("увеличивать не стал"), false);

  const sections = parseNewsContent(news.content);
  assert.deepEqual(
    sections.map((section) => section.title),
    [
      "1. XXI Школа офтальмологов ПФО «Актуальные вопросы современной офтальмологии»",
      "2. Конференция «День здорового зрения 2026»",
      "3. V Школа по диагностике и лечению детей с ретинобластомой",
      "4. Межрегиональная конференция «Хирургия и терапия: синергия в офтальмологии»",
      "Ближайшие события",
    ],
  );

  const groups = sections.map((section) =>
    groupNewsBlocks(section.blocks)
      .filter((block) => block.type === "figures")
      .map((block) => (block.type === "figures" ? block.figures.length : 0)),
  );
  assert.deepEqual(groups, [[1], [3], [2], [1], []]);

  const figures = newsFigureSources(news.content);
  const moscow = figures.find((figure) => figure.src.endsWith("/moskva-retinoblastoma-1.webp"));
  assert.equal(moscow?.width, 310);
  assert.equal(moscow?.height, 260);
  for (const figure of figures) {
    assert.equal(existsSync(resolve(process.cwd(), "public", figure.src.slice(1))), true, figure.src);
    assert.equal(figure.caption[0]?.type === "text" && figure.caption[0].text.startsWith("Источник:"), true);
    assert.equal(figure.caption.some((part) => part.type === "link"), true);
  }
});
