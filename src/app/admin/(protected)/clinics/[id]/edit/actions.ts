"use server";

import { getPrisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

export type ClinicUpdateState = { error?: string; success?: boolean };

export async function updateClinicAction(
  clinicId: string,
  _prev: ClinicUpdateState,
  formData: FormData,
): Promise<ClinicUpdateState> {
  await requireAdminSession();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Название обязательно" };

  const db = getPrisma();
  if (!db) return { error: "Нет подключения к базе данных" };

  await db.clinic.update({
    where: { id: clinicId },
    data: {
      title,
      region: String(formData.get("region") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      website: String(formData.get("website") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      omsEnabled: formData.get("omsEnabled") === "on",
    },
  });

  revalidatePath("/admin/clinics");
  revalidatePath("/clinics");

  return { success: true };
}
