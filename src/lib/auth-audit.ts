import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "./prisma";

export async function recordAuthAudit(
  data: Prisma.AuthAuditEventUncheckedCreateInput,
) {
  const db = getPrisma();
  if (!db) return;
  await db.authAuditEvent.create({ data });
}

export async function recordAuthAuditInTransaction(
  transaction: Prisma.TransactionClient,
  data: Prisma.AuthAuditEventUncheckedCreateInput,
) {
  await transaction.authAuditEvent.create({ data });
}
