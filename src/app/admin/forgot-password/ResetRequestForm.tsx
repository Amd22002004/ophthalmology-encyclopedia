"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestAdminPasswordResetAction, type AdminPasswordResetRequestState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="w-full py-2 px-4 bg-slate-900 text-white text-sm font-medium rounded hover:bg-slate-700 disabled:opacity-50 transition-colors" disabled={pending} type="submit">
      {pending ? "Отправляем…" : "Отправить ссылку"}
    </button>
  );
}

export default function ResetRequestForm() {
  const [state, action] = useActionState<AdminPasswordResetRequestState, FormData>(requestAdminPasswordResetAction, {});
  if (state.submitted) {
    return <p aria-live="polite" className="text-sm leading-6 text-gray-600">Если аккаунт существует, письмо со ссылкой уже отправлено. Проверьте почту.</p>;
  }

  return (
    <form action={action} className="space-y-4">
      {state.error ? <p aria-live="polite" className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{state.error}</p> : null}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
      </div>
      <SubmitButton />
    </form>
  );
}
