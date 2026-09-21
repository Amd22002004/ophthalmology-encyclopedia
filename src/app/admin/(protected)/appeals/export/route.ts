import type { Prisma } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  APPEAL_CATEGORY_OPTIONS,
  APPEAL_STATUS_LABELS,
  REPORTER_ROLE_OPTIONS,
  REQUESTED_ACTION_OPTIONS,
  labelsForValues,
  type AppealStatusValue,
} from "@/lib/appeals/constants";
import { buildAppealWhereInput } from "@/lib/appeals/filters";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  await requireAdminSession();
  const db = getPrisma();
  if (!db) return new Response("Database unavailable", { status: 503 });
  const url = new URL(request.url);
  const where = buildAppealWhereInput({
    status: url.searchParams.get("status"),
    investigationId: url.searchParams.get("investigationId"),
    clinicId: url.searchParams.get("clinicId"),
    clinic: url.searchParams.get("clinic"),
    doctor: url.searchParams.get("doctor"),
    equipment: url.searchParams.get("equipment"),
    region: url.searchParams.get("region"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    query: url.searchParams.get("query"),
  }) as Prisma.AppealWhereInput;

  const appeals = await db.appeal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10_000,
    include: {
      investigation: { select: { title: true } },
      clinic: { select: { title: true, region: true } },
      _count: { select: { attachments: true, notes: true } },
    },
  });

  const header = ["Номер", "Дата", "Статус", "Расследование", "Клиника (классификация)", "Клиника со слов заявителя", "Регион/город", "Имя", "Телефон", "Email", "Врач со слов заявителя", "Оборудование со слов заявителя", "Связь с ситуацией", "Категории", "Ожидаемые действия", "Коллективное информирование", "Вложений", "Комментариев", "Текст обращения"];
  const rows = appeals.map((appeal) => [
    appeal.publicNumber,
    appeal.createdAt.toISOString(),
    APPEAL_STATUS_LABELS[appeal.status as AppealStatusValue],
    appeal.investigation?.title,
    appeal.clinic?.title,
    appeal.reportedClinicName,
    appeal.clinic?.region || appeal.city,
    appeal.name,
    appeal.phone,
    appeal.email,
    appeal.reportedDoctorName,
    appeal.reportedEquipmentName,
    labelsForValues(appeal.reporterRoles, REPORTER_ROLE_OPTIONS).join("; "),
    labelsForValues(appeal.categories, APPEAL_CATEGORY_OPTIONS).join("; "),
    labelsForValues(appeal.requestedActions, REQUESTED_ACTION_OPTIONS).join("; "),
    appeal.collectiveInterest ? "Да" : "Нет",
    appeal._count.attachments,
    appeal._count.notes,
    appeal.description,
  ]);
  const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="appeals-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
