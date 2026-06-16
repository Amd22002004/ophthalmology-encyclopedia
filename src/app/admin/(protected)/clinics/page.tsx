import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Клиники — Админ" };

const CLINIC_TYPE_LABEL: Record<string, string> = {
  centre: "Центр",
  cabinet: "Кабинет",
  mntk: "МНТК",
  clinic: "Клиника",
  oms: "ОМС-точка",
};

export default async function AdminClinicsPage() {
  await requireAdminSession();

  const db = getPrisma();
  const clinics = db
    ? await db.clinic.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          city: true,
          region: true,
          address: true,
          website: true,
          phones: true,
          inn: true,
          license: true,
          omsEnabled: true,
          clinicType: true,
          networkName: true,
          status: true,
        },
        orderBy: [{ status: "asc" }, { title: "asc" }],
      })
    : [];

  const activeCount = clinics.filter((c) => c.status === "active").length;
  const inactiveCount = clinics.filter((c) => c.status === "inactive").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Клиники</h1>
          <p className="text-sm text-gray-400 mt-1">
            Активных: {activeCount} · Неактивных: {inactiveCount}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Город / Регион</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Адрес</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ИНН</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Лицензия</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Тип</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ОМС</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clinics.map((clinic) => (
              <tr
                key={clinic.id}
                className={`hover:bg-gray-50/50 ${clinic.status === "inactive" ? "opacity-50" : ""}`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 max-w-[220px]">{clinic.title}</div>
                  {clinic.networkName && (
                    <div className="text-xs text-gray-400 mt-0.5">{clinic.networkName}</div>
                  )}
                  {clinic.website && (
                    <a
                      href={clinic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      {clinic.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  <div>{clinic.city ?? "—"}</div>
                  <div className="text-xs text-gray-400">{clinic.region ?? ""}</div>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                  <div className="text-xs leading-relaxed">{clinic.address ?? "—"}</div>
                  {clinic.phones && clinic.phones.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {clinic.phones.join(", ")}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                  {clinic.inn ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px]">
                  {clinic.license ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {clinic.clinicType
                    ? (CLINIC_TYPE_LABEL[clinic.clinicType] ?? clinic.clinicType)
                    : "—"}
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
                <td className="px-4 py-3">
                  {clinic.status === "active" ? (
                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      active
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-medium">
                      inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/clinics/${clinic.id}/edit`}
                    className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Ред.
                  </Link>
                </td>
              </tr>
            ))}
            {clinics.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                  Клиники не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {clinics.length > 0 && (
        <p className="mt-3 text-sm text-gray-400">
          Всего: {clinics.length} клиник
        </p>
      )}
    </div>
  );
}
