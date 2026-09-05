import type { Metadata } from "next";
import Link from "next/link";
import { ResetRequestForm } from "./ResetRequestForm";

export const metadata: Metadata = { title: "Восстановление пароля", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return <div className="mx-auto max-w-md"><div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Личный кабинет</p><h1 className="mt-3 text-2xl font-semibold tracking-tight">Восстановить пароль</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Введите email аккаунта. Мы отправим ссылку, если такой аккаунт существует.</p><div className="mt-6"><ResetRequestForm /></div><Link className="mt-5 inline-block text-sm text-primary hover:underline" href="/auth/login">Вернуться ко входу</Link></div></div>;
}
