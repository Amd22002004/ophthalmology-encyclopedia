import test from "node:test";
import assert from "node:assert/strict";
import { invitationIsUsable } from "./invitations";

const future = new Date("2030-01-01T00:00:00.000Z");

test("an invitation is usable only before expiry and before use or revoke", () => {
  assert.equal(invitationIsUsable({ expiresAt: new Date("2030-01-02"), usedAt: null, revokedAt: null }, future), true);
  assert.equal(invitationIsUsable({ expiresAt: new Date("2030-01-02"), usedAt: new Date("2029-12-31"), revokedAt: null }, future), false);
  assert.equal(invitationIsUsable({ expiresAt: new Date("2030-01-02"), usedAt: null, revokedAt: new Date("2029-12-31") }, future), false);
  assert.equal(invitationIsUsable({ expiresAt: new Date("2029-12-31"), usedAt: null, revokedAt: null }, future), false);
});
