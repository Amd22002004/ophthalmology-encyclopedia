import assert from "node:assert/strict";
import test from "node:test";
import { createCooperationApplicationNumber } from "./reference";

test("cooperation application number uses the AOK year and six-digit sequence", () => {
  assert.equal(
    createCooperationApplicationNumber(new Date("2026-08-21T00:00:00.000Z"), 127),
    "AOK-2026-000127",
  );
});
