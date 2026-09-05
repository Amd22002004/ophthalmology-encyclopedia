import type { Metadata } from "next";
import { completePasswordResetAction } from "./actions";

export const metadata: Metadata = { title: "Новый пароль", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  return <div className="mx-auto max-w-md"><div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Личный кабинет</p><h1 className="mt-3 text-2xl font-semibold tracking-tight">Создать новый пароль</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Пароль должен содержать не менее 12 символов.</p>{error && <p aria-live="polite" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}<form action={completePasswordResetAction.bind(null, token)} className="mt-6 space-y-5"><label className="block text-sm font-medium">Новый пароль<input autoComplete="new-password" className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" minLength={12} name="password" required type="password" /></label><label className="block text-sm font-medium">Повторите пароль<input autoComplete="new-password" className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" minLength={12} name="passwordConfirmation" required type="password" /></label><button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" type="submit">Сохранить пароль</button></form></div></div>;
}
