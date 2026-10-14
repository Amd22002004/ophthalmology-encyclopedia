import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AssociationAboutPage } from "./association-about-page";
import { catalogFixture } from "@/lib/clinic-map/catalog-fixture";
import type { ClinicCardData } from "@/lib/loaders";

const clinics = catalogFixture.map(
  (clinic) =>
    ({
      ...clinic,
      legalName: null,
      clinicType: null,
      networkName: null,
      status: "active",
      omsEnabled: false,
      phones: [],
      email: null,
      website: null,
      address: null,
      inn: null,
      license: null,
      logoUrl: null,
      specializationTags: [],
      investigations: [],
    }) satisfies ClinicCardData,
);

const html = renderToStaticMarkup(React.createElement(AssociationAboutPage, { clinics }));
const start = html.indexOf('id="participants"');
const block = html.slice(start, html.indexOf("</section>", start));
const text = block.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

test("geography block keeps its title, eyebrow and both notes verbatim", () => {
  for (const fragment of [
    "География профессионального сообщества",
    "Источник данных: активный каталог клиник",
    "Каталог клиник и официальный список участников — разные понятия. В этой версии страницы отображаются только организации, представленные в информационном каталоге платформы.",
    "Это не утверждение о членстве в Ассоциации и не рейтинг организаций.",
  ]) {
    assert.ok(text.includes(fragment), fragment);
  }
  // Второе пояснение стоит до карты, а не в подписи под ней.
  assert.ok(block.indexOf("Это не утверждение") < block.indexOf('role="group"'));
  assert.doesNotMatch(text, /Города, представленные в каталоге/);
});

test("map is a labelled group with a decorative contour and point buttons", () => {
  assert.match(block, /aria-label="География профессионального сообщества" class="clinic-map[^"]*"[^>]*role="group"/);
  assert.match(block, /<svg aria-hidden="true"/);
  assert.equal((block.match(/class="clinic-map-point"/g) || []).length, 10);
  assert.match(block, /aria-label="Тюмень, 3 клиники" aria-pressed="false"/);
  assert.match(block, /aria-label="Ноябрьск, 2 клиники" aria-pressed="false"/);
  assert.match(block, /aria-label="Тюмень, 3 клиники"[^>]*>\s*<span aria-hidden="true" class="clinic-map-dot" data-multi="true">3<\/span>/);
});

test("server HTML lists every city with all clinic profile links", () => {
  assert.equal((block.match(/aria-expanded="false"/g) || []).length, 10);
  const links = [...block.matchAll(/href="(\/clinics\/[^"]+)"/g)].map((match) => match[1]).sort();
  assert.deepEqual(
    links,
    catalogFixture.filter((clinic) => clinic.slug !== "glaztsentr-tyumen").map((clinic) => `/clinics/${clinic.slug}`).sort(),
  );
  assert.doesNotMatch(block, /Глазцентр-Тюмень|glaztsentr-tyumen/);
  // Панели городов есть в HTML; без JavaScript их раскрывает globals.css.
  assert.equal((block.match(/class="clinic-geo-panel hidden"/g) || []).length, 10);
});
