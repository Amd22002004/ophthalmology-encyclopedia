import assert from "node:assert/strict";
import test from "node:test";
import { getEventEmailHeaders } from "./registration-sender";

test("event email uses the approved sender identity and reply address", () => {
  assert.deepEqual(getEventEmailHeaders("aok@oftalmologia.pro"), {
    from: "Ассоциация офтальмологических клиник <aok@oftalmologia.pro>",
    replyTo: "aok@oftalmologia.pro",
    envelope: { from: "aok@oftalmologia.pro" },
  });
});
