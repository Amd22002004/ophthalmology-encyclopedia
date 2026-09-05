import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { validateCooperationAttachmentDescriptor } from "./files-core";

export { validateCooperationAttachmentDescriptor } from "./files-core";

export function getCooperationUploadRoot() {
  const configured = process.env.COOPERATION_UPLOAD_DIR?.trim() || (process.env.APPEAL_UPLOAD_DIR?.trim() ? path.join(process.env.APPEAL_UPLOAD_DIR.trim(), "cooperation") : "");
  if (configured) {
    if (!path.isAbsolute(configured)) throw new Error("COOPERATION_UPLOAD_DIR must be an absolute path");
    return path.normalize(configured);
  }
  if (process.env.NODE_ENV === "production") throw new Error("COOPERATION_UPLOAD_DIR is required in production");
  return path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "cooperation");
}

export function resolveCooperationStorageKey(storageKey: string) {
  const normalized = path.normalize(storageKey);
  if (path.isAbsolute(normalized) || normalized === ".." || normalized.startsWith(`..${path.sep}`)) {
    throw new Error("Недопустимый путь вложения");
  }
  return path.join(/*turbopackIgnore: true*/ getCooperationUploadRoot(), normalized);
}

function safeOriginalName(name: string) {
  return name.replace(/[\u0000-\u001f\\/]+/g, "_").slice(0, 180) || "attachment";
}

export type StagedCooperationAttachment = {
  displayName: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
};

export async function stageCooperationAttachment(applicationId: string, file: File | null) {
  if (!file || file.size === 0) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateCooperationAttachmentDescriptor({ name: file.name, type: file.type, size: file.size, head: buffer.subarray(0, 16) });
  if (!validation.success) throw new CooperationFileError(validation.error);

  const root = getCooperationUploadRoot();
  const stagingDir = path.join(root, ".staging", applicationId);
  const finalDir = path.join(root, applicationId);
  await fs.mkdir(stagingDir, { recursive: true, mode: 0o700 });
  const storedName = `${randomUUID()}.${validation.extension}`;
  await fs.writeFile(path.join(stagingDir, storedName), buffer, { mode: 0o600 });

  const attachment: StagedCooperationAttachment = {
    displayName: `Вложение — ${validation.label}`,
    originalName: safeOriginalName(file.name),
    storageKey: `${applicationId}/${storedName}`,
    mimeType: validation.mime,
    sizeBytes: file.size,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };

  return {
    attachment,
    commit: async () => {
      await fs.mkdir(root, { recursive: true, mode: 0o700 });
      await fs.rename(stagingDir, finalDir);
    },
    rollback: async () => {
      await Promise.all([
        fs.rm(stagingDir, { recursive: true, force: true }),
        fs.rm(finalDir, { recursive: true, force: true }),
      ]);
    },
  };
}

export class CooperationFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CooperationFileError";
  }
}
