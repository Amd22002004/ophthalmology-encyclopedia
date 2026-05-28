import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

function slug(title: string) {
  return title
    .toLowerCase()
    .replace(/[ёе]/g, "e")
    .replace(/[а]/g, "a")
    .replace(/[б]/g, "b")
    .replace(/[в]/g, "v")
    .replace(/[г]/g, "g")
    .replace(/[д]/g, "d")
    .replace(/[ж]/g, "zh")
    .replace(/[з]/g, "z")
    .replace(/[и]/g, "i")
    .replace(/[й]/g, "y")
    .replace(/[к]/g, "k")
    .replace(/[л]/g, "l")
    .replace(/[м]/g, "m")
    .replace(/[н]/g, "n")
    .replace(/[о]/g, "o")
    .replace(/[п]/g, "p")
    .replace(/[р]/g, "r")
    .replace(/[с]/g, "s")
    .replace(/[т]/g, "t")
    .replace(/[у]/g, "u")
    .replace(/[ф]/g, "f")
    .replace(/[х]/g, "kh")
    .replace(/[ц]/g, "ts")
    .replace(/[ч]/g, "ch")
    .replace(/[ш]/g, "sh")
    .replace(/[щ]/g, "shch")
    .replace(/[ъъ]/g, "")
    .replace(/[ы]/g, "y")
    .replace(/[ь]/g, "")
    .replace(/[э]/g, "e")
    .replace(/[ю]/g, "yu")
    .replace(/[я]/g, "ya")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const specialties = [
  "Ретинология",
  "Катарактальная хирургия",
  "Корнеальная хирургия",
  "Глаукома",
  "Нейроофтальмология",
  "Детская офтальмология",
  "Рефракционная хирургия",
  "Онкоофтальмология",
  "Окулопластика",
  "Ургентная офтальмология",
  "Офтальмоонкология",
  "Орбитальная хирургия",
];

const diseaseCategories = [
  { title: "Патология роговицы", description: "Заболевания роговой оболочки глаза" },
  { title: "Патология сетчатки", description: "Заболевания сетчатки и стекловидного тела" },
  { title: "Патология хрусталика", description: "Катаракта и аномалии хрусталика" },
  { title: "Глаукома", description: "Повышение внутриглазного давления и атрофия зрительного нерва" },
  { title: "Патология зрительного нерва", description: "Нейроофтальмологические заболевания" },
  { title: "Воспалительные заболевания", description: "Конъюнктивиты, увеиты, кератиты" },
  { title: "Травмы органа зрения", description: "Механические, химические и термические повреждения" },
  { title: "Врождённые аномалии", description: "Врождённые пороки развития органа зрения" },
  { title: "Опухоли органа зрения", description: "Доброкачественные и злокачественные новообразования" },
  { title: "Нарушения рефракции", description: "Миопия, гиперметропия, астигматизм, пресбиопия" },
  { title: "Патология стекловидного тела", description: "Деструкция и отслойка стекловидного тела" },
  { title: "Орбитальная патология", description: "Заболевания орбиты и слёзных органов" },
  { title: "Нейроофтальмологические нарушения", description: "Нарушения полей зрения и зрительного пути" },
  { title: "Патология слёзных органов", description: "Дакриоцистит и нарушения слёзоотведения" },
];

const procedureCategories = [
  "Диагностические процедуры",
  "Хирургические операции",
  "Лазерные процедуры",
  "Медикаментозное лечение",
  "Ортоптика и плеоптика",
  "Протезирование",
  "Физиотерапия",
  "Рефракционные операции",
  "Витреоретинальные вмешательства",
  "Антиглаукомные операции",
];

const equipmentCategories = [
  "Диагностическое оборудование",
  "Хирургическое оборудование",
  "Лазерные системы",
  "Оптические приборы",
  "Линзы и очковая оптика",
  "Расходные материалы",
  "Фармацевтика",
  "Имплантаты",
  "ИТ-системы для офтальмологии",
];

const regions = [
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Самара",
  "Уфа",
  "Ростов-на-Дону",
  "Красноярск",
  "Пермь",
  "Воронеж",
  "Волгоград",
  "Краснодар",
  "Тюмень",
];

async function main() {
  console.log("Seeding taxonomy...");

  for (const title of specialties) {
    await db.specialty.upsert({
      where: { slug: slug(title) },
      update: { title },
      create: { slug: slug(title), title },
    });
  }
  console.log(`✓ ${specialties.length} specialties`);

  for (const { title, description } of diseaseCategories) {
    await db.diseaseCategory.upsert({
      where: { slug: slug(title) },
      update: { title, description },
      create: { slug: slug(title), title, description },
    });
  }
  console.log(`✓ ${diseaseCategories.length} disease categories`);

  for (const title of procedureCategories) {
    await db.procedureCategory.upsert({
      where: { slug: slug(title) },
      update: { title },
      create: { slug: slug(title), title },
    });
  }
  console.log(`✓ ${procedureCategories.length} procedure categories`);

  for (const title of equipmentCategories) {
    await db.equipmentCategory.upsert({
      where: { slug: slug(title) },
      update: { title },
      create: { slug: slug(title), title },
    });
  }
  console.log(`✓ ${equipmentCategories.length} equipment categories`);

  for (const title of regions) {
    await db.region.upsert({
      where: { slug: slug(title) },
      update: { title },
      create: { slug: slug(title), title },
    });
  }
  console.log(`✓ ${regions.length} regions`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
