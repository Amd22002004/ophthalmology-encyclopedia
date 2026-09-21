import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { EventHero } from "./event-hero";

const event = {
  title: "Современные технологии в офтальмологии",
  description:
    "Практический опыт, современные хирургические технологии и клинические решения — в профессиональном диалоге офтальмологов.",
  dateLabel: "15 октября 2026 года",
  registrationLabel: "Регистрация гостей и кофе-брейк — с 14:00",
  startLabel: "Начало конференции — 15:00",
  venueName: "DoubleTree by Hilton Tyumen",
  venueAddress: "г. Тюмень, ул. Орджоникидзе, 46",
  venueHall: "Сильвер Холл",
  venueFloor: "2 этаж",
  registrationOpen: true,
};

test("conference hero uses a light event-information tile layout", () => {
  const html = renderToStaticMarkup(
    React.createElement(EventHero, {
      event,
      registrationHref: "/events/sovremennye-tehnologii-v-oftalmologii-2026/register",
      context: { eventSlug: "sovremennye-tehnologii-v-oftalmologii-2026" },
    }),
  );

  assert.match(html, /data-event-hero="true"/);
  assert.match(html, /МЕЖРЕГИОНАЛЬНАЯ КОНФЕРЕНЦИЯ · ТЮМЕНЬ/);
  assert.match(html, /Современные/);
  assert.match(html, /технологии в/);
  assert.match(html, /офтальмологии/);
  assert.match(html, /Практический опыт, современные хирургические технологии/);
  assert.match(html, /Зарегистрироваться/);
  assert.match(html, /class="[^"]*hidden[^"]*md:inline-flex[^"]*"/);
  assert.match(html, /Изучить программу/);
  assert.doesNotMatch(html, /Участие бесплатное · По приглашению · Предварительная регистрация обязательна\./);
  assert.match(html, /data-event-hero-theme="light"/);
  assert.deepEqual(
    [...html.matchAll(/data-event-fact="([^"]+)"/g)].map((match) => match[1]),
    ["date", "time", "place"],
  );
  assert.doesNotMatch(html, /data-event-fact="participation"/);
  assert.match(html, /sto-2026-hero\.webp/);
  assert.match(html, /sto-2026-hero-mobile\.webp/);
  assert.match(html, /data-event-hero-copy="approved"/);
  assert.doesNotMatch(html, /Регистрация скоро откроется/);
});
