import "server-only";

import { getPrisma } from "@/lib/prisma";
import { evidenceValidatedContentWhere } from "@/lib/publication-gate";

export async function getAppealFormConfiguration() {
  const db = getPrisma();
  if (!db) return { investigations: [], consent: null };

  const [investigations, consent] = await Promise.all([
    db.investigation.findMany({
      where: evidenceValidatedContentWhere(),
      orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
      select: { slug: true, title: true },
    }),
    db.appealConsentTemplate.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      select: { id: true, version: true, title: true, body: true, requiresApproval: true },
    }),
  ]);

  return { investigations, consent };
}
