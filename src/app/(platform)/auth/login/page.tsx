import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Вход в личный кабинет",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParticipantLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/cabinet";
  return <div className="mx-auto max-w-md space-y-5"><div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Личный кабинет</p><h1 className="mt-3 text-2xl font-semibold tracking-tight">Войти в кабинет</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Используйте email, на который Ассоциация отправила приглашение.</p><div className="mt-6"><LoginForm next={next} /></div><div className="mt-5 flex flex-wrap justify-between gap-3 text-sm"><Link className="text-primary hover:underline" href="/auth/forgot-password">Забыли пароль?</Link><Link className="text-muted-foreground hover:text-foreground" href="/cooperation">Подать заявку</Link></div></div></div>;
}
