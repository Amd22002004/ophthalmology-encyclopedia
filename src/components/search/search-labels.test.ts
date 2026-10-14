import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Главная по ТЗ v1.1 не содержит собственной формы поиска; правило формулировки
// по-прежнему действует для всех публичных подписей поиска.
const searchLabelFiles = ["src/components/search/search-dialog.tsx"];
const wordingFiles = [
  "src/app/(platform)/page.tsx",
  "src/components/search/search-dialog.tsx",
  "src/lib/association-content.ts",
];

test("public search labels use the site-wide wording", () => {
  for (const file of searchLabelFiles) {
    assert.match(readFileSync(file, "utf8"), /Поиск по сайту/);
  }
  for (const file of wordingFiles) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /Поиск по энциклопедии/i);
  }
});
