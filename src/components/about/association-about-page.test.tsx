import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AssociationAboutPage } from "./association-about-page";
import { associationPrinciples } from "@/lib/association-content";

const html = renderToStaticMarkup(React.createElement(AssociationAboutPage, { counts: null, clinics: [] }));
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

test("about page shows «Наши принципы» right before the professional work principles", () => {
  const ourPrinciples = html.indexOf('id="association-principles"');
  const workPrinciples = html.indexOf('id="principles"');
  assert.ok(ourPrinciples > 0, "«Наши принципы» block is rendered");
  assert.ok(ourPrinciples < workPrinciples, "«Наши принципы» comes first");
  // Единственный `<section` в срезе — открывающий тег самого блока «Принципы
  // профессиональной работы»: между блоками ничего нет.
  assert.equal(html.slice(ourPrinciples, workPrinciples).match(/<section/g)?.length, 1, "no other block in between");

  const block = text.slice(text.indexOf("Наши принципы"), text.indexOf("Принципы профессиональной работы"));
  for (const principle of associationPrinciples) {
    assert.ok(block.includes(principle.title), principle.title);
    assert.ok(block.includes(principle.body), principle.body);
  }
});
