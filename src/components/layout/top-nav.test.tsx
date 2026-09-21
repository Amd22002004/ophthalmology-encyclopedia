import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./top-nav.tsx", import.meta.url), "utf8");

test("top navigation keeps search out of the mobile header", () => {
  assert.match(source, /className="flex h-\[71px\] items-center.*md:h-16/);
  assert.match(source, /<div className="hidden lg:block">\s*<SearchTrigger \/>/);
  assert.match(source, /MobileSidebarToggle/);
  assert.match(source, /AssociationBrand variant="compact"/);
  assert.match(source, /aria-label="Войти в личный кабинет"/);
  assert.match(source, /UserRound/);
});
