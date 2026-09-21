import assert from "node:assert/strict";
import test from "node:test";
import { buildAdminResetErrorPath } from "./admin-reset-flow";

test("admin reset error redirect encodes non-ASCII query text", () => {
  const path = buildAdminResetErrorPath("test-token", "Ссылка недействительна");

  assert.equal(
    path,
    `/admin/reset-password/test-token?error=${encodeURIComponent("Ссылка недействительна")}`,
  );
  assert.match(path, /^[\x00-\x7F]*$/u);
});
