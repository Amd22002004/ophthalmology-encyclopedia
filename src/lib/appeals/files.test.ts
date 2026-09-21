import assert from "node:assert/strict";
import test from "node:test";
import { validateAppealFileDescriptors } from "./files";

test("принимает PDF с согласованными расширением, MIME и сигнатурой", () => {
  const result = validateAppealFileDescriptors([
    {
      name: "document.pdf",
      type: "application/pdf",
      size: 1024,
      head: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
    },
  ]);

  assert.equal(result.success, true);
});

test("отклоняет исполняемый формат", () => {
  const result = validateAppealFileDescriptors([
    {
      name: "payload.exe",
      type: "application/octet-stream",
      size: 128,
      head: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]),
    },
  ]);

  assert.equal(result.success, false);
  if (result.success) return;
  assert.match(result.error, /не поддерживается/i);
});

test("отклоняет PNG с подменённой сигнатурой", () => {
  const result = validateAppealFileDescriptors([
    {
      name: "image.png",
      type: "image/png",
      size: 128,
      head: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]),
    },
  ]);

  assert.equal(result.success, false);
  if (result.success) return;
  assert.match(result.error, /содержимое файла/i);
});

test("отклоняет превышение суммарного лимита", () => {
  const pdfHead = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
  const result = validateAppealFileDescriptors([
    { name: "one.pdf", type: "application/pdf", size: 25 * 1024 * 1024, head: pdfHead },
    { name: "two.pdf", type: "application/pdf", size: 20 * 1024 * 1024, head: pdfHead },
  ]);

  assert.equal(result.success, false);
  if (result.success) return;
  assert.match(result.error, /общий размер/i);
});

