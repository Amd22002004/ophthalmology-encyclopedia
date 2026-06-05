import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import ClinicEditForm from "./ClinicEditForm";

export const metadata: Metadata = { title: "Редактировать клинику — Админ" };

export default async function ClinicEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();

  const { id } = await params;
  const db = getPrisma();
  if (!db) notFound();

  const clinic = await db.clinic.findUnique({ where: { id } });
  if (!clinic) notFound();

  return (
    <div className="max-w-2xl">
      <nav className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin/clinics" className="text-gray-400 hover:text-gray-600">
          Клиники
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 truncate max-w-xs">{clinic.title}</span>
      </nav>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Редактировать клинику
      </h1>

      <div className="bg-white rounded-lg border p-6">
        <ClinicEditForm clinic={clinic} />
      </div>
    </div>
  );
}
