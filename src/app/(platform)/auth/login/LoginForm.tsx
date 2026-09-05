"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { participantLoginAction, type ParticipantLoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Входим…" : "Войти"}</button>;
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<ParticipantLoginState, FormData>(participantLoginAction, {});
  return <form action={action} className="space-y-5"><input name="next" type="hidden" value={next} readOnly />{state.error && <p aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{state.error}</p>}<label className="block text-sm font-medium">Email<input autoComplete="email" className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" name="email" required type="email" /></label><label className="block text-sm font-medium">Пароль<input autoComplete="current-password" className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" name="password" required type="password" /></label><SubmitButton /></form>;
}
