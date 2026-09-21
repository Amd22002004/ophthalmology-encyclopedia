import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  APPEAL_CATEGORY_OPTIONS,
  APPEAL_STATUS_LABELS,
  APPEAL_STATUS_VALUES,
  REPORTER_ROLE_OPTIONS,
  REQUESTED_ACTION_OPTIONS,
  labelsForValues,
  type AppealStatusValue,
} from "@/lib/appeals/constants";
import { getPrisma } from "@/lib/prisma";
import {
  addAppealNoteAction,
  retryAppealNotificationAction,
  updateAppealClassificationAction,
  updateAppealStatusAction,
} from "../actions";

export const metadata: Metadata = { title: "Карточка обращения — Админ" };
export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeStyle: "short" }).format(value);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border bg-white p-5"><h2 className="text-base font-semibold text-gray-900">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-800">{value || "—"}</dd></div>;
}

const controlClass = "w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-slate-400";

export default async function AppealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const db = getPrisma();
  if (!db) return <p>Нет подключения к базе данных.</p>;

  const [appeal, investigations, clinics] = await Promise.all([
    db.appeal.findUnique({
      where: { id },
      include: {
        investigation: { select: { id: true, slug: true, title: true } },
        clinic: { select: { id: true, slug: true, title: true, region: true, city: true } },
        consent: { select: { version: true, title: true, body: true, requiresApproval: true } },
        attachments: { orderBy: { createdAt: "asc" } },
        notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, email: true } } } },
        statusHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { name: true, email: true } } } },
        notifications: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.investigation.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.clinic.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, city: true } }),
  ]);
  if (!appeal) notFound();

  const statusAction = updateAppealStatusAction.bind(null, appeal.id);
  const noteAction = addAppealNoteAction.bind(null, appeal.id);
  const classificationAction = updateAppealClassificationAction.bind(null, appeal.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link className="text-sm text-gray-500 hover:underline" href="/admin/appeals">← Все обращения</Link>
          <h1 className="mt-2 font-mono text-2xl font-semibold text-gray-900">{appeal.publicNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">Зарегистрировано {formatDate(appeal.createdAt)} · обновлено {formatDate(appeal.updatedAt)}</p>
        </div>
        <span className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">{APPEAL_STATUS_LABELS[appeal.status as AppealStatusValue]}</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Section title="Заявитель и контакты">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label="Имя" value={appeal.name} />
              <Fact label="Город" value={appeal.city} />
              <Fact label="Телефон" value={appeal.phone} />
              <Fact label="Email" value={appeal.email} />
            </dl>
          </Section>

          <Section title="Обстоятельства обращения">
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800">{appeal.description}</p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Fact label="Дата операции или лечения" value={appeal.operationDate ? formatDate(appeal.operationDate).split(",")[0] : null} />
              <Fact label="Клиника со слов заявителя" value={appeal.reportedClinicName} />
              <Fact label="Врач со слов заявителя" value={appeal.reportedDoctorName} />
              <Fact label="Оборудование со слов заявителя" value={appeal.reportedEquipmentName} />
            </dl>
          </Section>

          <Section title="Категории и ожидаемые действия">
            <div className="space-y-4 text-sm text-gray-700">
              <div><p className="text-xs font-medium uppercase tracking-wide text-gray-400">Связь с ситуацией</p><ul className="mt-2 list-disc space-y-1 pl-5">{labelsForValues(appeal.reporterRoles, REPORTER_ROLE_OPTIONS).map((label) => <li key={label}>{label}</li>)}</ul></div>
              <div><p className="text-xs font-medium uppercase tracking-wide text-gray-400">Категории</p><ul className="mt-2 list-disc space-y-1 pl-5">{labelsForValues(appeal.categories, APPEAL_CATEGORY_OPTIONS).map((label) => <li key={label}>{label}</li>)}</ul></div>
              <div><p className="text-xs font-medium uppercase tracking-wide text-gray-400">Ожидаемые действия</p><ul className="mt-2 list-disc space-y-1 pl-5">{labelsForValues(appeal.requestedActions, REQUESTED_ACTION_OPTIONS).map((label) => <li key={label}>{label}</li>)}</ul></div>
              <p className={appeal.collectiveInterest ? "font-medium text-amber-800" : "text-gray-500"}>Интерес к коллективному информированию: {appeal.collectiveInterest ? "да" : "нет"}</p>
            </div>
          </Section>

          <Section title={`Вложения (${appeal.attachments.length})`}>
            {appeal.attachments.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-end"><a className="rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" href={`/admin/appeals/${appeal.id}/attachments/export`}>Экспортировать ZIP</a></div>
                {appeal.attachments.map((attachment) => (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded border bg-gray-50 p-3" key={attachment.id}>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{attachment.displayName}</p>
                      <p className="mt-1 break-all text-xs text-gray-500">{attachment.originalFileName} · {(attachment.sizeBytes / 1024 / 1024).toFixed(2)} МБ</p>
                      <p className="mt-1 font-mono text-[11px] text-gray-400">SHA-256: {attachment.sha256}</p>
                      <p className="mt-1 text-xs text-amber-700">Проверка содержимого: {attachment.securityStatus}</p>
                    </div>
                    <a className="rounded bg-slate-800 px-3 py-2 text-sm text-white" href={`/admin/appeals/${appeal.id}/attachments/${attachment.id}`}>Скачать</a>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">Вложения не приложены.</p>}
          </Section>

          <Section title="Внутренние комментарии">
            <form action={noteAction} className="space-y-3">
              <textarea className={`${controlClass} min-h-28`} maxLength={10000} name="text" placeholder="Комментарий доступен только сотрудникам" required />
              <button className="rounded bg-slate-800 px-4 py-2 text-sm text-white" type="submit">Добавить комментарий</button>
            </form>
            <div className="mt-5 space-y-3">
              {appeal.notes.map((note) => <article className="rounded border bg-gray-50 p-3" key={note.id}><p className="whitespace-pre-wrap text-sm leading-6 text-gray-800">{note.text}</p><p className="mt-2 text-xs text-gray-400">{note.author.name} · {formatDate(note.createdAt)}</p></article>)}
              {appeal.notes.length === 0 && <p className="text-sm text-gray-400">Комментариев пока нет.</p>}
            </div>
          </Section>
        </div>

        <aside className="space-y-5">
          <Section title="Статус">
            <form action={statusAction} className="space-y-3">
              <select className={controlClass} defaultValue={appeal.status} name="status">{APPEAL_STATUS_VALUES.map((status) => <option key={status} value={status}>{APPEAL_STATUS_LABELS[status]}</option>)}</select>
              <textarea className={`${controlClass} min-h-20`} maxLength={1000} name="comment" placeholder="Причина изменения (необязательно)" />
              <button className="w-full rounded bg-slate-800 px-4 py-2 text-sm text-white" type="submit">Сохранить статус</button>
            </form>
          </Section>

          <Section title="Классификация">
            <form action={classificationAction} className="space-y-3">
              <label className="block text-xs font-medium text-gray-500">Расследование<select className={`${controlClass} mt-1`} defaultValue={appeal.investigationId || ""} name="investigationId"><option value="">Без расследования</option>{investigations.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
              <label className="block text-xs font-medium text-gray-500">Клиника<select className={`${controlClass} mt-1`} defaultValue={appeal.clinicId || ""} name="clinicId"><option value="">Не классифицировано</option>{clinics.map((item) => <option key={item.id} value={item.id}>{item.title}{item.city ? ` — ${item.city}` : ""}</option>)}</select></label>
              <button className="w-full rounded border bg-white px-4 py-2 text-sm text-gray-700" type="submit">Сохранить связи</button>
            </form>
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              {appeal.investigation && <Link className="block text-blue-600 hover:underline" href={`/investigations/${appeal.investigation.slug}`} target="_blank">Открыть расследование ↗</Link>}
              {appeal.clinic && <Link className="block text-blue-600 hover:underline" href={`/clinics/${appeal.clinic.slug}`} target="_blank">Открыть клинику ↗</Link>}
            </div>
          </Section>

          <Section title="Email-копия">
            {appeal.notifications.map((notification) => (
              <div className="mb-3 rounded border bg-gray-50 p-3 text-xs leading-5 text-gray-600" key={notification.id}>
                <p><strong>Статус:</strong> {notification.status}</p><p><strong>Получатель:</strong> {notification.recipient || "не настроен"}</p><p><strong>Попыток:</strong> {notification.attempts}</p><p><strong>Отправлено:</strong> {formatDate(notification.sentAt)}</p>{notification.lastError && <p className="mt-1 break-words text-red-700">{notification.lastError}</p>}
                {notification.status !== "SENT" && <form action={retryAppealNotificationAction.bind(null, notification.id, appeal.id)} className="mt-2"><button className="rounded border bg-white px-2 py-1 text-xs" type="submit">Повторить отправку</button></form>}
              </div>
            ))}
          </Section>

          <Section title="История статусов">
            <ol className="space-y-3 border-l pl-4">
              {appeal.statusHistory.map((event) => <li className="text-xs leading-5 text-gray-600" key={event.id}><p className="font-medium text-gray-900">{event.fromStatus ? `${APPEAL_STATUS_LABELS[event.fromStatus]} → ` : ""}{APPEAL_STATUS_LABELS[event.toStatus]}</p><p>{formatDate(event.createdAt)}</p>{event.changedBy && <p>{event.changedBy.name}</p>}{event.comment && <p className="mt-1 text-gray-500">{event.comment}</p>}</li>)}
            </ol>
          </Section>

          <Section title="Согласие">
            <p className="text-xs text-gray-500">Версия: {appeal.consent.version}<br />Принято: {formatDate(appeal.consentAcceptedAt)}<br />Требует утверждения: {appeal.consent.requiresApproval ? "да" : "нет"}</p>
            <details className="mt-3"><summary className="cursor-pointer text-xs font-medium text-gray-700">Показать текст версии</summary><pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-[11px] leading-5 text-gray-600">{appeal.consent.body}</pre></details>
          </Section>
        </aside>
      </div>
    </div>
  );
}

