import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const FIELDS: { key: keyof Awaited<ReturnType<typeof loadClinics>>[number]; label: string }[] = [
  { key: "legalName", label: "Юр. наименование" },
  { key: "address", label: "Адрес" },
  { key: "phones", label: "Телефоны" },
  { key: "email", label: "Email" },
  { key: "website", label: "Сайт" },
  { key: "inn", label: "ИНН" },
  { key: "kpp", label: "КПП" },
  { key: "ogrn", label: "ОГРН" },
  { key: "license", label: "Лицензия" },
  { key: "licenseDate", label: "Дата лицензии" },
  { key: "clinicType", label: "Тип филиала" },
  { key: "networkName", label: "Сеть" },
  { key: "workingHours", label: "График работы" },
  { key: "directorName", label: "Руководитель" },
  { key: "latitude", label: "Координаты (lat/lng)" },
  { key: "logoUrl", label: "Логотип" },
  { key: "coverImageUrl", label: "Фото клиники" },
  { key: "facadeImageUrl", label: "Фото фасада" },
  { key: "appointmentUrl", label: "Ссылка записи" },
  { key: "vkUrl", label: "VK / TG / YouTube" },
  { key: "foundedYear", label: "Год основания" },
  { key: "seoTitle", label: "SEO Title" },
  { key: "seoDescription", label: "SEO Description" },
  { key: "seoKeywords", label: "SEO Keywords" },
];

function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

async function loadClinics(db: PrismaClient) {
  return db.clinic.findMany({
    where: { status: "active" },
    select: {
      slug: true,
      title: true,
      legalName: true,
      address: true,
      phones: true,
      email: true,
      website: true,
      inn: true,
      kpp: true,
      ogrn: true,
      license: true,
      licenseDate: true,
      clinicType: true,
      networkName: true,
      workingHours: true,
      directorName: true,
      latitude: true,
      longitude: true,
      logoUrl: true,
      coverImageUrl: true,
      facadeImageUrl: true,
      appointmentUrl: true,
      vkUrl: true,
      telegramUrl: true,
      youtubeUrl: true,
      foundedYear: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
    },
    orderBy: { title: "asc" },
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });

  const clinics = await loadClinics(db);
  const total = clinics.length;

  console.log(`\n=== Отчёт по заполненности данных клиник (активных: ${total}) ===\n`);

  const missingByClinic = new Map<string, string[]>();

  console.log("Поле                      | Заполнено | %");
  console.log("--------------------------|-----------|------");
  for (const { key, label } of FIELDS) {
    let filled = 0;
    for (const clinic of clinics) {
      let value: unknown = clinic[key];
      // VK/TG/YouTube считаем заполненным, если есть хотя бы одна из соцсетей
      if (key === "vkUrl") {
        value = clinic.vkUrl || clinic.telegramUrl || clinic.youtubeUrl;
      }
      // Координаты — должны быть заполнены обе
      if (key === "latitude") {
        value = clinic.latitude != null && clinic.longitude != null ? clinic.latitude : null;
      }
      if (isFilled(value)) {
        filled += 1;
      } else {
        const list = missingByClinic.get(clinic.slug) ?? [];
        list.push(label);
        missingByClinic.set(clinic.slug, list);
      }
    }
    const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
    console.log(`${label.padEnd(26)}| ${String(filled).padStart(9)} | ${pct}%`);
  }

  console.log("\n=== Клиники с незаполненными полями ===\n");
  for (const clinic of clinics) {
    const missing = missingByClinic.get(clinic.slug) ?? [];
    if (missing.length === 0) {
      console.log(`✓ ${clinic.title} (${clinic.slug}) — все поля заполнены`);
    } else {
      console.log(`✗ ${clinic.title} (${clinic.slug}) — не заполнено: ${missing.join(", ")}`);
    }
  }

  console.log("");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
