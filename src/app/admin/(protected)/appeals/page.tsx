import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { APPEAL_STATUS_LABELS, APPEAL_STATUS_VALUES, type AppealStatusValue } from "@/lib/appeals/constants";
import { buildAppealWhereInput } from "@/lib/appeals/filters";
import { getPrisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Обращения — Админ" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(value);
}

const inputClass = "h-9 rounded border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-slate-400";

export default async function AdminAppealsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdminSession();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);
  const pageSize = 50;
  const filters = {
    status: first(params.status),
    investigationId: first(params.investigationId),
    clinicId: first(params.clinicId),
    clinic: first(params.clinic),
    doctor: first(params.doctor),
    equipment: first(params.equipment),
    region: first(params.region),
    from: first(params.from),
    to: first(params.to),
    query: first(params.query),
  };
  const where = buildAppealWhereInput(filters) as Prisma.AppealWhereInput;
  const db = getPrisma();
  if (!db) return <p>Нет подключения к базе данных.</p>;

  const [appeals, total, investigations, clinics] = await Promise.all([
    db.appeal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        publicNumber: true,
        name: true,
        city: true,
        status: true,
        collectiveInterest: true,
        reportedClinicName: true,
        reportedDoctorName: true,
        reportedEquipmentName: true,
        createdAt: true,
        investigation: { select: { title: true } },
        clinic: { select: { title: true } },
        _count: { select: { attachments: true, notes: true } },
        notifications: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
      },
    }),
    db.appeal.count({ where }),
    db.investigation.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.clinic.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, city: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const exportQuery = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Обращения</h1>
          <p className="mt-1 text-sm text-gray-500">Приватный реестр доказательных материалов · найдено {total}</p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded border bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" href="/admin/appeals/settings">Настройки согласия</Link>
          <a className="rounded bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700" href={`/admin/appeals/export${exportQuery ? `?${exportQuery}` : ""}`}>Экспорт CSV</a>
        </div>
      </div>

      <form className="rounded-lg border bg-white p-4" method="get">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input className={inputClass} defaultValue={filters.query} name="query" placeholder="Номер, имя, телефон, текст" />
          <select className={inputClass} defaultValue={filters.status} name="status">
            <option value="">Все статусы</option>
            {APPEAL_STATUS_VALUES.map((status) => <option key={status} value={status}>{APPEAL_STATUS_LABELS[status]}</option>)}
          </select>
          <select className={inputClass} defaultValue={filters.investigationId} name="investigationId">
            <option value="">Все расследования</option>
            {investigations.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <select className={inputClass} defaultValue={filters.clinicId} name="clinicId">
            <option value="">Все классифицированные клиники</option>
            {clinics.map((item) => <option key={item.id} value={item.id}>{item.title}{item.city ? ` — ${item.city}` : ""}</option>)}
          </select>
          <input className={inputClass} defaultValue={filters.clinic} name="clinic" placeholder="Клиника со слов заявителя" />
          <input className={inputClass} defaultValue={filters.doctor} name="doctor" placeholder="Поиск по врачу" />
          <input className={inputClass} defaultValue={filters.equipment} name="equipment" placeholder="Поиск по оборудованию" />
          <input className={inputClass} defaultValue={filters.region} name="region" placeholder="Регион или город" />
          <label className="flex items-center gap-2 text-xs text-gray-500">С <input className={`${inputClass} flex-1`} defaultValue={filters.from} name="from" type="date" /></label>
          <label className="flex items-center gap-2 text-xs text-gray-500">По <input className={`${inputClass} flex-1`} defaultValue={filters.to} name="to" type="date" /></label>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="rounded bg-slate-800 px-4 py-2 text-sm text-white" type="submit">Применить</button>
          <Link className="rounded border px-4 py-2 text-sm text-gray-600" href="/admin/appeals">Сбросить</Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Номер / дата</th>
              <th className="px-4 py-3">Заявитель</th>
              <th className="px-4 py-3">Расследование / клиника</th>
              <th className="px-4 py-3">Указанные сведения</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Материалы</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {appeals.map((appeal) => (
              <tr className="align-top hover:bg-gray-50/60" key={appeal.id}>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-gray-900">{appeal.publicNumber}</span>
                  <span className="mt-1 block text-xs text-gray-400">{formatDate(appeal.createdAt)}</span>
                </td>
                <td className="px-4 py-3"><span className="font-medium text-gray-900">{appeal.name}</span><span className="mt-1 block text-xs text-gray-500">{appeal.city || "Город не указан"}</span></td>
                <td className="max-w-[260px] px-4 py-3 text-xs leading-5 text-gray-600">
                  <span className="block">{appeal.investigation?.title || "Без расследования"}</span>
                  <span className="mt-1 block text-gray-400">{appeal.clinic?.title || appeal.reportedClinicName || "Клиника не указана"}</span>
                </td>
                <td className="max-w-[220px] px-4 py-3 text-xs leading-5 text-gray-500">
                  {appeal.reportedDoctorName && <span className="block">Врач: {appeal.reportedDoctorName}</span>}
                  {appeal.reportedEquipmentName && <span className="block">Оборудование: {appeal.reportedEquipmentName}</span>}
                  {appeal.collectiveInterest && <span className="mt-1 block font-medium text-amber-700">Коллективное информирование</span>}
                </td>
                <td className="px-4 py-3"><span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{APPEAL_STATUS_LABELS[appeal.status as AppealStatusValue]}</span><span className="mt-2 block text-xs text-gray-400">Email: {appeal.notifications[0]?.status || "—"}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">Файлов: {appeal._count.attachments}<br />Комментариев: {appeal._count.notes}</td>
                <td className="px-4 py-3 text-right"><Link className="font-medium text-slate-700 hover:underline" href={`/admin/appeals/${appeal.id}`}>Открыть →</Link></td>
              </tr>
            ))}
            {appeals.length === 0 && <tr><td className="px-4 py-12 text-center text-gray-400" colSpan={7}>Обращения не найдены</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Страница {page} из {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link className="rounded border bg-white px-3 py-2" href={`?${new URLSearchParams({ ...filters, page: String(page - 1) }).toString()}`}>← Назад</Link>}
            {page < pages && <Link className="rounded border bg-white px-3 py-2" href={`?${new URLSearchParams({ ...filters, page: String(page + 1) }).toString()}`}>Далее →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}

