import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import {
  buildEventRegistrationWhere,
  EVENT_REGISTRATION_STATUS_LABELS,
  EVENT_REGISTRATION_STATUS_VALUES,
  type EventRegistrationStatusValue,
} from "@/lib/events/admin-filters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Конференции — Админ",
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}
function date(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}
const inputClass =
  "h-9 rounded border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);
  const pageSize = 50;
  const filters = {
    query: first(params.query),
    status: first(params.status),
    city: first(params.city),
    specialty: first(params.specialty),
    organization: first(params.organization),
    source: first(params.source),
    utmCampaign: first(params.utmCampaign),
    from: first(params.from),
    to: first(params.to),
  };
  const where = buildEventRegistrationWhere(filters);
  const db = getPrisma();
  if (!db) return <p>Нет подключения к базе данных.</p>;

  const data = await (async () => {
    try {
      return await Promise.all([
        db.event.findMany({
          orderBy: { startsAt: "asc" },
          select: {
            id: true,
            slug: true,
            title: true,
            startsAt: true,
            registrationOpen: true,
            programPublished: true,
            speakersPublished: true,
            _count: {
              select: { speakers: true, talks: true, registrations: true },
            },
          },
        }),
        db.eventRegistration.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            eventId: true,
            publicNumber: true,
            fullName: true,
            phone: true,
            email: true,
            city: true,
            specialty: true,
            organization: true,
            status: true,
            source: true,
            utmCampaign: true,
            createdAt: true,
          },
        }),
        db.eventRegistration.count({ where }),
      ]);
    } catch {
      return null;
    }
  })();
  if (!data) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Event migration ещё не применена к этой локальной базе данных.
      </p>
    );
  }
  const [events, registrations, total] = data;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const queryEntries = Object.entries(filters).filter(([, value]) => value);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Конференции</h1>
          <p className="mt-1 text-sm text-gray-500">
            Операционные события и приватные регистрации · найдено {total}
          </p>
        </div>
        {events[0] ? (
          <Link
            className="rounded border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            href={`/admin/events/${events[0].id}`}
          >
            Открыть редактор
          </Link>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {events.map((event) => (
          <article className="rounded-lg border bg-white p-4" key={event.id}>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {event.registrationOpen
                ? "Регистрация открыта"
                : "Регистрация закрыта"}
            </p>
            <h2 className="mt-2 font-semibold text-gray-900">{event.title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {date(event.startsAt)} · спикеров: {event._count.speakers} · тем:{" "}
              {event._count.talks} · регистраций: {event._count.registrations}
            </p>
            <Link
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              href={`/admin/events/${event.id}`}
            >
              Открыть событие →
            </Link>
          </article>
        ))}
      </div>
      <form className="rounded-lg border bg-white p-4" method="get">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            aria-label="Поиск регистрации"
            className={inputClass}
            defaultValue={filters.query}
            name="query"
            placeholder="Номер, ФИО, email, телефон"
          />
          <select
            aria-label="Статус регистрации"
            className={inputClass}
            defaultValue={filters.status}
            name="status"
          >
            <option value="">Все статусы</option>
            {EVENT_REGISTRATION_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {EVENT_REGISTRATION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <input
            aria-label="Город"
            className={inputClass}
            defaultValue={filters.city}
            name="city"
            placeholder="Город"
          />
          <input
            aria-label="Специализация"
            className={inputClass}
            defaultValue={filters.specialty}
            name="specialty"
            placeholder="Специализация"
          />
          <input
            aria-label="Организация"
            className={inputClass}
            defaultValue={filters.organization}
            name="organization"
            placeholder="Организация"
          />
          <input
            aria-label="Источник"
            className={inputClass}
            defaultValue={filters.source}
            name="source"
            placeholder="Источник"
          />
          <input
            aria-label="UTM campaign"
            className={inputClass}
            defaultValue={filters.utmCampaign}
            name="utmCampaign"
            placeholder="UTM campaign"
          />
          <label className="flex items-center gap-2 text-xs text-gray-500">
            С
            <input
              className={`${inputClass} flex-1`}
              defaultValue={filters.from}
              name="from"
              type="date"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-500">
            По
            <input
              className={`${inputClass} flex-1`}
              defaultValue={filters.to}
              name="to"
              type="date"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded bg-slate-800 px-4 py-2 text-sm text-white"
            type="submit"
          >
            Применить
          </button>
          <Link
            className="rounded border px-4 py-2 text-sm text-gray-600"
            href="/admin/events"
          >
            Сбросить
          </Link>
          {events[0] ? (
            <>
              <a
                className="rounded border px-4 py-2 text-sm text-gray-600"
                href={`/admin/events/${events[0].id}/export?${new URLSearchParams(queryEntries).toString()}`}
              >
                Экспорт CSV
              </a>
              <a
                className="rounded border px-4 py-2 text-sm text-gray-600"
                href={`/admin/events/${events[0].id}/export?${new URLSearchParams([...queryEntries, ["format", "xlsx"]]).toString()}`}
              >
                Экспорт XLSX
              </a>
            </>
          ) : null}
        </div>
      </form>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Номер / дата</th>
              <th className="px-4 py-3">Участник</th>
              <th className="px-4 py-3">Контакты</th>
              <th className="px-4 py-3">Город / источник</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {registrations.map((registration) => (
              <tr
                className="align-top hover:bg-gray-50/60"
                key={registration.id}
              >
                <td className="px-4 py-3">
                  <Link
                    className="font-mono text-xs font-semibold text-slate-800 hover:underline"
                    href={`/admin/events/${registration.eventId}?registration=${registration.id}`}
                  >
                    {registration.publicNumber}
                  </Link>
                  <span className="mt-1 block text-xs text-gray-400">
                    {date(registration.createdAt)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="block font-medium text-gray-900">
                    {registration.fullName}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {registration.organization || "—"}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {registration.specialty || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs leading-5 text-gray-600">
                  <span className="block">{registration.phone}</span>
                  <span className="block">{registration.email}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {registration.city || "—"}
                  <span className="mt-1 block text-gray-400">
                    {registration.source || "WEB"}
                  </span>
                  {registration.utmCampaign ? (
                    <span className="block text-gray-400">
                      {registration.utmCampaign}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {
                      EVENT_REGISTRATION_STATUS_LABELS[
                        registration.status as EventRegistrationStatusValue
                      ]
                    }
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    className="font-medium text-slate-700 hover:underline"
                    href={`/admin/events/${registration.eventId}?registration=${registration.id}`}
                  >
                    Открыть →
                  </Link>
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
              <tr>
                <td
                  className="px-4 py-12 text-center text-gray-400"
                  colSpan={6}
                >
                  Регистрации не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Страница {page} из {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                className="rounded border bg-white px-3 py-2"
                href={`?${new URLSearchParams([...queryEntries, ["page", String(page - 1)]]).toString()}`}
              >
                ← Назад
              </Link>
            )}
            {page < pages && (
              <Link
                className="rounded border bg-white px-3 py-2"
                href={`?${new URLSearchParams([...queryEntries, ["page", String(page + 1)]]).toString()}`}
              >
                Далее →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
