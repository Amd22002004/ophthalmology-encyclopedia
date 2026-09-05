import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_PASSWORD_RESET_TTL_MS } from "./admin-password-reset-constants";

test("admin password reset token TTL is within the required 30-60 minute window", () => {
  assert.ok(ADMIN_PASSWORD_RESET_TTL_MS >= 30 * 60 * 1_000);
  assert.ok(ADMIN_PASSWORD_RESET_TTL_MS <= 60 * 60 * 1_000);
});
