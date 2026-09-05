import type { Metadata } from "next";
import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { getInvitationByToken, invitationIsUsable } from "@/lib/invitations";
import { getParticipantUser } from "@/lib/participant-auth";
import { acceptExistingInvitationAction, acceptForCurrentUserAction, acceptNewInvitationAction } from "./actions";

export const metadata: Metadata = { title: "Приглашение в личный кабинет", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function FormField({ label, name, type = "text", autoComplete, minLength }: { label: string; name: string; type?: string; autoComplete?: string; minLength?: number }) {
  return <label className="block text-sm font-medium">{label}<input autoComplete={autoComplete} className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" minLength={minLength} name={name} required type={type} /></label>;
}

export default async function InvitationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  const invitation = await getInvitationByToken(token);
  if (!invitation || !invitationIsUsable(invitation)) return <div className="mx-auto max-w-xl rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><h1 className="text-2xl font-semibold">Приглашение недействительно</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Ссылка истекла, была отозвана или уже использована. Обратитесь в Ассоциацию для повторной отправки.</p><Link className="mt-5 inline-block text-sm text-primary hover:underline" href="/auth/login">Перейти ко входу</Link></div>;

  const db = getPrisma();
  const existingAccount = db ? await db.user.findUnique({ where: { email: invitation.invitedEmail }, select: { id: true } }) : null;
  const currentUser = await getParticipantUser();
  const currentMatches = currentUser?.email === invitation.invitedEmail;
  const entity = invitation.application.entityMatch?.doctor ? `профилю врача ${[invitation.application.entityMatch.doctor.lastName, invitation.application.entityMatch.doctor.firstName].filter(Boolean).join(" ")}` : invitation.application.entityMatch?.clinic ? `профилю клиники «${invitation.application.entityMatch.clinic.title}»` : "заявке на сотрудничество";

  return <div className="mx-auto max-w-xl"><div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Ассоциация офтальмологических клиник</p><h1 className="mt-3 text-2xl font-semibold tracking-tight">Приглашение в личный кабинет</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Это приглашение относится к {entity}. После принятия кабинет покажет только подтверждённые связи с публичными профилями.</p>{error && <p aria-live="polite" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}{currentMatches ? <form action={acceptForCurrentUserAction.bind(null, token)} className="mt-6"><button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" type="submit">Принять приглашение</button></form> : existingAccount ? <div className="mt-6"><p className="text-sm text-muted-foreground">Для этого email уже существует аккаунт. Войдите в него, чтобы принять приглашение.</p><form action={acceptExistingInvitationAction.bind(null, token)} className="mt-5 space-y-5"><FormField autoComplete="email" label="Email" name="email" type="email" /><FormField autoComplete="current-password" label="Пароль" name="password" type="password" /><button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" type="submit">Войти и принять</button></form></div> : <form action={acceptNewInvitationAction.bind(null, token)} className="mt-6 space-y-5"><FormField autoComplete="name" label="Имя для кабинета" name="displayName" /><FormField autoComplete="new-password" label="Пароль" name="password" type="password" minLength={12} /><FormField autoComplete="new-password" label="Повторите пароль" name="passwordConfirmation" type="password" minLength={12} /><p className="text-xs leading-5 text-muted-foreground">Email приглашения подтверждён ссылкой и будет использован для входа.</p><button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" type="submit">Создать кабинет и принять</button></form>}</div></div>;
}
