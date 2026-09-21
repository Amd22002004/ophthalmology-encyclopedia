import path from "node:path";

export const MAX_APPEAL_FILES = 10;
export const MAX_APPEAL_FILE_SIZE = 30 * 1024 * 1024;
export const MAX_APPEAL_TOTAL_SIZE = 40 * 1024 * 1024;

export type AppealFileDescriptor = {
  name: string;
  type: string;
  size: number;
  head: Uint8Array;
};

export type FileRule = {
  extension: string;
  mimeTypes: readonly string[];
  signature: (head: Uint8Array) => boolean;
  label: string;
};

function startsWith(head: Uint8Array, bytes: number[]) {
  return bytes.every((byte, index) => head[index] === byte);
}

const zipSignature = (head: Uint8Array) =>
  startsWith(head, [0x50, 0x4b, 0x03, 0x04]) ||
  startsWith(head, [0x50, 0x4b, 0x05, 0x06]) ||
  startsWith(head, [0x50, 0x4b, 0x07, 0x08]);

const FILE_RULES: Record<string, FileRule> = {
  pdf: {
    extension: "pdf",
    mimeTypes: ["application/pdf", "application/octet-stream", ""],
    signature: (head) => startsWith(head, [0x25, 0x50, 0x44, 0x46, 0x2d]),
    label: "PDF",
  },
  doc: {
    extension: "doc",
    mimeTypes: ["application/msword", "application/octet-stream", ""],
    signature: (head) => startsWith(head, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
    label: "DOC",
  },
  docx: {
    extension: "docx",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/octet-stream",
      "",
    ],
    signature: zipSignature,
    label: "DOCX",
  },
  jpg: {
    extension: "jpg",
    mimeTypes: ["image/jpeg", "application/octet-stream", ""],
    signature: (head) => startsWith(head, [0xff, 0xd8, 0xff]),
    label: "JPEG",
  },
  jpeg: {
    extension: "jpeg",
    mimeTypes: ["image/jpeg", "application/octet-stream", ""],
    signature: (head) => startsWith(head, [0xff, 0xd8, 0xff]),
    label: "JPEG",
  },
  png: {
    extension: "png",
    mimeTypes: ["image/png", "application/octet-stream", ""],
    signature: (head) => startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    label: "PNG",
  },
  zip: {
    extension: "zip",
    mimeTypes: ["application/zip", "application/x-zip-compressed", "application/octet-stream", ""],
    signature: zipSignature,
    label: "ZIP",
  },
};

export type AppealFileValidationResult =
  | { success: true; rules: FileRule[] }
  | { success: false; error: string };

export function getAppealFileRule(filename: string) {
  const extension = path.extname(filename).slice(1).toLowerCase();
  return FILE_RULES[extension] ?? null;
}

export function validateAppealFileDescriptors(
  files: AppealFileDescriptor[],
): AppealFileValidationResult {
  if (files.length > MAX_APPEAL_FILES) {
    return { success: false, error: `Можно приложить не более ${MAX_APPEAL_FILES} файлов` };
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_APPEAL_TOTAL_SIZE) {
    return { success: false, error: "Общий размер вложений превышает 40 МБ" };
  }

  const rules: FileRule[] = [];
  for (const file of files) {
    const rule = getAppealFileRule(file.name);
    if (!rule) return { success: false, error: `Формат файла «${file.name}» не поддерживается` };
    if (file.size <= 0) return { success: false, error: `Файл «${file.name}» пуст` };
    if (file.size > MAX_APPEAL_FILE_SIZE) {
      return { success: false, error: `Файл «${file.name}» превышает 30 МБ` };
    }
    if (!rule.mimeTypes.includes(file.type.toLowerCase())) {
      return { success: false, error: `Тип файла «${file.name}» не соответствует допустимому формату` };
    }
    if (!rule.signature(file.head)) {
      return { success: false, error: `Содержимое файла «${file.name}» не соответствует его расширению` };
    }
    rules.push(rule);
  }

  return { success: true, rules };
}

export function safeOriginalFileName(filename: string) {
  const base = path.basename(filename).replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return base.slice(0, 240) || "Приложение";
}
