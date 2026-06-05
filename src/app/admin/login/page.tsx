import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Вход — Админ" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border p-8">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Офтальмо Энциклопедия</h1>
          <p className="text-sm text-gray-500 mt-1">Административная панель</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
