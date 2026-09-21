import { promises as fs } from "node:fs";
import { requireAdminSession } from "@/lib/admin-auth";
import { resolveAppealStorageKey } from "@/lib/appeals/storage";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

function contentDisposition(filename: string) {
  const encoded = encodeURIComponent(filename).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="attachment"; filename*=UTF-8''${encoded}`;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string; attachmentId: string }> }) {
  await requireAdminSession();
  const { id, attachmentId } = await context.params;
  const db = getPrisma();
  if (!db) return new Response("Database unavailable", { status: 503 });
  const attachment = await db.appealAttachment.findFirst({
    where: { id: attachmentId, appealId: id },
    select: { storageKey: true, originalFileName: true, mimeType: true },
  });
  if (!attachment) return new Response("Not found", { status: 404 });

  try {
    const file = await fs.open(resolveAppealStorageKey(attachment.storageKey), "r");
    const buffer = await file.readFile().finally(() => file.close());
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Disposition": contentDisposition(attachment.originalFileName),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response("File unavailable", { status: 404 });
  }
}
