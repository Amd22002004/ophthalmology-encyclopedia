import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage, { metadata } from "./page";
import { associationHomeContent as content, associationPrinciples } from "@/lib/association-content";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const html = renderToStaticMarkup(React.createElement(HomePage));
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

function decode(value: string) {
  return value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
}

test("server HTML contains every approved home text", () => {
  const plain = decode(text);
  const approved = [
    ...Object.values(content.hero),
    content.about.title,
    content.about.lead,
    content.about.bridge,
    content.about.mission,
    ...content.about.principles,
    content.audiences.clinics.intro,
    ...content.audiences.clinics.benefits,
    content.audiences.clinics.closing,
    content.audiences.doctors.intro,
    ...content.audiences.doctors.benefits,
    content.audiences.doctors.closing,
    content.audiences.caption,
    content.join.title,
    ...content.join.steps,
    content.join.callToAction,
    content.join.cta,
    content.members.title,
    ...content.members.clinics.map((clinic) => clinic.name),
    content.members.more,
    content.members.allLabel,
    content.directoriesTitle,
    "Пациентам",
    "Врачам",
    "Клиникам",
    "Поставщикам",
  ];
  for (const fragment of approved) assert.ok(plain.includes(fragment), `missing: ${fragment}`);
});

test("blocks follow the approved order", () => {
  const order = [
    'id="home-hero-title"',
    'id="home-about-title"',
    'id="home-audiences-title"',
    'id="home-join-title"',
    'id="home-members-title"',
    'id="home-directories-title"',
  ].map((marker) => html.indexOf(marker));
  assert.ok(order.every((position) => position >= 0), "every block is rendered");
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test("server HTML never ships a hidden initial animation state", () => {
  assert.doesNotMatch(html, /opacity:\s*0(?![.\d])/);
  assert.doesNotMatch(html, /stroke-dashoffset|stroke-dasharray/);
  assert.doesNotMatch(html, /visibility:\s*hidden/);
});

test("removed home blocks stay removed", () => {
  assert.doesNotMatch(source, /getEntityCounts|StatItem|getDiseaseCategories|catalogConfigs|getNews/);
  assert.doesNotMatch(text, /Перейти в энциклопедию|Категории заболеваний|Все разделы энциклопедии/);
  assert.doesNotMatch(text, /единиц оборудования/);
});

test("calls to action use existing routes and the in-page member anchor", () => {
  assert.match(html, /href="\/cooperation"[^>]*>Вступить в Ассоциацию</);
  assert.match(html, /href="#members"[^>]*>Клиники-участники</);
  assert.match(html, /id="members"/);
  assert.match(html, /href="\/cooperation"[^>]*>Заполнить анкету</);
  assert.match(html, /href="\/cooperation\/clinic"/);
  assert.match(html, /href="\/cooperation\/doctor"/);
  assert.match(html, /href="\/clinics"/);
});

test("home principles show titles only; explanations live on /about", () => {
  assert.deepEqual(content.about.principles, associationPrinciples.map((principle) => principle.title));
  for (const principle of associationPrinciples) {
    assert.ok(decode(text).includes(principle.title), principle.title);
    assert.ok(!decode(text).includes(principle.body), `explanation must not be on home: ${principle.body}`);
  }
  assert.doesNotMatch(text, /Экспертные решения не определяет/);
});

test("home page never uses the word encyclopedia, including JSON-LD and metadata", () => {
  assert.doesNotMatch(html, /нциклопед/i);
  assert.doesNotMatch(JSON.stringify(metadata), /нциклопед/i);
});

test("hero entrance is CSS-only and staggered by 80 ms", () => {
  assert.equal((source.match(/home-hero-reveal/g) || []).length, 3);
  assert.match(source, /\[--hero-reveal-delay:80ms\]/);
  assert.match(source, /\[--hero-reveal-delay:160ms\]/);
});
