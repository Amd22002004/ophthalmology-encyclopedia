import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAppealHref,
  getObservedElementPosition,
  isFloatingAppealVisible,
} from "./navigation";

test("buildAppealHref keeps the generic form canonical", () => {
  assert.equal(buildAppealHref(), "/appeal");
  assert.equal(buildAppealHref(""), "/appeal");
});

test("buildAppealHref safely transfers investigation context", () => {
  assert.equal(
    buildAppealHref("проверка/2026"),
    "/appeal?investigation=%D0%BF%D1%80%D0%BE%D0%B2%D0%B5%D1%80%D0%BA%D0%B0%2F2026",
  );
});

test("getObservedElementPosition distinguishes before, visible and passed elements", () => {
  assert.equal(getObservedElementPosition({ isIntersecting: false, top: 900, bottom: 1100 }), "before");
  assert.equal(getObservedElementPosition({ isIntersecting: true, top: 100, bottom: 300 }), "visible");
  assert.equal(getObservedElementPosition({ isIntersecting: false, top: -300, bottom: -10 }), "after");
});

test("floating invitation appears only after the main invitation and before the end invitation", () => {
  assert.equal(isFloatingAppealVisible({ triggerPosition: "before", endVisible: false }), false);
  assert.equal(isFloatingAppealVisible({ triggerPosition: "visible", endVisible: false }), false);
  assert.equal(isFloatingAppealVisible({ triggerPosition: "after", endVisible: false }), true);
  assert.equal(isFloatingAppealVisible({ triggerPosition: "after", endVisible: true }), false);
});

