"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordResetAction, type PasswordResetRequestState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60" disabled={pending} type="submit">{pending ? "Отправляем…" : "Отправить ссылку"}</button>;
}

export function ResetRequestForm() {
  const [state, action] = useActionState<PasswordResetRequestState, FormData>(requestPasswordResetAction, {});
  if (state.submitted) return <p aria-live="polite" className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-6 text-foreground">Если аккаунт с таким email существует, письмо со ссылкой уже отправлено. Проверьте почту.</p>;
  return <form action={action} className="space-y-5">{state.error && <p aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{state.error}</p>}<label className="block text-sm font-medium">Email<input autoComplete="email" className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" name="email" required type="email" /></label><SubmitButton /></form>;
}
