import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { resolveCooperationStorageKey } from "@/lib/cooperation/files";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const db = getPrisma();
  if (!db) return NextResponse.json({ error: "Нет подключения к базе данных" }, { status: 503 });
  const attachment = await db.cooperationApplicationAttachment.findUnique({ where: { applicationId: id } });
  if (!attachment) return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  try {
    const body = new Uint8Array(await fs.readFile(resolveCooperationStorageKey(attachment.storageKey)));
    return new NextResponse(body, { headers: { "Content-Type": attachment.mimeType, "Content-Length": String(body.byteLength), "Content-Disposition": `attachment; filename="${attachment.originalName.replace(/["\\\r\n]/g, "_")}"`, "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Файл недоступен" }, { status: 404 }); }
}
