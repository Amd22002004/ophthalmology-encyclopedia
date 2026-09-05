import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DiseaseFaq } from "./disease-faq";

test("disease FAQ renders accessible native disclosure items", () => {
  const html = renderToStaticMarkup(
    React.createElement(DiseaseFaq, {
      items: [
        { question: "Что это?", answer: "Краткий ответ." },
        { question: "Что делать?", answer: "Обратиться к офтальмологу." },
      ],
    }),
  );

  assert.match(html, /<section[^>]*aria-labelledby="disease-faq-title"/);
  assert.match(html, /<h2[^>]*id="disease-faq-title"[^>]*>Частые вопросы<\/h2>/);
  assert.equal((html.match(/<details/g) ?? []).length, 2);
  assert.match(html, /<summary[^>]*>.*Что это\?.*<\/summary>/);
  assert.match(html, /Краткий ответ\./);
});

test("disease FAQ omits an empty block", () => {
  assert.equal(renderToStaticMarkup(React.createElement(DiseaseFaq, { items: [] })), "");
});
