"use server";

import { getPrisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { saveClinicImage } from "@/lib/clinic-image-storage";
import { revalidatePath } from "next/cache";

export type ClinicUpdateState = { error?: string; success?: boolean };

function str(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function floatOrNull(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function intOrNull(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

function dateOrNull(formData: FormData, key: string): Date | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? null : value;
}

function fileOrNull(formData: FormData, key: string): File | null {
  const file = formData.get(key);
  return file instanceof File && file.size > 0 ? file : null;
}

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

  const existing = await db.clinic.findUnique({
    where: { id: clinicId },
    select: { slug: true, logoUrl: true, coverImageUrl: true, facadeImageUrl: true },
  });
  if (!existing) return { error: "Клиника не найдена" };

  const phones = [
    str(formData, "phone1"),
    str(formData, "phone2"),
    str(formData, "phone3"),
  ].filter((p): p is string => Boolean(p));

  const [logoUrl, coverImageUrl, facadeImageUrl] = await Promise.all([
    saveClinicImage(fileOrNull(formData, "logoFile"), existing.slug, "logo"),
    saveClinicImage(fileOrNull(formData, "coverFile"), existing.slug, "cover"),
    saveClinicImage(fileOrNull(formData, "facadeFile"), existing.slug, "facade"),
  ]);

  await db.clinic.update({
    where: { id: clinicId },
    data: {
      title,
      legalName: str(formData, "legalName"),
      description: str(formData, "description"),
      clinicType: str(formData, "clinicType"),
      networkName: str(formData, "networkName"),
      status: String(formData.get("status") ?? "active").trim() || "active",
      omsEnabled: formData.get("omsEnabled") === "on",

      phones,
      email: str(formData, "email"),
      website: str(formData, "website"),
      appointmentUrl: str(formData, "appointmentUrl"),

      region: str(formData, "region"),
      city: str(formData, "city"),
      address: str(formData, "address"),
      latitude: floatOrNull(formData, "latitude"),
      longitude: floatOrNull(formData, "longitude"),
      mapEmbed: str(formData, "mapEmbed"),

      inn: str(formData, "inn"),
      kpp: str(formData, "kpp"),
      ogrn: str(formData, "ogrn"),
      license: str(formData, "license"),
      licenseDate: dateOrNull(formData, "licenseDate"),
      directorName: str(formData, "directorName"),
      foundedYear: intOrNull(formData, "foundedYear"),

      workingHours: str(formData, "workingHours"),

      vkUrl: str(formData, "vkUrl"),
      telegramUrl: str(formData, "telegramUrl"),
      youtubeUrl: str(formData, "youtubeUrl"),

      seoTitle: str(formData, "seoTitle"),
      seoDescription: str(formData, "seoDescription"),
      seoKeywords: str(formData, "seoKeywords"),

      specializationTags: String(formData.get("specializationTags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),

      ...(logoUrl ? { logoUrl } : {}),
      ...(coverImageUrl ? { coverImageUrl } : {}),
      ...(facadeImageUrl ? { facadeImageUrl } : {}),
    },
  });

  revalidatePath("/admin/clinics");
  revalidatePath("/clinics");
  revalidatePath(`/clinics/${existing.slug}`);

  return { success: true };
}
