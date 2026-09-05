import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AssociationBrand } from "./association-brand";

test("association brand renders the shared logo and primary identity", () => {
  const html = renderToStaticMarkup(React.createElement(AssociationBrand));

  assert.match(html, /association-logo\.png/);
  assert.match(html, /Профессиональное объединение/);
  assert.match(html, /Ассоциация офтальмологических клиник/);
  assert.doesNotMatch(html, /Офтальмологическая энциклопедия|Профессиональный справочник/);
});

test("compact association brand keeps the association name visible on mobile", () => {
  const html = renderToStaticMarkup(
    React.createElement(AssociationBrand, { variant: "compact" }),
  );

  assert.match(html, /Ассоциация офтальмологических клиник/);
  assert.match(html, /association-logo\.png/);
  assert.doesNotMatch(html, />АОК</);
});

test("compact association brand uses two centered lines on mobile", () => {
  const html = renderToStaticMarkup(
    React.createElement(AssociationBrand, { variant: "compact" }),
  );

  assert.match(html, /text-center/);
  assert.match(html, /<span class="block whitespace-nowrap">Ассоциация<\/span>/);
  assert.match(html, /<span class="block whitespace-nowrap">офтальмологических клиник<\/span>/);
});
