import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { EventSpeakers } from "./event-speakers";
import { STO_2026_SPEAKERS } from "@/lib/events/sto-2026";

test("event speakers keeps six editorial cards and one grouped topic list per speaker", () => {
  const html = renderToStaticMarkup(
    React.createElement(EventSpeakers, {
      context: { eventSlug: "sovremennye-tehnologii-v-oftalmologii-2026" },
      speakers: STO_2026_SPEAKERS,
    }),
  );

  assert.match(html, /data-mobile-accordion="speakers"/);
  assert.equal((html.match(/data-speaker-card=/g) ?? []).length, 6);
  assert.equal((html.match(/data-speaker-topic=/g) ?? []).length, 12);
  assert.equal((html.match(/aria-controls=/g) ?? []).length, 6);
  assert.match(
    html,
    /Возможности коррекции зрения с помощью современных интраокулярных линз компании Alcon/,
  );
  assert.doesNotMatch(html, /Макулярный разрыв\. Катаракта/);
});
