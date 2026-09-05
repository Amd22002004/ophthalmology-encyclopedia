import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  getAppealFileRule,
  safeOriginalFileName,
  validateAppealFileDescriptors,
} from "./files";

export type StagedAppealAttachment = {
  displayName: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  securityStatus: "unscanned";
};

export type StagedAppealFiles = {
  attachments: StagedAppealAttachment[];
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
};

export function getAppealUploadRoot() {
  const configured = process.env.APPEAL_UPLOAD_DIR?.trim();
  if (configured) {
    if (!path.isAbsolute(configured)) {
      throw new Error("APPEAL_UPLOAD_DIR must be an absolute path");
    }
    return path.normalize(configured);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("APPEAL_UPLOAD_DIR is required in production");
  }
  return path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "appeals");
}

export function resolveAppealStorageKey(storageKey: string) {
  const root = getAppealUploadRoot();
  const normalizedKey = path.normalize(storageKey);
  if (
    path.isAbsolute(normalizedKey) ||
    normalizedKey === ".." ||
    normalizedKey.startsWith(`..${path.sep}`)
  ) {
    throw new Error("Invalid appeal storage key");
  }
  return path.join(/*turbopackIgnore: true*/ root, normalizedKey);
}

export async function stageAppealFiles(
  appealId: string,
  files: File[],
): Promise<StagedAppealFiles> {
  if (files.length === 0) {
    return { attachments: [], commit: async () => undefined, rollback: async () => undefined };
  }

  const buffers = await Promise.all(files.map(async (file) => Buffer.from(await file.arrayBuffer())));
  const validation = validateAppealFileDescriptors(
    files.map((file, index) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      head: buffers[index].subarray(0, 16),
    })),
  );
  if (!validation.success) throw new AppealFileError(validation.error);

  const root = getAppealUploadRoot();
  const stagingDir = path.join(root, ".staging", appealId);
  const finalDir = path.join(root, appealId);
  await fs.mkdir(stagingDir, { recursive: true, mode: 0o700 });

  const attachments: StagedAppealAttachment[] = [];
  try {
    for (const [index, file] of files.entries()) {
      const rule = getAppealFileRule(file.name)!;
      const storedName = `${randomUUID()}.${rule.extension}`;
      await fs.writeFile(path.join(stagingDir, storedName), buffers[index], { mode: 0o600 });
      attachments.push({
        displayName: `Приложение ${index + 1} — ${rule.label}`,
        originalFileName: safeOriginalFileName(file.name),
        storageKey: `${appealId}/${storedName}`,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        sha256: createHash("sha256").update(buffers[index]).digest("hex"),
        securityStatus: "unscanned",
      });
    }
  } catch (error) {
    await fs.rm(stagingDir, { recursive: true, force: true });
    throw error;
  }

  return {
    attachments,
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

export class AppealFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppealFileError";
  }
}
