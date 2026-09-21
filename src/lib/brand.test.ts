import assert from "node:assert/strict";
import test from "node:test";
import { siteName } from "./seo";

test("SEO site identity is the association while encyclopedia remains a project", () => {
  assert.equal(siteName, "Ассоциация офтальмологических клиник");
});
