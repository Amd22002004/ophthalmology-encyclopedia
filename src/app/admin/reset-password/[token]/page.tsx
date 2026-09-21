import type { Metadata } from "next";
import { completeAdminPasswordResetAction } from "./actions";

export const metadata: Metadata = {
  title: "Новый пароль — Админ",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border p-8">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Новый пароль</h1>
          <p className="text-sm text-gray-500 mt-1">Административная панель</p>
        </div>
        <p className="mb-5 text-sm leading-6 text-gray-600">Пароль должен содержать от 12 до 128 символов. Ссылка действует 45 минут и используется один раз.</p>
        {error ? <p aria-live="polite" className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</p> : null}
        <form action={completeAdminPasswordResetAction.bind(null, token)} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
          <div>
            <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 mb-1">Повторите пароль</label>
            <input id="passwordConfirmation" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
          <button className="w-full py-2 px-4 bg-slate-900 text-white text-sm font-medium rounded hover:bg-slate-700 transition-colors" type="submit">Сохранить пароль</button>
        </form>
      </div>
    </div>
  );
}
