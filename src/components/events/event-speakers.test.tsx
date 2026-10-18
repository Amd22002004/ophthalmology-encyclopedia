import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { EventSpeakers } from "./event-speakers";
import { STO_2026_SPEAKERS } from "@/lib/events/sto-2026";

test("event speakers keeps seven editorial cards and hides profiles without a doctor page", () => {
  const html = renderToStaticMarkup(
    React.createElement(EventSpeakers, {
      context: { eventSlug: "sovremennye-tehnologii-v-oftalmologii-2026" },
      speakers: STO_2026_SPEAKERS,
    }),
  );

  assert.match(html, /data-mobile-accordion="speakers"/);
  assert.equal((html.match(/data-speaker-card=/g) ?? []).length, 7);
  assert.equal((html.match(/data-speaker-topic=/g) ?? []).length, 12);
  assert.equal((html.match(/aria-controls=/g) ?? []).length, 7);
  assert.equal((html.match(/Профессиональный профиль/g) ?? []).length, 5);
  assert.match(html, /система Navilas/);
  assert.match(html, /Дубровина Анна Валерьевна/);
  assert.doesNotMatch(html, /Евдокимов|Витреолизис|интраокулярных линз компании Alcon|Макулярный разрыв/);
  assert.doesNotMatch(html, /href="\/doctors\/null"|href="\/doctors\/undefined"/);
});
