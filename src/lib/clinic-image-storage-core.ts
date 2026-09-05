import path from "node:path";

export function getClinicUploadRoot(
  configured: string | undefined,
  nodeEnv: string | undefined,
  cwd = process.cwd(),
) {
  const value = configured?.trim();
  if (value) {
    if (!path.isAbsolute(value)) {
      throw new Error("CLINIC_UPLOAD_DIR must be an absolute path");
    }
    return path.normalize(value);
  }

  if (nodeEnv === "production") {
    throw new Error("CLINIC_UPLOAD_DIR is required in production");
  }

  return path.join(cwd, ".data", "clinic-uploads");
}

function assertSafePathSegment(value: string, label: string) {
  if (
    !value ||
    value === "." ||
    value === ".." ||
    value.includes("\u0000") ||
    value.includes("/") ||
    value.includes("\\")
  ) {
    throw new Error(`Invalid clinic image ${label}`);
  }
}

export function resolveClinicImagePath(root: string, slug: string, filename: string) {
  assertSafePathSegment(slug, "slug");
  assertSafePathSegment(filename, "filename");

  const clinicDir = path.resolve(root, "clinics", slug);
  const filePath = path.resolve(clinicDir, filename);
  if (!filePath.startsWith(`${clinicDir}${path.sep}`)) {
    throw new Error("Invalid clinic image path");
  }
  return filePath;
}
