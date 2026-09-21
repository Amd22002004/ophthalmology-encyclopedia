import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import {
  EVENT_REGISTRATION_STATUS_LABELS,
  EVENT_REGISTRATION_STATUS_VALUES,
  type EventRegistrationStatusValue,
} from "@/lib/events/admin-filters";
import {
  addEventRegistrationNoteAction,
  retryEventRegistrationNotificationAction,
  updateEventRegistrationAction,
  updateEventRegistrationStatusAction,
  updateEventTalkAction,
} from "./actions";
import { parseGoogleSheetsConfig } from "@/lib/events/google-sheets";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Редактор конференции — Админ",
  robots: { index: false, follow: false },
};

function date(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
function dateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 16) : "";
}
function value(text: string | null | undefined) {
  return text || "—";
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 py-2.5 text-sm last:border-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-gray-800">
        {children}
      </dd>
    </div>
  );
}

export default async function AdminEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();
  const { eventId } = await params;
  const query = await searchParams;
  const selectedRegistrationId =
    typeof query.registration === "string" ? query.registration : "";
  const db = getPrisma();
  if (!db) return <p>Нет подключения к базе данных.</p>;

  let event;
  try {
    event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { registrations: true } },
        speakers: {
          orderBy: { order: "asc" },
          include: {
            doctor: {
              select: {
                slug: true,
                firstName: true,
                lastName: true,
                middleName: true,
              },
            },
          },
        },
        talks: {
          orderBy: { sortOrder: "asc" },
          include: { speaker: { select: { fullNameSnapshot: true } } },
        },
        consentTemplates: {
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            version: true,
            title: true,
            isActive: true,
            requiresApproval: true,
            updatedAt: true,
          },
        },
      },
    });
  } catch {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Event migration ещё не применена к этой локальной базе данных.
      </p>
    );
  }
  if (!event) notFound();

  const registration = selectedRegistrationId
    ? await db.eventRegistration.findFirst({
        where: { id: selectedRegistrationId, eventId },
        include: {
          consent: { select: { version: true, title: true } },
          statusHistory: {
            orderBy: { createdAt: "desc" },
            include: { changedBy: { select: { name: true } } },
          },
          notes: {
            orderBy: { createdAt: "desc" },
            include: { author: { select: { name: true } } },
          },
          notifications: { orderBy: { createdAt: "asc" } },
        },
      })
    : null;
  const googleSheetsEnabled = parseGoogleSheetsConfig().enabled;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            className="text-sm text-gray-500 hover:underline"
            href="/admin/events"
          >
            ← Все конференции
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">
            {event.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {event.city} · {date(event.startsAt)} · регистраций:{" "}
            {event._count?.registrations ?? "—"}
          </p>
        </div>
        <span className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
          {event.registrationOpen
            ? "Регистрация открыта"
            : "Регистрация закрыта"}
        </span>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-5">
          <Section title="Публикация и регистрация">
            <form
              action={updateEventRegistrationAction.bind(null, event.id)}
              className="grid gap-3 text-sm"
            >
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="programPublished"
                  value="true"
                  defaultChecked={event.programPublished}
                />{" "}
                Программа опубликована
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="speakersPublished"
                  value="true"
                  defaultChecked={event.speakersPublished}
                />{" "}
                Спикеры опубликованы
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="registrationOpen"
                  value="true"
                  defaultChecked={event.registrationOpen}
                />{" "}
                Регистрация открыта
              </label>
              <p className="text-xs leading-5 text-gray-500">
                Открытие регистрации разрешено только при активном утверждённом
                EventConsentTemplate без флага requiresApproval.
              </p>
              <button
                className="w-fit rounded bg-slate-800 px-3 py-2 text-sm text-white"
                type="submit"
              >
                Сохранить состояние
              </button>
            </form>
          </Section>
          <Section title="Утверждённые спикеры">
            <div className="space-y-3">
              {event.speakers.map((speaker) => (
                <article className="rounded border p-3" key={speaker.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500">
                        #{speaker.order} ·{" "}
                        {speaker.published ? "опубликован" : "скрыт"}
                      </p>
                      <h3 className="mt-1 font-semibold text-gray-900">
                        {speaker.fullNameSnapshot}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {speaker.credentialsSnapshot}
                      </p>
                      {speaker.organizationRole ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {speaker.organizationRole}
                        </p>
                      ) : null}
                    </div>
                    {speaker.doctor ? (
                      <Link
                        className="text-xs text-primary hover:underline"
                        href={`/doctors/${speaker.doctor.slug}`}
                        target="_blank"
                      >
                        Doctor ↗
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </Section>
          <Section title="Редактор программы">
            <div className="space-y-4">
              {event.talks.map((talk) => (
                <form
                  action={updateEventTalkAction.bind(null, event.id, talk.id)}
                  className="rounded border p-4"
                  key={talk.id}
                >
                  <div className="grid gap-3 md:grid-cols-[80px_minmax(0,1fr)_160px]">
                    <label className="grid gap-1 text-xs text-gray-500">
                      Порядок
                      <input
                        className="h-9 rounded border px-2 text-sm text-gray-900"
                        name="sortOrder"
                        type="number"
                        min="1"
                        defaultValue={talk.sortOrder}
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-gray-500">
                      Тема
                      <input
                        className="h-9 rounded border px-2 text-sm text-gray-900"
                        name="title"
                        required
                        defaultValue={talk.title}
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-gray-500">
                      Тип
                      <select
                        className="h-9 rounded border px-2 text-sm text-gray-900"
                        name="kind"
                        defaultValue={talk.kind}
                      >
                        <option value="TALK">Доклад</option>
                        <option value="BREAK">Перерыв</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1 text-xs text-gray-500">
                      Начало
                      <input
                        className="h-9 rounded border px-2 text-sm text-gray-900"
                        name="startAt"
                        type="datetime-local"
                        defaultValue={dateInput(talk.startAt)}
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-gray-500">
                      Окончание
                      <input
                        className="h-9 rounded border px-2 text-sm text-gray-900"
                        name="endAt"
                        type="datetime-local"
                        defaultValue={dateInput(talk.endAt)}
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-gray-500 md:col-span-2">
                      Модератор
                      <input
                        className="h-9 rounded border px-2 text-sm text-gray-900"
                        name="moderatorSnapshot"
                        defaultValue={talk.moderatorSnapshot || ""}
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="published"
                        value="true"
                        defaultChecked={talk.published}
                      />{" "}
                      Опубликован
                    </label>
                    <span className="text-xs text-gray-500">
                      {talk.speaker?.fullNameSnapshot || "Без спикера"}
                    </span>
                    <button
                      className="rounded border px-3 py-2 text-sm font-medium text-gray-700"
                      type="submit"
                    >
                      Сохранить тему
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </Section>
        </main>
        <aside className="space-y-5">
          {registration ? (
            <>
              <Section title={`Регистрация ${registration.publicNumber}`}>
                <dl>
                  <Row label="ФИО">{registration.fullName}</Row>
                  <Row label="Телефон">{registration.phone}</Row>
                  <Row label="Email">{registration.email}</Row>
                  <Row label="Город / организация">
                    {[registration.city, registration.organization]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </Row>
                  <Row label="Специализация">
                    {registration.customSpecialty || registration.specialty}
                  </Row>
                  <Row label="Должность">{value(registration.position)}</Row>
                  <Row label="Комментарий">{value(registration.comment)}</Row>
                  <Row label="Согласие">
                    {registration.consent.version} ·{" "}
                    {date(registration.consentAcceptedAt)}
                  </Row>
                  <Row label="Создана">{date(registration.createdAt)}</Row>
                </dl>
              </Section>
              <Section title="Статус">
                <form
                  action={updateEventRegistrationStatusAction.bind(
                    null,
                    registration.id,
                    event.id,
                  )}
                  className="space-y-3"
                >
                  <select
                    className="h-10 w-full rounded border bg-white px-3 text-sm"
                    name="status"
                    defaultValue={registration.status}
                  >
                    {EVENT_REGISTRATION_STATUS_VALUES.map((status) => (
                      <option key={status} value={status}>
                        {EVENT_REGISTRATION_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className="min-h-20 w-full rounded border px-3 py-2 text-sm"
                    name="comment"
                    placeholder="Комментарий перехода"
                  />
                  <button
                    className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-white"
                    type="submit"
                  >
                    Сохранить статус
                  </button>
                </form>
              </Section>
              <Section title="История статусов">
                <ol className="space-y-3">
                  {registration.statusHistory.map((item) => (
                    <li
                      className="border-l-2 border-primary/30 pl-3"
                      key={item.id}
                    >
                      <p className="text-sm font-medium">
                        {
                          EVENT_REGISTRATION_STATUS_LABELS[
                            item.toStatus as EventRegistrationStatusValue
                          ]
                        }
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {date(item.createdAt)} ·{" "}
                        {item.changedBy?.name || "Система"}
                      </p>
                      {item.comment ? (
                        <p className="mt-1 text-sm text-gray-700">
                          {item.comment}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </Section>
              <Section title="Внутренние заметки">
                {registration.notes.length ? (
                  <div className="space-y-3">
                    {registration.notes.map((note) => (
                      <article
                        className="rounded border bg-gray-50 p-3"
                        key={note.id}
                      >
                        <p className="whitespace-pre-wrap text-sm">
                          {note.text}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {note.author.name} · {date(note.createdAt)}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Заметок пока нет.</p>
                )}
                <form
                  action={addEventRegistrationNoteAction.bind(
                    null,
                    registration.id,
                    event.id,
                  )}
                  className="mt-4 space-y-2"
                >
                  <textarea
                    className="min-h-24 w-full rounded border px-3 py-2 text-sm"
                    name="text"
                    required
                    placeholder="Только для внутренней обработки"
                  />
                  <button
                    className="rounded border px-3 py-2 text-sm font-medium text-gray-700"
                    type="submit"
                  >
                    Добавить заметку
                  </button>
                </form>
              </Section>
              <Section title="Уведомления outbox">
                {registration.notifications.map((notification) => (
                  <div
                    className="border-b py-3 last:border-0"
                    key={notification.id}
                  >
                    <p className="text-sm font-medium">
                      {notification.channel === "TELEGRAM"
                        ? "Telegram"
                        : notification.channel === "GOOGLE_SHEETS"
                        ? "Google Sheets"
                        : notification.kind === "APPLICANT"
                        ? "Участнику"
                        : "Ассоциации"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {notification.channel === "GOOGLE_SHEETS"
                        ? googleSheetsEnabled ? "включено" : "отключено"
                        : notification.recipient || "Получатель не настроен"} ·{" "}
                      {notification.status}
                    </p>
                    {notification.lastError ? (
                      <p className="mt-1 text-xs text-red-600">
                        {notification.lastError}
                      </p>
                    ) : null}
                    {((notification.channel === "EMAIL") || (notification.channel === "GOOGLE_SHEETS" && googleSheetsEnabled)) && notification.status !== "SENT" ? (
                      <form
                        action={retryEventRegistrationNotificationAction.bind(
                          null,
                          notification.id,
                          event.id,
                        )}
                      >
                        <button
                          className="mt-2 text-xs font-medium text-primary hover:underline"
                          type="submit"
                        >
                          Повторить отправку
                        </button>
                      </form>
                    ) : null}
                  </div>
                ))}
              </Section>
            </>
          ) : (
            <Section title="Регистрация">
              <p className="text-sm text-gray-500">
                Выберите регистрацию в списке, чтобы открыть приватные данные и
                операционные действия.
              </p>
            </Section>
          )}
          <Section title="Consent templates">
            {event.consentTemplates.length ? (
              <ul className="space-y-2 text-sm">
                {event.consentTemplates.map((template) => (
                  <li className="rounded border p-3" key={template.id}>
                    <p className="font-medium">{template.version}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {template.isActive ? "активен" : "черновик"} ·{" "}
                      {template.requiresApproval
                        ? "требует утверждения"
                        : "утверждён"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Шаблон согласия ещё не создан.
              </p>
            )}
          </Section>
        </aside>
      </div>
    </div>
  );
}
