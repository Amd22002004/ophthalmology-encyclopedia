import type { Prisma } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { buildEventRegistrationWhere } from "@/lib/events/admin-filters";
import { buildEventRegistrationXlsx, eventRegistrationExportRow, EVENT_REGISTRATION_EXPORT_COLUMNS } from "@/lib/events/registration-export";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  await requireAdminSession();
  const db = getPrisma();
  if (!db) return new Response("Database unavailable", { status: 503 });
  const { eventId } = await params;
  const url = new URL(request.url);
  const where = {
    eventId,
    ...buildEventRegistrationWhere({
      status: url.searchParams.get("status") || "",
      city: url.searchParams.get("city") || "",
      specialty: url.searchParams.get("specialty") || "",
      organization: url.searchParams.get("organization") || "",
      source: url.searchParams.get("source") || "",
      utmCampaign: url.searchParams.get("utmCampaign") || "",
      from: url.searchParams.get("from") || "",
      to: url.searchParams.get("to") || "",
      query: url.searchParams.get("query") || "",
    }),
  } satisfies Prisma.EventRegistrationWhereInput;
  const registrations = await db.eventRegistration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10_000,
    select: {
      publicNumber: true,
      createdAt: true,
      status: true,
      fullName: true,
      phone: true,
      email: true,
      specialty: true,
      customSpecialty: true,
      organization: true,
      position: true,
      city: true,
      comment: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmContent: true,
      source: true,
      updatedAt: true,
    },
  });
  const rows = registrations.map(eventRegistrationExportRow);
  if (url.searchParams.get("format") === "xlsx") {
    const workbook = await buildEventRegistrationXlsx(registrations);
    return new Response(new Uint8Array(workbook), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="event-registrations-${eventId}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  const csv = `\uFEFF${[EVENT_REGISTRATION_EXPORT_COLUMNS as readonly string[], ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-registrations-${eventId}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
