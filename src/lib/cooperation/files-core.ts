import { COOPERATION_ATTACHMENT_MAX_BYTES } from "./constants";

const ALLOWED = new Map([
  ["pdf", { label: "PDF", mime: "application/pdf" }],
  ["docx", { label: "DOCX", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }],
]);

function extension(name: string) {
  return name.toLowerCase().split(".").pop() ?? "";
}

export function validateCooperationAttachmentDescriptor(input: {
  name: string;
  type: string;
  size: number;
  head: Uint8Array;
}) {
  const ext = extension(input.name);
  const rule = ALLOWED.get(ext);
  if (!rule) return { success: false as const, error: "Разрешены только PDF и DOCX" };
  const maxBytes = Number.parseInt(process.env.COOPERATION_ATTACHMENT_MAX_BYTES ?? "", 10) || COOPERATION_ATTACHMENT_MAX_BYTES;
  if (input.size <= 0 || input.size > maxBytes) return { success: false as const, error: "Файл превышает допустимый размер" };
  const isPdf = ext === "pdf" && Buffer.from(input.head).subarray(0, 5).toString() === "%PDF-";
  const isDocx = ext === "docx" && Buffer.from(input.head).subarray(0, 2).toString() === "PK";
  if (!isPdf && !isDocx) return { success: false as const, error: "Содержимое файла не соответствует расширению" };
  if (input.type && input.type !== rule.mime && input.type !== "application/octet-stream") {
    return { success: false as const, error: "Недопустимый MIME-тип файла" };
  }
  return { success: true as const, extension: ext as "pdf" | "docx", label: rule.label, mime: rule.mime };
}
