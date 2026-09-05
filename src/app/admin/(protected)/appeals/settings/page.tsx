import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { activateConsentTemplateAction } from "../actions";

export const metadata: Metadata = { title: "Согласие обращений — Админ" };
export const dynamic = "force-dynamic";

export default async function AppealSettingsPage() {
  await requireAdminSession();
  const db = getPrisma();
  const templates = db ? await db.appealConsentTemplate.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { appeals: true } } } }) : [];
  const controlClass = "w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-slate-400";

  return (
    <div className="space-y-5">
      <div><Link className="text-sm text-gray-500 hover:underline" href="/admin/appeals">← Обращения</Link><h1 className="mt-2 text-2xl font-semibold text-gray-900">Шаблоны согласия</h1><p className="mt-1 text-sm text-gray-500">Новая версия активируется без изменения кода. Использованные версии не редактируются.</p></div>
      <section className="rounded-lg border bg-white p-5">
        <h2 className="font-semibold text-gray-900">Активировать новую версию</h2>
        <form action={activateConsentTemplateAction} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-gray-700">Версия<input className={`${controlClass} mt-1`} name="version" placeholder="approved-2026-01" required /></label>
          <label className="block text-sm font-medium text-gray-700">Название<input className={`${controlClass} mt-1`} name="title" required /></label>
          <label className="block text-sm font-medium text-gray-700">Текст<textarea className={`${controlClass} mt-1 min-h-80 font-mono text-xs leading-5`} name="body" required /></label>
          <label className="flex items-start gap-2 text-sm text-gray-700"><input className="mt-1" defaultChecked name="requiresApproval" type="checkbox" /> Версия ещё требует юридического утверждения</label>
          <button className="rounded bg-slate-800 px-4 py-2 text-sm text-white" type="submit">Создать и активировать</button>
        </form>
      </section>
      <section className="rounded-lg border bg-white p-5"><h2 className="font-semibold text-gray-900">История версий</h2><div className="mt-4 space-y-3">{templates.map((template) => <article className="rounded border bg-gray-50 p-3" key={template.id}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-sm font-semibold">{template.version}</p><span className={`rounded px-2 py-1 text-xs ${template.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>{template.isActive ? "Активна" : "Архив"}</span></div><p className="mt-1 text-sm text-gray-700">{template.title}</p><p className="mt-1 text-xs text-gray-500">Обращений с этой версией: {template._count.appeals} · требует утверждения: {template.requiresApproval ? "да" : "нет"}</p><details className="mt-2"><summary className="cursor-pointer text-xs text-gray-600">Текст</summary><pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-gray-600">{template.body}</pre></details></article>)}</div></section>
    </div>
  );
}

