import assert from "node:assert/strict";
import test from "node:test";
import { scheduleCooperationApplicationScroll } from "./cooperation-scroll";

test("schedules a smooth application scroll on desktop", () => {
  let scheduled: (() => void) | null = null;
  let scrollOptions: ScrollToOptions | null = null;
  const target = {
    getBoundingClientRect() {
      return { top: 740 };
    },
  };
  const viewport = {
    scrollY: 120,
    scrollTo(options?: ScrollToOptions) {
      scrollOptions = options ?? null;
    },
  };

  scheduleCooperationApplicationScroll(target, true, (callback) => { scheduled = callback; }, viewport);

  assert.equal(typeof scheduled, "function");
  (scheduled as unknown as () => void)();
  assert.deepEqual(scrollOptions, { behavior: "smooth", top: 764 });
});

test("does not schedule an application scroll on mobile", () => {
  let scheduled = false;
  const target = {
    getBoundingClientRect() {
      throw new Error("mobile must not scroll through the desktop callback");
    },
  };
  const viewport = {
    scrollY: 0,
    scrollTo() {
      throw new Error("mobile must not scroll through the desktop callback");
    },
  };

  scheduleCooperationApplicationScroll(target, false, () => { scheduled = true; }, viewport);

  assert.equal(scheduled, false);
});
