import assert from "node:assert/strict";
import test from "node:test";
import { validateCooperationAttachmentDescriptor } from "./files-core";

test("accepts a PDF cooperation attachment", () => {
  const result = validateCooperationAttachmentDescriptor({
    name: "presentation.pdf",
    type: "application/pdf",
    size: 1_024,
    head: Buffer.from("%PDF-1.7"),
  });

  assert.equal(result.success, true);
});

test("rejects an executable disguised as a cooperation attachment", () => {
  const result = validateCooperationAttachmentDescriptor({
    name: "presentation.pdf",
    type: "application/pdf",
    size: 1_024,
    head: Buffer.from("MZ\u0000\u0000"),
  });

  assert.equal(result.success, false);
});
