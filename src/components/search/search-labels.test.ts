import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sourceFiles = [
  "src/app/(platform)/page.tsx",
  "src/components/search/search-dialog.tsx",
  "src/lib/association-content.ts",
];

test("public search labels use the site-wide wording", () => {
  for (const file of sourceFiles) {
    const source = readFileSync(file, "utf8");

    assert.match(source, /Поиск по сайту/);
    assert.doesNotMatch(source, /Поиск по энциклопедии/i);
  }
});
