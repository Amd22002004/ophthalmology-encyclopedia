import assert from "node:assert/strict";
import test from "node:test";
import { createAppealPublicNumber } from "./reference";

test("формирует неперсональный публичный номер с датой и случайным суффиксом", () => {
  const value = createAppealPublicNumber(
    new Date("2026-08-07T10:00:00.000Z"),
    new Uint8Array([10, 11, 12, 13, 14, 15]),
  );

  assert.equal(value, "AO-20260807-0A0B0C0D0E0F");
  assert.match(createAppealPublicNumber(new Date("2026-08-07T10:00:00.000Z")), /^AO-20260807-[0-9A-F]{12}$/);
});
