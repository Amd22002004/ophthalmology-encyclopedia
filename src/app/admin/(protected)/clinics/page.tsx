import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Клиники — Админ" };

export default async function AdminClinicsPage() {
  await requireAdminSession();

  const db = getPrisma();
  const clinics = db
    ? await db.clinic.findMany({
        include: { regionEntity: true },
        orderBy: { title: "asc" },
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Клиники</h1>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Регион</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Адрес</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Сайт</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ОМС</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clinics.map((clinic) => (
              <tr key={clinic.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-900">{clinic.title}</td>
                <td className="px-4 py-3 text-gray-500">
                  {clinic.region ?? clinic.regionEntity?.title ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">{clinic.address ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">
                  {clinic.website ? (
                    <a
                      href={clinic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline max-w-[180px] block truncate"
                    >
                      {clinic.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  {clinic.omsEnabled ? (
                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                      Да
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/clinics/${clinic.id}/edit`}
                    className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Редактировать
                  </Link>
                </td>
              </tr>
            ))}
            {clinics.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Клиники не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {clinics.length > 0 && (
        <p className="mt-3 text-sm text-gray-400">{clinics.length} клиник</p>
      )}
    </div>
  );
}
