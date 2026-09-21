import test from "node:test";
import assert from "node:assert/strict";
import {
  createRawSecret,
  hashSecret,
  normalizeEmail,
} from "./auth-security";

test("normalizeEmail trims and normalizes the participant email", () => {
  assert.equal(normalizeEmail("  Person@Example.COM "), "person@example.com");
});

test("created secrets are high entropy and hash-only values are deterministic", () => {
  const raw = createRawSecret();
  assert.ok(raw.length >= 40);
  assert.notEqual(raw, hashSecret(raw));
  assert.equal(hashSecret(raw), hashSecret(raw));
});

test("different secrets never share a hash", () => {
  const first = createRawSecret();
  const second = createRawSecret();
  assert.notEqual(first, second);
  assert.notEqual(hashSecret(first), hashSecret(second));
});
