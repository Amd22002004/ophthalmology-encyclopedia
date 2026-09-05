import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("home hero keeps mobile artwork in a bounded decorative section", () => {
  assert.match(source, /className="home-hero /);
  assert.match(source, /className="home-hero-art [^"]*md:hidden/);
  assert.match(source, /className="[^"]*hidden[^"]*min-h-\[230px\][^"]*md:block/);
  assert.doesNotMatch(source, /home-hero-art[^\n]*min-h-\[230px\]/);
  assert.doesNotMatch(source, /home-hero-art[^\n]*-mx-/);
});

test("mobile home hero keeps the content-to-art transition compact", () => {
  assert.match(source, /className="home-hero [^"]*grid-cols-1[^"]*gap-3[^"]*md:gap-4/);
  assert.match(source, /className="relative z-10 p-5 pb-2[^"]*sm:p-6 sm:pb-2/);
  assert.match(source, /className="home-hero-art [^"]*min-w-0[^"]*w-full[^"]*min-h-\[160px\]/);
  assert.doesNotMatch(source, /home-hero-art[^\n]*min-h-\[190px\]/);
});

test("home hero has a separate compact mobile description", () => {
  assert.match(source, /associationHomeContent\.hero\.mobileDescription/);
  assert.match(source, /className="[^\"]*md:hidden/);
  assert.match(source, /className="[^\"]*hidden[^\"]*md:block/);
});
