import { requireAdminSession } from "@/lib/admin-auth";
import AdminNav from "./_components/AdminNav";
import { logoutAction } from "./actions";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-slate-800">
          <p className="text-sm font-medium leading-tight">Офтальмо Энциклопедия</p>
          <p className="text-xs text-slate-400 mt-0.5">Админ-панель</p>
        </div>

        <AdminNav />

        <div className="mt-auto px-4 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 truncate mb-2">{session.email}</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs text-slate-300 hover:text-white transition-colors"
            >
              Выйти →
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
