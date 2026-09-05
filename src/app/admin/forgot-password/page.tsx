import type { Metadata } from "next";
import Link from "next/link";
import ResetRequestForm from "./ResetRequestForm";

export const metadata: Metadata = {
  title: "Восстановление доступа — Админ",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border p-8">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Восстановление доступа</h1>
          <p className="text-sm text-gray-500 mt-1">Административная панель</p>
        </div>
        <p className="mb-5 text-sm leading-6 text-gray-600">Введите email администратора. Если аккаунт существует, мы отправим одноразовую ссылку.</p>
        <ResetRequestForm />
        <Link className="mt-5 inline-block text-sm text-slate-700 hover:underline" href="/admin/login">Вернуться ко входу</Link>
      </div>
    </div>
  );
}
