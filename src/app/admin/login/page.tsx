import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Вход — Админ" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border p-8">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Офтальмо Энциклопедия</h1>
          <p className="text-sm text-gray-500 mt-1">Административная панель</p>
        </div>
        {params.reset === "1" ? <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">Пароль обновлён. Войдите с новым паролем.</p> : null}
        <LoginForm />
        <Link className="mt-5 block text-center text-sm text-slate-700 hover:underline" href="/admin/forgot-password">Забыли пароль?</Link>
      </div>
    </div>
  );
}
