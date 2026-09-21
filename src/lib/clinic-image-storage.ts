import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  getClinicUploadRoot as getClinicUploadRootFromConfig,
  resolveClinicImagePath,
} from "./clinic-image-storage-core";

export { getClinicUploadRootFromConfig as getClinicUploadRoot, resolveClinicImagePath };

const IMAGE_EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function saveClinicImage(
  file: File | null,
  slug: string,
  prefix: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = IMAGE_EXT_BY_TYPE[file.type] ?? "jpg";
  const filename = `${prefix}-${Date.now()}.${ext}`;
  const root = getClinicUploadRootFromConfig(process.env.CLINIC_UPLOAD_DIR, process.env.NODE_ENV);
  const filePath = resolveClinicImagePath(root, slug, filename);

  await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o755 });
  await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()), { mode: 0o644 });

  return `/uploads/clinics/${slug}/${filename}`;
}
