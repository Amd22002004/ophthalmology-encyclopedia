import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AssociationAboutPage } from "./association-about-page";
import {
  associationAboutContent,
  associationClinicsPage,
  associationDoctorsPage,
  associationHomeContent,
  associationPrinciples,
} from "@/lib/association-content";

const html = renderToStaticMarkup(React.createElement(AssociationAboutPage, { clinics: [] }));
const text = html
  .replace(/<[^>]+>/g, " ")
  .replace(/&quot;/g, '"')
  .replace(/&#x27;/g, "'")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ");
const sectionIds = [...html.matchAll(/<section[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);

function sectionText(id: string) {
  const start = html.indexOf(`id="${id}"`);
  const end = html.indexOf("</section>", start);
  return html.slice(start, end).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

test("mission matches the home page word for word, on a light quote", () => {
  assert.equal(associationAboutContent.mission.body, associationHomeContent.about.mission);
  assert.ok(text.includes(associationHomeContent.about.mission));
  assert.match(sectionText("mission"), /Наша миссия/);
  const mission = html.slice(html.indexOf('id="mission"'), html.indexOf("</section>", html.indexOf('id="mission"')));
  assert.doesNotMatch(mission, /bg-primary text-primary-foreground/);
});

test("three goal cards remain in one row on wide screens", () => {
  assert.deepEqual(
    associationAboutContent.goals.map((goal) => `${goal.title}: ${goal.body}`),
    [
      "Развитие офтальмологии: Поддержка современной клинической практики и профессиональных инициатив.",
      "Обмен опытом: Взаимодействие между клиниками, врачами, исследователями и экспертами.",
      "Профессиональные связи: Формирование устойчивого взаимодействия между участниками отрасли.",
    ],
  );
  assert.match(html.slice(html.indexOf('id="mission"')), /class="grid gap-3 md:grid-cols-3"/);
});

test("hero line and join buttons match the home page", () => {
  assert.equal(associationAboutContent.hero.accent, associationHomeContent.hero.directions);
  assert.ok(text.includes("Клиники · Врачи · Наука · Технологии · Нормативная база"));
  assert.equal((text.match(/Вступить в Ассоциацию/g) || []).length, 2);
});

test("texts of removed and renamed blocks are gone", () => {
  for (const removed of [
    "Создавать профессиональную инфраструктуру",
    "Публикации, исследования, профессиональные материалы и мероприятия",
    "Систематизация документов, требований и официальных источников",
    "Создание понятной цифровой среды",
    "Представление современного оборудования, методов и профессиональных решений",
    "Данные профессиональных каталогов платформы",
    "Цифровой проект",
    "Открыть Энциклопедию",
    "Подача заявок через /cooperation",
    "Принципы профессиональной работы",
    "Структурированный профессиональный профиль помогает",
    "Технологии · Профессиональное сообщество",
    "Стать участником",
    "Представление специалистов",
    "Экспертное участие",
  ]) {
    assert.ok(!text.includes(removed), removed);
  }
  assert.ok(!sectionIds.includes("metrics"));
});

test("the page never uses the word encyclopedia", () => {
  assert.doesNotMatch(html, /нциклопед/i);
  const projects = sectionText("projects");
  assert.match(projects, /Справочные разделы/);
  assert.match(projects, /Заболевания, процедуры, врачи, клиники, оборудование, публикации и нормативные документы в одной структуре\./);
  assert.match(html, /href="\/diseases"[^>]*>\s*Открыть раздел/);
  assert.ok(text.includes("Подача заявок на участие"));
});

test("clinic and doctor benefits are the approved texts with their closing lines", () => {
  for (const [id, page] of [
    ["clinics", associationClinicsPage],
    ["doctors", associationDoctorsPage],
  ] as const) {
    const block = sectionText(id);
    assert.equal(page.benefits.length, 6);
    for (const benefit of page.benefits) {
      assert.ok(block.includes(benefit.title), benefit.title);
      if ("body" in benefit) assert.ok(block.includes(benefit.body), benefit.body);
    }
    assert.ok(block.includes(page.closing), page.closing);
  }
  assert.match(sectionText("clinics"), /Для клиники — профессиональное присутствие и новые связи/);
  assert.match(sectionText("doctors"), /Сведения рассматриваются отдельно; отправка заявки не означает автоматического вступления\./);
});

test("«Наши принципы» with explanations stand right before «Как мы работаем с информацией»", () => {
  const ourPrinciples = sectionIds.indexOf("association-principles");
  assert.equal(sectionIds[ourPrinciples + 1], "principles");
  const block = sectionText("association-principles");
  for (const principle of associationPrinciples) {
    assert.ok(block.includes(`${principle.title} ${principle.body}`), principle.title);
  }
  const rules = sectionText("principles");
  assert.match(rules, /Как мы работаем с информацией/);
  for (const rule of associationAboutContent.principles) assert.ok(rules.includes(rule.title), rule.title);
});

test("people of the association follow the mission", () => {
  assert.deepEqual(sectionIds.slice(0, 5), ["about", "purpose", "mission", "people", "projects"]);
});

test("anchor navigation follows the page and points to existing blocks", () => {
  const navIds: string[] = associationAboutContent.nav.map((item) => item.id);
  assert.deepEqual(navIds, sectionIds.filter((id) => navIds.includes(id)));
  assert.ok(navIds.includes("association-principles"));
  for (const id of navIds) assert.ok(sectionIds.includes(id), id);
});
