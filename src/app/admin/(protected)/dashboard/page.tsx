import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dashboard — Админ" };

export default async function DashboardPage() {
  await requireAdminSession();

  const db = getPrisma();

  const [clinicsCount, doctorsCount, diseasesCount, proceduresCount] =
    await Promise.all([
      db?.clinic.count() ?? 0,
      db?.doctor.count() ?? 0,
      db?.disease.count() ?? 0,
      db?.procedure.count() ?? 0,
    ]);

  const stats = [
    { label: "Клиники", value: clinicsCount },
    { label: "Врачи", value: doctorsCount },
    { label: "Заболевания", value: diseasesCount },
    { label: "Процедуры", value: proceduresCount },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg border p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
