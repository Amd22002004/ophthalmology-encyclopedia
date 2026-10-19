import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NewsMembershipCta } from "@/components/news/news-membership-cta";
import { NewsVideo } from "@/components/news/news-video";
import { associationHomeContent } from "@/lib/association-content";
import { resolveNewsEvent } from "@/lib/news-event";
import { parseNewsContent } from "@/lib/news-content";
import {
  CHURAKOV_NEWS_CREDENTIALS,
  CHURAKOV_NEWS_NAME,
  STO_2026_CONFERENCE_NEWS,
  TAKHTAEV_NEWS_CREDENTIALS,
} from "@/lib/news/sto-2026-report";

test("conference report keeps the approved quotes and speaker credentials", () => {
  const sections = parseNewsContent(STO_2026_CONFERENCE_NEWS.content);
  const quotes = sections.flatMap((section) => section.blocks).filter((block) => block.type === "quote");
  assert.equal(quotes.length, 3);

  assert.equal(quotes[0].type === "quote" && quotes[0].name, "Юрий Тахтаев");
  assert.equal(quotes[0].type === "quote" && quotes[0].credentials, TAKHTAEV_NEWS_CREDENTIALS);
  assert.match(STO_2026_CONFERENCE_NEWS.content, new RegExp(TAKHTAEV_NEWS_CREDENTIALS.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(STO_2026_CONFERENCE_NEWS.content, /Европейского общества|Американской Академии|Американского общества/);

  assert.equal(quotes[1].type === "quote" && quotes[1].name, CHURAKOV_NEWS_NAME);
  assert.equal(quotes[1].type === "quote" && quotes[1].credentials, CHURAKOV_NEWS_CREDENTIALS);
  assert.equal(quotes[2].type === "quote" && quotes[2].name, "Участница конференции");
  assert.equal(quotes[2].type === "quote" && quotes[2].credentials, "врач-офтальмолог");
  assert.match(quotes[2].type === "quote" ? quotes[2].text : "", /Конференции несомненно важны/);
});

test("event link uses the conference snapshot and ignores unknown slugs", () => {
  const event = resolveNewsEvent(STO_2026_CONFERENCE_NEWS.eventSlug);
  assert.equal(event?.venueName, "DoubleTree by Hilton Tyumen");
  assert.equal(event?.venueHall, "Сильвер Холл");
  assert.equal(event?.dateLabel, "15 октября 2026 года");
  assert.equal(event?.href, "/events/sovremennye-tehnologii-v-oftalmologii-2026");
  assert.equal(resolveNewsEvent("drugoe-meropriyatie"), null);
});

test("membership banner reuses the home benefits and routes", () => {
  const html = renderToStaticMarkup(React.createElement(NewsMembershipCta));
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  assert.match(text, new RegExp(associationHomeContent.join.callToAction));
  for (const benefit of [
    ...associationHomeContent.audiences.clinics.benefits,
    ...associationHomeContent.audiences.doctors.benefits,
  ]) {
    assert.match(text, new RegExp(benefit));
  }
  assert.match(html, /href="\/cooperation"/);
  assert.match(html, /href="\/#members"/);
  assert.match(text, /Вступить в Ассоциацию/);
  assert.match(text, /Клиники-участники/);
});

test("video player exposes controls, poster and chapter seek buttons", () => {
  const html = renderToStaticMarkup(
    React.createElement(NewsVideo, {
      src: STO_2026_CONFERENCE_NEWS.videoUrl,
      poster: STO_2026_CONFERENCE_NEWS.videoPosterUrl,
      chapters: [...STO_2026_CONFERENCE_NEWS.videoChapters],
      width: 1048,
      height: 576,
    }),
  );
  assert.match(html, /controls=""/);
  assert.match(html, /preload="metadata"/);
  assert.match(html, /poster="\/images\/events\/konferenciya-aok-tyumen-15-10\/00-29-banner\.webp"/);
  assert.match(html, /00:00/);
  assert.match(html, /01:47/);
  assert.match(html, /Навигация по видеосюжету/);
});
