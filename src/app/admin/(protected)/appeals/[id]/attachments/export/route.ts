import { ZipArchive, type ArchiverError } from "archiver";
import { promises as fs } from "node:fs";
import { PassThrough } from "node:stream";
import { requireAdminSession } from "@/lib/admin-auth";
import { resolveAppealStorageKey } from "@/lib/appeals/storage";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

function archiveName(index: number, filename: string) {
  const safe = filename.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0, 180) || "attachment";
  return `${String(index + 1).padStart(2, "0")}-${safe}`;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await context.params;
  const db = getPrisma();
  if (!db) return new Response("Database unavailable", { status: 503 });
  const appeal = await db.appeal.findUnique({
    where: { id },
    select: {
      publicNumber: true,
      attachments: { orderBy: { createdAt: "asc" }, select: { storageKey: true, originalFileName: true, sha256: true, sizeBytes: true } },
    },
  });
  if (!appeal || appeal.attachments.length === 0) return new Response("Attachments not found", { status: 404 });

  const output = new PassThrough();
  const chunks: Buffer[] = [];
  output.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<void>((resolve, reject) => {
    output.on("end", resolve);
    output.on("error", reject);
  });
  const archive = new ZipArchive({ zlib: { level: 6 } });
  archive.on("warning", (error: ArchiverError) => { if (error.code !== "ENOENT") output.destroy(error); });
  archive.on("error", (error: ArchiverError) => output.destroy(error));
  archive.pipe(output);

  const manifest = ["Файл;Размер;SHA-256"];
  for (const [index, attachment] of appeal.attachments.entries()) {
    const name = archiveName(index, attachment.originalFileName);
    const file = await fs.open(resolveAppealStorageKey(attachment.storageKey), "r");
    const buffer = await file.readFile().finally(() => file.close());
    archive.append(buffer, { name });
    manifest.push(`"${name.replace(/"/g, '""')}";${attachment.sizeBytes};${attachment.sha256}`);
  }
  archive.append(`\uFEFF${manifest.join("\r\n")}`, { name: "manifest.csv" });
  await archive.finalize();
  await completed;

  return new Response(new Uint8Array(Buffer.concat(chunks)), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${appeal.publicNumber}-attachments.zip"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
