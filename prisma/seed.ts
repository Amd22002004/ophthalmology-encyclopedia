import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

function slug(text: string) {
  return text
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
    .replace(/[ъ]/g, "")
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

// ─── Мастер-датасет клиник ────────────────────────────────────────────────────

type ClinicSeed = {
  slug: string;
  title: string;
  legalName?: string;
  city: string;
  region: string;
  clinicType: string;   // centre | cabinet | mntk | clinic | oms
  networkName?: string;
  status: string;       // active | inactive
  omsEnabled: boolean;
  phones: string[];
  email?: string;
  website?: string;
  address: string;
  inn: string;
  license: string;
  logoUrl?: string;
};

const CLINICS: ClinicSeed[] = [
  // ── 1. Тюмень: Центр Визус-1 ─────────────────────────────────────────────
  {
    slug: "vizus1-tyumen",
    title: "Центр микрохирургии глаза «Визус-1»",
    city: "Тюмень",
    region: "Тюменская область",
    clinicType: "centre",
    networkName: "Визус-1",
    status: "active",
    omsEnabled: false,
    phones: ["8 (3452) 309-500"],
    email: "reg.vizus1@mail.ru",
    website: "https://vizus1.ru",
    address: "Тюмень, ул. Тимирязева, д.130",
    inn: "7202137064",
    license: "ЛО-72-01-003284 от 16.01.2020",
  },

  // ── 2. Тюмень: Офтальмологический центр Визус-1 ──────────────────────────
  {
    slug: "vizus1-tyumen-oftalmo",
    title: "Офтальмологический центр «Визус-1»",
    city: "Тюмень",
    region: "Тюменская область",
    clinicType: "centre",
    networkName: "Визус-1",
    status: "active",
    omsEnabled: false,
    phones: ["8 (3452) 517-013", "8 (3452) 517-015"],
    email: "ocviz@mail.ru",
    website: "https://oftalmo72.ru",
    address: "Тюмень, Московский тракт, 14",
    inn: "7202236001",
    license: "Л041-01107-72/00337579",
  },

  // ── 3. Тюмень: Визус-1 ОМС ───────────────────────────────────────────────
  {
    slug: "vizus1-tyumen-oms",
    title: "«Визус-1» (ОМС)",
    city: "Тюмень",
    region: "Тюменская область",
    clinicType: "oms",
    networkName: "Визус-1",
    status: "active",
    omsEnabled: true,
    phones: ["8 (3452) 517-013", "8 (3452) 363-506", "8 (3452) 363-507"],
    email: "bilvizus1@bk.ru",
    website: "https://tmn.vizus1.tilda.ws",
    address: "Тюмень, Московский тракт, 14",
    inn: "7203119597",
    license: "ЛО-72-01-001542 от 02.06.2014",
  },

  // ── 4. Курган ─────────────────────────────────────────────────────────────
  {
    slug: "vizus1-kurgan",
    title: "Центр микрохирургии глаза «Визус-1»",
    city: "Курган",
    region: "Курганская область",
    clinicType: "centre",
    networkName: "Визус-1",
    status: "active",
    omsEnabled: true,
    phones: ["8 (3522) 48-39-39"],
    email: "vizus-1kurgan@mail.ru",
    website: "https://vizus-kurgan.ru",
    address: "Курган, ул. Красина, 76",
    inn: "4501227507",
    license: "Л041-01141-45/00555829 от 09.03.2021",
  },

  // ── 5. Сургут ─────────────────────────────────────────────────────────────
  {
    slug: "vizus1-surgut",
    title: "Офтальмологический центр «Визус-1»",
    city: "Сургут",
    region: "ХМАО — Югра",
    clinicType: "centre",
    networkName: "Визус-1",
    status: "active",
    omsEnabled: false,
    phones: ["8 (3462) 940-140", "8 (3462) 940-001"],
    email: "vizus1@bk.ru",
    website: "https://vizus1.info",
    address: "Сургут, ул. Ивана Захарова, 4",
    inn: "8602255931",
    license: "Л041-01193-86/00300625 от 24.08.2015",
  },

  // ── 6. Нижневартовск ──────────────────────────────────────────────────────
  {
    slug: "vizus1-nizhnevartovsk",
    title: "Центр микрохирургии глаза «Визус-1»",
    city: "Нижневартовск",
    region: "ХМАО — Югра",
    clinicType: "centre",
    networkName: "Визус-1",
    status: "active",
    omsEnabled: false,
    phones: ["8 (3466) 246-100", "8 (3466) 242-421"],
    email: "vizus1.nv@mail.ru",
    website: "https://vizus1nv.ru",
    address: "Нижневартовск, ул. 60 лет Октября, 12А, к.3",
    inn: "8603187650",
    license: "ЛО-86-01-001201 от 14.11.2012",
  },

  // ── 7. Екатеринбург (МНТК) ───────────────────────────────────────────────
  {
    slug: "mntk-fedorova-ekb",
    title: "МНТК микрохирургии глаза им. Фёдорова",
    legalName: "ООО «МНТК микрохирургии глаза имени Фёдорова»",
    city: "Екатеринбург",
    region: "Свердловская область",
    clinicType: "mntk",
    status: "active",
    omsEnabled: false,
    phones: ["8 (343) 264-66-06", "8 (343) 264-66-00"],
    email: "ekat_vizus1@mail.ru",
    address: "Екатеринбург, ул. Владимира Высоцкого, 5",
    inn: "6670516747",
    license: "ЛО41-01021-66/00683056 от 22.09.2023",
  },

  // ── 8. Салехард: ООО Север ────────────────────────────────────────────────
  {
    slug: "sever-salekhard",
    title: "ООО «Север»",
    legalName: "ООО «Север»",
    city: "Салехард",
    region: "ЯНАО",
    clinicType: "clinic",
    status: "active",
    omsEnabled: true,
    phones: ["8 (34922) 5-35-80"],
    email: "Severnoe_siyanie_shd@mail.ru",
    address: "Салехард, ул. Зои Космодемьянской, 59",
    inn: "8901041529",
    license: "Л041-01145-83/00663432 от 13.07.2023",
  },

  // ── 9. Ноябрьск: Прозрение-Север ─────────────────────────────────────────
  {
    slug: "prozrenie-noyabrsk",
    title: "Центр микрохирургии глаза «Прозрение-Север»",
    legalName: "ООО ЦЕНТР МИКРОХИРУРГИИ ГЛАЗА «ПРОЗРЕНИЕ-СЕВЕР»",
    city: "Ноябрьск",
    region: "ЯНАО",
    clinicType: "centre",
    status: "active",
    omsEnabled: false,
    phones: ["8 (3496) 32-03-02", "8 (3496) 32-03-01"],
    email: "prozrenie89@bk.ru",
    website: "https://prozrenie89.ru",
    address: "Ноябрьск, ул. Городилова, 8",
    inn: "8905064703",
    license: "Л041-00110-86/00588748 от 20.11.2018",
  },

  // ── 10. Ноябрьск: Полярный круг ───────────────────────────────────────────
  {
    slug: "polyarny-krug-noyabrsk",
    title: "ООО «Полярный круг»",
    legalName: "ООО «ПОЛЯРНЫЙ КРУГ»",
    city: "Ноябрьск",
    region: "ЯНАО",
    clinicType: "clinic",
    status: "active",
    omsEnabled: true,
    phones: ["8 (3496) 32-03-01", "8 (3496) 32-03-02"],
    email: "89827713747@mail.ru",
    website: "https://polarkrug.ru",
    address: "Ноябрьск, ул. Городилова, 8",
    inn: "8905068401",
    license: "Л041-01145-83/00658174",
  },

  // ── 11. Шадринск ──────────────────────────────────────────────────────────
  {
    slug: "vizus1-shadrinsk",
    title: "Офтальмологический кабинет «Визус-1»",
    city: "Шадринск",
    region: "Курганская область",
    clinicType: "cabinet",
    networkName: "Визус-1",
    status: "active",
    omsEnabled: false,
    phones: ["8 (35253) 7-44-44", "8-963-865-18-85"],
    address: "Шадринск, ул. Свердлова, 93",
    inn: "7202236001",
    license: "ЛО-72-01-002483 от 23.05.2017",
  },

  // ── 12. Ишим ──────────────────────────────────────────────────────────────
  {
    slug: "vizus1-ishim",
    title: "Офтальмологический кабинет «Визус-1»",
    city: "Ишим",
    region: "Тюменская область",
    clinicType: "cabinet",
    networkName: "Визус-1",
    status: "active",
    omsEnabled: false,
    phones: ["8 (34551) 5-14-46"],
    email: "kimeeva.natalua@mail.ru",
    address: "Ишим, ул. Ленина, 6/5",
    inn: "7202137064",
    license: "Л041-01107-72/00563268 от 16.01.2020",
  },

  // ── 13. Тобольск ──────────────────────────────────────────────────────────
  {
    slug: "vizus1-tobolsk",
    title: "Офтальмологический кабинет «Визус-1»",
    city: "Тобольск",
    region: "Тюменская область",
    clinicType: "cabinet",
    networkName: "Визус-1",
    status: "active",
    omsEnabled: false,
    phones: ["+7 (3456) 26-31-41", "8-982-782-43-38"],
    email: "vizus1.tobolsk@mail.ru",
    address: "Тобольск, 8-й микрорайон, 45",
    inn: "7202137064",
    license: "ЛО-72-01-003284 от 16.01.2020",
  },

  // ── 14. НЕАКТИВНЫЙ: старый Салехард Визус-1 ──────────────────────────────
  {
    slug: "vizus1-salekhard-inactive",
    title: "Центр микрохирургии глаза «Визус-1» (Салехард)",
    city: "Салехард",
    region: "ЯНАО",
    clinicType: "centre",
    networkName: "Визус-1",
    status: "inactive",
    omsEnabled: false,
    phones: ["8 (34922) 5-35-80"],
    email: "Vizus1@list.ru",
    address: "Салехард, ул. Зои Космодемьянской, 59",
    inn: "8901029810",
    license: "Л041-01145-83/00332888 от 12.07.2019",
  },
];

// ─── Справочные данные (без изменений) ───────────────────────────────────────

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

// ─── Данные врачей из аудита ──────────────────────────────────────────────────

// Маппинг аудит-ID → slug клиники в БД
const CLINIC_SLUG_MAP: Record<string, string> = {
  C01: "vizus1-tyumen",
  C02: "vizus1-tyumen-oftalmo",
  C04: "vizus1-kurgan",
  C05: "vizus1-surgut",
  C06: "vizus1-nizhnevartovsk",
  C07: "mntk-fedorova-ekb",
  C09: "prozrenie-noyabrsk",
};

type DoctorSeed = {
  slug: string;
  lastName: string;
  firstName: string;
  middleName: string;
  position: string | null;
  category: string;
  experienceYears: number;
  credo: string;
  prodoctorovUrl: string;
  siteUrl: string;
  clinicIds: string[];
  specialties: string[];
  photoUrl: string | null;
  diseaseSlugs: string[];
  procedureSlugs: string[];
};

/**
 * Оборудование энциклопедии.
 * Источники (см. отчёт):
 *  - Официальная брошюра ZEISS VISUMAX 800 (en-INT_34_010_0027VI, CZ-VII/2024)
 *    из data/equipment/ZEISS VisuMax 800/ — технические характеристики и применения;
 *  - zeiss.com/visumax800 — сверка;
 *  - mhglaz.ru/smile-pro — применение в клинике «Визус-1» (Тюмень) и врачи.
 * PDF в БД не хранится — только ссылка на файл в public/.
 * Поля без достоверного источника оставлены пустыми (напр. год появления).
 */
type EquipmentSpecSeed = { group?: string; label: string; value: string };

type EquipmentSeed = {
  slug: string;
  title: string;
  categoryTitle: string;
  manufacturer?: string;
  country?: string;
  year?: number;
  summary?: string;
  description?: string;
  principle?: string;
  advantages?: string[];
  indications?: string[];
  limitations?: string[];
  images?: string[];
  manuals?: string[];
  specs?: EquipmentSpecSeed[];
  clinicIds?: string[];
  procedureSlugs?: string[];
  diseaseSlugs?: string[];
  doctorSlugs?: string[];
};

const EQUIPMENT: EquipmentSeed[] = [
  {
    slug: "zeiss-visumax-800",
    title: "ZEISS VisuMax 800",
    categoryTitle: "Лазерные системы",
    manufacturer: "Carl Zeiss Meditec AG",
    country: "Германия",
    // year: не указан ни в брошюре (CZ-VII/2024 — версия издания), ни на zeiss.com → оставлено пустым
    summary:
      "Фемтосекундная лазерная платформа ZEISS для рефракционной хирургии: извлечение лентикулы SMILE pro, формирование лоскута для Фемто-LASIK, тоннели для интрастромальных сегментов и кератопластика.",
    description:
      "ZEISS VisuMax 800 — фемтосекундная лазерная платформа компании Carl Zeiss Meditec (Йена, Германия) для рефракционной и роговичной хирургии. По сравнению с предыдущими поколениями сокращено время работы лазера и увеличена скорость реза: частота повторения импульсов 2 МГц в сочетании с высокопроизводительной сканирующей системой позволяет сформировать лентикулу менее чем за 10 секунд, а лоскут — примерно за 5 секунд. Более высокая скорость означает и меньшее время вакуумной фиксации глаза. Платформа оснащена интеллектуальными ассистирующими системами CentraLign (центрация по центру зрачка и вертексу уже на этапе докинга) и OcuLign (автоматический пересчёт рисунка вмешательства с учётом циклоторсии), а также интегрированным хирургическим микроскопом OPMI с оптикой ZEISS. Устройство подключается к цифровому контуру ZEISS (Refractive Workplace, FORUM, VISULYZE) для планирования вмешательства и анализа результатов.",
    principle:
      "Фемтосекундный лазер с длиной волны 1043 нм и длительностью импульса 220–580 фс фокусируется внутри стромы роговицы, где за счёт фотодеструкции формирует заданный рисунок реза, не повреждая вышележащие слои. При SMILE pro внутри роговицы вырезается тонкая линза — лентикула, которую хирург извлекает через микродоступ; при Фемто-LASIK лазер формирует роговичный лоскут. Частота повторения импульсов 2 МГц обеспечивает высокую скорость реза и, соответственно, короткое время вакуумной фиксации.",
    advantages: [
      "Частота повторения импульсов 2 МГц: формирование лентикулы менее чем за 10 секунд, лоскута — около 5 секунд (данные ZEISS).",
      "Более высокая скорость реза сокращает время вакуумной фиксации глаза и снижает стресс для пациента и хирурга.",
      "Ассистирующая система CentraLign: компьютерная центрация по центру зрачка и вертексу уже на этапе докинга, без смещения рисунка после присасывания.",
      "Ассистирующая система OcuLign: автоматический пересчёт рисунка вмешательства с учётом циклоторсии по статичному изображению радужки.",
      "Интегрированный хирургический микроскоп OPMI с оптикой ZEISS: 5 ступеней увеличения, щелевое освещение, цифровая видеокамера.",
      "Ультразвуковые датчики и камеры верхнего, бокового и терапевтического обзора; трекинг высоты для стабильности вакуума.",
      "Цифровая интеграция с ZEISS Refractive Workplace, FORUM и VISULYZE: удалённое планирование и анализ результатов с построением номограмм.",
      "Одна платформа для нескольких вмешательств: SMILE pro, лоскут для Фемто-LASIK, тоннели для ИРС, кератопластика, CIRCLE для докоррекции.",
    ],
    indications: [
      "Миопия — извлечение лентикулы по технологии SMILE pro (ZEISS).",
      "Астигматизм — извлечение лентикулы по технологии SMILE pro (ZEISS).",
      "Гиперметропия — извлечение лентикулы по технологии SMILE pro (по международной брошюре ZEISS; в энциклопедии страница гиперметропии пока отсутствует).",
      "Формирование роговичного лоскута для Фемто-LASIK с настраиваемыми диаметром, толщиной, положением ножки и углом бокового реза.",
      "Формирование роговичных тоннелей для имплантации интрастромальных сегментов (сегменты 90–270°).",
      "Кератопластика: сквозная (PKP) и передняя послойная (ALK) — опция Keratoplasty.",
      "Докоррекция после SMILE / SMILE pro: опция CIRCLE преобразует ранее сформированный кэп в лоскут.",
    ],
    limitations: [
      "Условия эксплуатации: температура +18…+25 °C, влажность 30–70 %.",
      "Масса устройства 520 кг; минимальная нагрузка на пол 2,5 кН/м² — требуется подготовленное помещение.",
      "Объём одобренных показаний и доступность опций различаются по странам (примечание ZEISS в брошюре).",
      "Медицинские противопоказания к вмешательству определяются врачом по результатам диагностики и в брошюре производителя не приводятся.",
    ],
    images: [
      "/equipment/zeiss-visumax-800/visumax-800-device.jpg",
      "/equipment/zeiss-visumax-800/visumax-800-operating-room.jpg",
      "/equipment/zeiss-visumax-800/visumax-800-laser-arm.jpg",
      "/equipment/zeiss-visumax-800/visumax-800-surgery.jpg",
    ],
    manuals: ["/equipment/zeiss-visumax-800/zeiss-visumax-800-brochure-en.pdf"],
    specs: [
      { group: "Общие", label: "Тип лазера", value: "Фемтосекундный лазер" },
      { group: "Общие", label: "Доступные вмешательства", value: "Лоскут (Flap), SMILE pro, CIRCLE, ИРС (ICR), кератопластика" },
      { group: "Общие", label: "Цифровые ассистирующие системы", value: "Центрация CentraLign, выравнивание по циклоторсии OcuLign, импорт номограмм VISULYZE" },
      { group: "Оптические данные", label: "Максимальная частота повторения импульсов", value: "2 МГц" },
      { group: "Оптические данные", label: "Длина волны", value: "1043 нм" },
      { group: "Оптические данные", label: "Длительность импульса", value: "220–580 фс" },
      { group: "Хирургический микроскоп", label: "Увеличение", value: "0,7×" },
      { group: "Хирургический микроскоп", label: "Коэффициенты смены увеличения", value: "0,4 / 0,6 / 1,0 / 1,6 / 2,5" },
      { group: "Хирургический микроскоп", label: "Увеличение окуляра", value: "12,5× (10×)" },
      { group: "Хирургический микроскоп", label: "Фильтры", value: "Синий, барьерный (жёлтый)" },
      { group: "Хирургический микроскоп", label: "Щелевое освещение", value: "Ширина щели ≤ 0,3 мм / 0,7 мм; высота щели 11,0 мм" },
      { group: "Условия эксплуатации", label: "Температура", value: "+18 °C…+25 °C" },
      { group: "Условия эксплуатации", label: "Влажность", value: "30 %…70 %" },
      { group: "Габариты и масса", label: "Масса устройства", value: "520 кг" },
      { group: "Габариты и масса", label: "Минимальная нагрузка на пол", value: "2,5 кН/м²" },
      { group: "Габариты и масса", label: "Площадь основания (отдельно стоящее)", value: "Д × Ш: 1710 мм × 925 мм" },
    ],
    // Клиника: подтверждено сайтом mhglaz.ru/smile-pro (Визус-1, Тюмень)
    clinicIds: ["C01"],
    // Процедуры: подтверждено таблицей «Available treatment options» брошюры ZEISS
    procedureSlugs: ["smile-pro", "femto-lasik", "implantatsiya-rogovichnykh-segmentov"],
    // Заболевания: SMILE pro — миопия и астигматизм (брошюра ZEISS + zeiss.com)
    diseaseSlugs: ["miopiya", "astigmatizm"],
    // Врачи: сайт клиники прямо указывает «Работает на VisuMax 800» только для Куницкого
    doctorSlugs: ["kunitskiy-konstantin-vladislavovich"],
  },
];

/**
 * Научные работы врачей.
 * Источник: data/doctors/<slug>/ (автореферат, диссертация).
 * В БД попадают ТОЛЬКО структурированные данные — полный текст не хранится,
 * сами документы отдаются файлами из public/doctors/<slug>/.
 * Разделы, отсутствующие в документе, остаются пустыми (не выдумываются).
 */
type ScientificWorkSeed = {
  doctorSlug: string;
  /** Стабильный slug страницы /publications/[slug]. Задаётся явно, чтобы URL не менялся при правке заголовка. */
  slug: string;
  type: string;
  title: string;
  /** Заболевания, РЕАЛЬНО исследуемые в работе (не направления автора). */
  diseaseSlugs?: string[];
  /** Процедуры/методики, РЕАЛЬНО исследуемые в работе. */
  procedureSlugs?: string[];
  degree?: string;
  speciality?: string;
  year?: number;
  organization?: string;
  supervisor?: string;
  summary?: string;
  novelty?: string[];
  practicalValue?: string[];
  results?: string[];
  publicationCount?: number;
  pdfUrl?: string;
  abstractUrl?: string;
  sortOrder?: number;
};

const SCIENTIFIC_WORKS: ScientificWorkSeed[] = [
  {
    doctorSlug: "ostroverhov-aleksandr-ivanovich",
    slug: "ekspress-krosslinking-pri-keratektaziyah",
    type: "Кандидатская диссертация",
    title: "Экспресс кросслинкинг при кератэктазиях",
    // Строго тема работы. Направления автора (косоглазие, катаракта, птоз) сюда НЕ входят —
    // это дало бы ложные медицинские связи.
    diseaseSlugs: ["keratokonus"],
    procedureSlugs: ["krosslinking"],
    degree: "Кандидат медицинских наук",
    speciality: "14.01.07 — глазные болезни",
    year: 2023,
    organization:
      "Кыргызско-Российский Славянский университет им. Б. Н. Ельцина; Кыргызская государственная медицинская академия им. И. К. Ахунбаева (Бишкек)",
    supervisor:
      "Джумагулов Олжобай Джумакадырович, доктор медицинских наук, профессор",
    summary:
      "Работа посвящена усовершенствованному методу укрепления роговицы — экспресс кросслинкингу — для лечения кератэктазий, при которых роговица истончается и деформируется, а зрение прогрессивно падает. Стандартный кросслинкинг требует снятия эпителия роговицы и не применяется при её толщине менее 400 мкм, из-за чего часть пациентов оставалась без лечения. Автор предложил вводить кислородно-рибофлавиновую смесь внутрь роговицы инъекционно, сохраняя собственный эпителий, и сократить время ультрафиолетового облучения. Метод впервые позволил безопасно лечить тонкие роговицы, снизил число осложнений и сократил сроки восстановления. Для пациентов это означает возможность остановить прогрессирование кератоконуса без деэпителизации и долгой реабилитации.",
    novelty: [
      "Впервые в эксперименте доказаны эффективность и безопасность методики кросслинкинга роговицы с интрастромальным введением кислородно-рибофлавиновой смеси, в результате которой произошло ожидаемое увеличение прочностных свойств роговицы.",
      "Впервые в клинической практике применена методика кросслинкинга роговицы с интрастромальным введением кислородно-рибофлавиновой смеси и укорочением времени воздействия ультрафиолета в лечении больных с кератэктазиями с толщиной роговицы менее 400 мкм.",
    ],
    practicalValue: [
      "Методика даёт возможность избегать осложнений, связанных с деэпителизацией, и применять процедуру на тонких роговицах (свидетельство на рационализаторское предложение, выданное Кыргызпатентом, № 856 от 15.03.2018).",
      "Усовершенствованная методика позволяет получить высокие функциональные результаты: увеличение остроты зрения и стабилизацию процесса в раннем и позднем послеоперационном периоде.",
      "Методика внедрена в лечебно-диагностический процесс (акт внедрения от 18.01.2023) и в учебный процесс студентов и клинических ординаторов Кыргызско-Российского Славянского университета им. Б. Н. Ельцина (акт внедрения от 21.12.2023).",
    ],
    results: [
      "Применение методики сократило сроки реабилитации и увеличило остроту зрения в 46,0% случаев.",
      "Толщина роговицы увеличилась на 35,2 мкм, преломляющая сила роговицы снизилась на 4,17 D, фактор резистентности повысился в 1,72 раза.",
      "Стойкая ремиссия заболевания достигнута в 95,6% случаев.",
      "В эксперименте (25 кроликов) и клиническом исследовании (34 пациента, 53 глаза) подтверждены сохранность эндотелия роговицы и отсутствие повышения внутриглазного давления.",
    ],
    publicationCount: 6,
    abstractUrl: "/doctors/ostroverhov-aleksandr-ivanovich/avtoreferat.pdf",
    pdfUrl: "/doctors/ostroverhov-aleksandr-ivanovich/dissertaciya.pdf",
    sortOrder: 1,
  },
];

const DOCTORS: DoctorSeed[] = [
  {
    slug: "kunitskiy-konstantin-vladislavovich",
    lastName: "Куницкий",
    firstName: "Константин",
    middleName: "Владиславович",
    position: "Заведующий рефракционным отделением",
    category: "Рефракционная хирургия",
    experienceYears: 18,
    credo: "Фокус на рефракционной хирургии, SMILE / SMILE Pro / LASIK / лечение кератоконуса.",
    prodoctorovUrl: "https://prodoctorov.ru/tyumen/vrach/268224-kunickiy/",
    siteUrl: "https://vizus1.ru/spetsialisty/kunitskiy-konstantin-vladislavovich/",
    clinicIds: ["C01", "C02", "C06"],
    specialties: ["Катаракта", "Лазерная коррекция зрения", "Кератоконус", "Рефракционная хирургия"],
    photoUrl: "/doctors/kunitskiy.png",
    diseaseSlugs: ["miopiya", "astigmatizm", "keratokonus"],
    procedureSlugs: ["lasik", "femto-lasik", "smile", "smile-pro", "krosslinking", "implantatsiya-rogovichnykh-segmentov"],
  },
  {
    slug: "evdokimov-georgiy-vyacheslavovich",
    lastName: "Евдокимов",
    firstName: "Георгий",
    middleName: "Вячеславович",
    position: "Заведующий микрохирургическим отделением",
    category: "Витреоретинальная хирургия",
    experienceYears: 16,
    credo: "Катаракта, витреоретинальная хирургия, глаукома, Anti-VEGF, сложная микрохирургия.",
    prodoctorovUrl: "https://prodoctorov.ru/tyumen/vrach/672894-evdokimov/",
    siteUrl: "http://www.prozrenie89.ru/spetsialisty/evdokimov-georgiy-vyacheslavovich/",
    clinicIds: ["C01", "C02", "C06", "C09"],
    specialties: ["Катаракта", "Витреоретинальная хирургия", "Глаукома", "Anti-VEGF терапия"],
    photoUrl: "/doctors/evdokimov.png",
    diseaseSlugs: ["katarakta", "otsloika-setchatki", "makulyarnyy-razryv", "vozrastnaya-makulyarnaya-degeneratsiya", "diabeticheskiy-makulyarnyy-otek"],
    procedureSlugs: ["fakoemulsifikatsiya-katarakty", "implantatsiya-iol", "vitrektomiya", "anti-vegf-terapiya", "piling-epiretinalnykh-membran"],
  },
  {
    slug: "dubrovina-anna-valerevna",
    lastName: "Дубровина",
    firstName: "Анна",
    middleName: "Валерьевна",
    position: null,
    category: "Лазерная хирургия",
    experienceYears: 24,
    credo: "FEMTO LASIK, SMILE Pro, хирургия функционально единственного глаза.",
    prodoctorovUrl: "https://prodoctorov.ru/tyumen/vrach/190429-dubrovina/",
    siteUrl: "https://vizus1.ru/spetsialisty/dubrovina-anna-valerevna/",
    clinicIds: ["C01", "C06", "C07"],
    specialties: ["Лазерная коррекция зрения", "FEMTO LASIK", "SMILE Pro", "Хирургия единственного глаза"],
    photoUrl: "/doctors/dubrovina.png",
    diseaseSlugs: ["miopiya", "astigmatizm"],
    procedureSlugs: ["lasik", "femto-lasik", "smile-pro", "lazernaya-koagulyatsiya-setchatki"],
  },
  {
    slug: "ostroverhov-aleksandr-ivanovich",
    lastName: "Островерхов",
    firstName: "Александр",
    middleName: "Иванович",
    position: null,
    category: "Окулопластика",
    experienceYears: 14,
    credo: "Хирургия косоглазия, блефаропластика, лазерные и катарактальные операции.",
    prodoctorovUrl: "https://prodoctorov.ru/tyumen/vrach/1095860-ostroverhov/",
    siteUrl: "https://vizus1.ru/spetsialisty/ostroverkhov-aleksandr-ivanovich/",
    clinicIds: ["C01", "C02", "C04", "C05", "C06"],
    specialties: ["Косоглазие", "Блефаропластика", "Катаракта", "Витрэктомия"],
    photoUrl: "/doctors/ostroverkhov.jpg",
    diseaseSlugs: ["kosoglazie", "katarakta", "ptoz"],
    procedureSlugs: ["khirurgiya-kosoglaziya", "blefaroplastika", "fakoemulsifikatsiya-katarakty"],
  },
  {
    slug: "chichenkova-anna-vasilevna",
    lastName: "Чиченкова",
    firstName: "Анна",
    middleName: "Васильевна",
    position: null,
    category: "Глаукома",
    experienceYears: 16,
    credo: "Лазерные методики, амбулаторный приём детей от 6 лет.",
    prodoctorovUrl: "https://prodoctorov.ru/tyumen/vrach/855462-chichenkova/",
    siteUrl: "https://vizus1.ru/spetsialisty/chichenkova-anna-vasilevna/",
    clinicIds: ["C01", "C07"],
    specialties: ["Лазерное лечение", "Детская офтальмология", "Глаукома", "Заболевания сетчатки"],
    photoUrl: "/doctors/chichenkova.png",
    diseaseSlugs: ["glaukoma"],
    procedureSlugs: ["slt", "navilas", "vitreolizis"],
  },
  {
    slug: "ushkova-kseniya-anatolevna",
    lastName: "Ушкова",
    firstName: "Ксения",
    middleName: "Анатольевна",
    position: null,
    category: "Катарактальная хирургия",
    experienceYears: 12,
    credo: "Эксимерлазерная коррекция, факоэмульсификация катаракты, хирургия прозрачного хрусталика.",
    prodoctorovUrl: "https://prodoctorov.ru/tyumen/vrach/704134-ushkova/",
    siteUrl: "https://mhglaz.ru/spetsialisty/ushkova",
    clinicIds: ["C01", "C06"],
    specialties: ["Лазерная коррекция зрения", "Катаракта", "Хирургия хрусталика", "Детская офтальмология"],
    photoUrl: "/doctors/ushkova.png",
    diseaseSlugs: ["katarakta", "miopiya"],
    procedureSlugs: ["zamena-khrustalika", "fakoemulsifikatsiya-katarakty"],
  },
  {
    slug: "hubonov-murid-hubonovich",
    lastName: "Хубонов",
    firstName: "Мурид",
    middleName: "Хубонович",
    position: null,
    category: "Катарактальная хирургия",
    experienceYears: 15,
    credo: "Премиальная хирургия катаракты, имплантация торических и мультифокальных линз, Anti-VEGF.",
    prodoctorovUrl: "https://prodoctorov.ru/kingisepp/vrach/947797-hubonov/",
    siteUrl: "https://vizus1.ru/spetsialisty/khubonov-murid-khubonovich/",
    clinicIds: ["C02", "C04", "C05", "C06"],
    specialties: ["Катаракта", "Премиальная хирургия", "Anti-VEGF терапия", "Пластика век"],
    photoUrl: "/doctors/khubonov.jpg",
    diseaseSlugs: ["katarakta", "vozrastnaya-makulyarnaya-degeneratsiya"],
    procedureSlugs: ["fakoemulsifikatsiya-katarakty", "anti-vegf-terapiya"],
  },
  {
    slug: "korsakova-natalya-serafimovna",
    lastName: "Корсакова",
    firstName: "Наталья",
    middleName: "Серафимовна",
    position: null,
    category: "Детская офтальмология",
    experienceYears: 10,
    credo: "Амблиопия, дакриоцистит, детская диагностика и аппаратное лечение.",
    prodoctorovUrl: "https://prodoctorov.ru/naro-fominsk/vrach/489851-korsakova/",
    siteUrl: "https://vizus1.ru/spetsialisty/korsakova-natalya-serafimovna/",
    clinicIds: ["C01"],
    specialties: ["Детская офтальмология", "Амблиопия", "Дакриоцистит", "Педиатрический приём"],
    photoUrl: "/doctors/korsakova.jpg",
    diseaseSlugs: ["ambliopiya", "kosoglazie", "dakriotsistit"],
    procedureSlugs: ["zondirovanie-sleznykh-kanalov"],
  },
  {
    slug: "grishanina-yuliya-sergeevna",
    lastName: "Гришанина",
    firstName: "Юлия",
    middleName: "Сергеевна",
    position: null,
    category: "Глаукома",
    experienceYears: 8,
    credo: "Первичный скрининг, маршрутизация пациентов, диагностика глаукомы и ретинопатий.",
    prodoctorovUrl: "https://prodoctorov.ru/tyumen/vrach/934088-grishanina/",
    siteUrl: "https://vizus1.ru/spetsialisty/grishanina-yuliya-sergeevna/",
    clinicIds: ["C01"],
    specialties: ["Диагностика", "Глаукома", "Ретинопатия", "Первичный приём"],
    photoUrl: null, // фото отсутствует
    diseaseSlugs: ["glaukoma", "diabeticheskaya-retinopatiya", "uveit", "keratit"],
    procedureSlugs: ["diagnosticheskiy-priem"],
  },
];

// ─── Disease seeds (from doctor-seed-data.md) ──────────────────────────────────

type DiseaseSeed = { slug: string; title: string; categoryTitle: string };

const DISEASES: DiseaseSeed[] = [
  { slug: "miopiya", title: "Миопия", categoryTitle: "Нарушения рефракции" },
  { slug: "astigmatizm", title: "Астигматизм", categoryTitle: "Нарушения рефракции" },
  { slug: "keratokonus", title: "Кератоконус", categoryTitle: "Патология роговицы" },
  { slug: "katarakta", title: "Катаракта", categoryTitle: "Патология хрусталика" },
  { slug: "otsloika-setchatki", title: "Отслойка сетчатки", categoryTitle: "Патология сетчатки" },
  { slug: "makulyarnyy-razryv", title: "Макулярный разрыв", categoryTitle: "Патология сетчатки" },
  { slug: "vozrastnaya-makulyarnaya-degeneratsiya", title: "Возрастная макулярная дегенерация", categoryTitle: "Патология сетчатки" },
  { slug: "diabeticheskiy-makulyarnyy-otek", title: "Диабетический макулярный отек", categoryTitle: "Патология сетчатки" },
  { slug: "kosoglazie", title: "Косоглазие", categoryTitle: "Врождённые аномалии" },
  { slug: "ptoz", title: "Птоз", categoryTitle: "Орбитальная патология" },
  { slug: "glaukoma", title: "Глаукома", categoryTitle: "Глаукома" },
  { slug: "ambliopiya", title: "Амблиопия", categoryTitle: "Нарушения рефракции" },
  { slug: "dakriotsistit", title: "Дакриоцистит", categoryTitle: "Патология слёзных органов" },
  { slug: "diabeticheskaya-retinopatiya", title: "Диабетическая ретинопатия", categoryTitle: "Патология сетчатки" },
  { slug: "uveit", title: "Увеит", categoryTitle: "Воспалительные заболевания" },
  { slug: "keratit", title: "Кератит", categoryTitle: "Воспалительные заболевания" },
];

// ─── Procedure seeds (from doctor-seed-data.md) ────────────────────────────────

type ProcedureSeed = { slug: string; title: string; categoryTitle: string };

const PROCEDURES: ProcedureSeed[] = [
  { slug: "lasik", title: "LASIK", categoryTitle: "Рефракционные операции" },
  { slug: "femto-lasik", title: "FEMTO-LASIK", categoryTitle: "Рефракционные операции" },
  { slug: "smile", title: "SMILE", categoryTitle: "Рефракционные операции" },
  { slug: "smile-pro", title: "SMILE Pro", categoryTitle: "Рефракционные операции" },
  { slug: "krosslinking", title: "Кросслинкинг", categoryTitle: "Лазерные процедуры" },
  { slug: "implantatsiya-rogovichnykh-segmentov", title: "Имплантация роговичных сегментов", categoryTitle: "Хирургические операции" },
  { slug: "fakoemulsifikatsiya-katarakty", title: "Факоэмульсификация катаракты", categoryTitle: "Хирургические операции" },
  { slug: "implantatsiya-iol", title: "Имплантация ИОЛ", categoryTitle: "Хирургические операции" },
  { slug: "vitrektomiya", title: "Витрэктомия", categoryTitle: "Витреоретинальные вмешательства" },
  { slug: "anti-vegf-terapiya", title: "Anti-VEGF терапия", categoryTitle: "Медикаментозное лечение" },
  { slug: "piling-epiretinalnykh-membran", title: "Пилинг эпиретинальных мембран", categoryTitle: "Витреоретинальные вмешательства" },
  { slug: "lazernaya-koagulyatsiya-setchatki", title: "Лазерная коагуляция сетчатки", categoryTitle: "Лазерные процедуры" },
  { slug: "khirurgiya-kosoglaziya", title: "Хирургия косоглазия", categoryTitle: "Хирургические операции" },
  { slug: "blefaroplastika", title: "Блефаропластика", categoryTitle: "Хирургические операции" },
  { slug: "slt", title: "SLT", categoryTitle: "Лазерные процедуры" },
  { slug: "navilas", title: "NAVILAS", categoryTitle: "Лазерные процедуры" },
  { slug: "vitreolizis", title: "Витреолизис", categoryTitle: "Лазерные процедуры" },
  { slug: "zamena-khrustalika", title: "Замена хрусталика", categoryTitle: "Хирургические операции" },
  { slug: "zondirovanie-sleznykh-kanalov", title: "Зондирование слезных каналов", categoryTitle: "Хирургические операции" },
  { slug: "diagnosticheskiy-priem", title: "Диагностический прием", categoryTitle: "Диагностические процедуры" },
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

  // ─── Seed diseases ──────────────────────────────────────────────────────────
  console.log("Seeding diseases...");
  for (const d of DISEASES) {
    const category = await db.diseaseCategory.findUnique({ where: { slug: slug(d.categoryTitle) } });
    if (!category) {
      console.warn(`⚠ Disease category not found: ${d.categoryTitle}`);
      continue;
    }
    await db.disease.upsert({
      where: { slug: d.slug },
      update: { title: d.title, categoryId: category.id },
      create: { slug: d.slug, title: d.title, categoryId: category.id },
    });
  }
  console.log(`✓ ${DISEASES.length} diseases`);

  // ─── Seed procedures ───────────────────────────────────────────────────────
  console.log("Seeding procedures...");
  for (const p of PROCEDURES) {
    const category = await db.procedureCategory.findUnique({ where: { slug: slug(p.categoryTitle) } });
    if (!category) {
      console.warn(`⚠ Procedure category not found: ${p.categoryTitle}`);
      continue;
    }
    await db.procedure.upsert({
      where: { slug: p.slug },
      update: { title: p.title, categoryId: category.id },
      create: { slug: p.slug, title: p.title, categoryId: category.id },
    });
  }
  console.log(`✓ ${PROCEDURES.length} procedures`);

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

  console.log("Seeding clinics from master dataset...");
  for (const c of CLINICS) {
    await db.clinic.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        title: c.title,
        legalName: c.legalName ?? null,
        city: c.city,
        region: c.region,
        clinicType: c.clinicType,
        networkName: c.networkName ?? null,
        status: c.status,
        omsEnabled: c.omsEnabled,
        phones: c.phones,
        email: c.email ?? null,
        website: c.website ?? null,
        address: c.address,
        inn: c.inn,
        license: c.license,
        logoUrl: c.logoUrl ?? null,
      },
      update: {
        title: c.title,
        legalName: c.legalName ?? null,
        city: c.city,
        region: c.region,
        clinicType: c.clinicType,
        networkName: c.networkName ?? null,
        status: c.status,
        omsEnabled: c.omsEnabled,
        phones: c.phones,
        email: c.email ?? null,
        website: c.website ?? null,
        address: c.address,
        inn: c.inn,
        license: c.license,
        logoUrl: c.logoUrl ?? null,
      },
    });
  }

  const totalCount = await db.clinic.count();
  const activeCount = await db.clinic.count({ where: { status: "active" } });
  const inactiveCount = await db.clinic.count({ where: { status: "inactive" } });
  console.log(`✓ Clinics total: ${totalCount} (active: ${activeCount}, inactive: ${inactiveCount})`);

  if (activeCount !== 13) {
    console.warn(`⚠ Expected 13 active clinics, got ${activeCount}`);
  } else {
    console.log("✓ Active clinic count = 13 ✓");
  }

  // ─── Seed doctors ──────────────────────────────────────────────────────────
  console.log("Seeding doctors...");

  // Ensure doctor specialties exist (from seed-data, not in global specialties list)
  const doctorSpecialtyTitles = new Set<string>();
  for (const d of DOCTORS) {
    for (const s of d.specialties) doctorSpecialtyTitles.add(s);
  }
  for (const title of doctorSpecialtyTitles) {
    await db.specialty.upsert({
      where: { slug: slug(title) },
      update: { title },
      create: { slug: slug(title), title },
    });
  }

  for (const d of DOCTORS) {
    // Upsert doctor record
    const doctor = await db.doctor.upsert({
      where: { slug: d.slug },
      create: {
        slug: d.slug,
        lastName: d.lastName,
        firstName: d.firstName,
        middleName: d.middleName,
        position: d.position,
        category: d.category,
        experienceYears: d.experienceYears,
        credo: d.credo,
        prodoctorovUrl: d.prodoctorovUrl,
        siteUrl: d.siteUrl,
        photoUrl: d.photoUrl,
      },
      update: {
        lastName: d.lastName,
        firstName: d.firstName,
        middleName: d.middleName,
        position: d.position,
        category: d.category,
        experienceYears: d.experienceYears,
        credo: d.credo,
        prodoctorovUrl: d.prodoctorovUrl,
        siteUrl: d.siteUrl,
        // photoUrl intentionally not overwritten to preserve manually uploaded photos
      },
    });

    // Upsert clinic relations
    for (const clinicId of d.clinicIds) {
      const clinicSlug = CLINIC_SLUG_MAP[clinicId];
      if (!clinicSlug) {
        console.warn(`⚠ Unknown clinic ID: ${clinicId} for doctor ${d.slug}`);
        continue;
      }
      const clinic = await db.clinic.findUnique({ where: { slug: clinicSlug } });
      if (!clinic) {
        console.warn(`⚠ Clinic not found in DB: ${clinicSlug}`);
        continue;
      }
      await db.doctorOnClinic.upsert({
        where: { doctorId_clinicId: { doctorId: doctor.id, clinicId: clinic.id } },
        create: { doctorId: doctor.id, clinicId: clinic.id },
        update: {},
      });
    }

    // Upsert specialty relations
    for (const specTitle of d.specialties) {
      const specialty = await db.specialty.findUnique({ where: { slug: slug(specTitle) } });
      if (!specialty) continue;
      await db.doctorOnSpecialty.upsert({
        where: { doctorId_specialtyId: { doctorId: doctor.id, specialtyId: specialty.id } },
        create: { doctorId: doctor.id, specialtyId: specialty.id },
        update: {},
      });
    }

    // Upsert disease relations
    for (const diseaseSlug of d.diseaseSlugs) {
      const disease = await db.disease.findUnique({ where: { slug: diseaseSlug } });
      if (!disease) {
        console.warn(`⚠ Disease not found: ${diseaseSlug} for doctor ${d.slug}`);
        continue;
      }
      await db.doctorOnDisease.upsert({
        where: { doctorId_diseaseId: { doctorId: doctor.id, diseaseId: disease.id } },
        create: { doctorId: doctor.id, diseaseId: disease.id },
        update: {},
      });
    }

    // Upsert procedure relations
    for (const procedureSlug of d.procedureSlugs) {
      const procedure = await db.procedure.findUnique({ where: { slug: procedureSlug } });
      if (!procedure) {
        console.warn(`⚠ Procedure not found: ${procedureSlug} for doctor ${d.slug}`);
        continue;
      }
      await db.doctorOnProcedure.upsert({
        where: { doctorId_procedureId: { doctorId: doctor.id, procedureId: procedure.id } },
        create: { doctorId: doctor.id, procedureId: procedure.id },
        update: {},
      });
    }

    console.log(`  ✓ ${d.lastName} ${d.firstName} (${d.clinicIds.length} clinics, ${d.specialties.length} specialties, ${d.diseaseSlugs.length} diseases, ${d.procedureSlugs.length} procedures)`);
  }

  const doctorCount = await db.doctor.count();
  console.log(`✓ Doctors total: ${doctorCount}`);
  if (doctorCount !== 9) {
    console.warn(`⚠ Expected 9 doctors, got ${doctorCount}`);
  }

  // ─── Equipment ──────────────────────────────────────────────────────────────
  console.log("Seeding equipment...");

  for (const e of EQUIPMENT) {
    const category = await db.equipmentCategory.findUnique({
      where: { slug: slug(e.categoryTitle) },
    });
    if (!category) {
      console.warn(`⚠ Equipment category not found: ${e.categoryTitle} for ${e.slug}`);
    }
    const data = {
      title: e.title,
      categoryId: category?.id ?? null,
      manufacturer: e.manufacturer ?? null,
      country: e.country ?? null,
      year: e.year ?? null,
      summary: e.summary ?? null,
      description: e.description ?? null,
      principle: e.principle ?? null,
      advantages: e.advantages ?? [],
      indications: e.indications ?? [],
      limitations: e.limitations ?? [],
      images: e.images ?? [],
      manuals: e.manuals ?? [],
    };
    const equipment = await db.equipment.upsert({
      where: { slug: e.slug },
      create: { slug: e.slug, ...data },
      update: data,
    });

    // Технические характеристики
    for (const [i, s] of (e.specs ?? []).entries()) {
      const specData = { group: s.group ?? null, value: s.value, sortOrder: i };
      await db.equipmentSpec.upsert({
        where: { equipmentId_label: { equipmentId: equipment.id, label: s.label } },
        create: { equipmentId: equipment.id, label: s.label, ...specData },
        update: specData,
      });
    }

    // Связи: клиники
    for (const clinicId of e.clinicIds ?? []) {
      const clinicSlug = CLINIC_SLUG_MAP[clinicId];
      const clinic = clinicSlug
        ? await db.clinic.findUnique({ where: { slug: clinicSlug } })
        : null;
      if (!clinic) {
        console.warn(`⚠ Clinic not found: ${clinicId} for equipment ${e.slug}`);
        continue;
      }
      await db.clinicOnEquipment.upsert({
        where: { clinicId_equipmentId: { clinicId: clinic.id, equipmentId: equipment.id } },
        create: { clinicId: clinic.id, equipmentId: equipment.id },
        update: {},
      });
    }

    // Связи: процедуры
    for (const s of e.procedureSlugs ?? []) {
      const procedure = await db.procedure.findUnique({ where: { slug: s } });
      if (!procedure) {
        console.warn(`⚠ Procedure not found: ${s} for equipment ${e.slug}`);
        continue;
      }
      await db.procedureOnEquipment.upsert({
        where: { procedureId_equipmentId: { procedureId: procedure.id, equipmentId: equipment.id } },
        create: { procedureId: procedure.id, equipmentId: equipment.id },
        update: {},
      });
    }

    // Связи: заболевания
    for (const s of e.diseaseSlugs ?? []) {
      const disease = await db.disease.findUnique({ where: { slug: s } });
      if (!disease) {
        console.warn(`⚠ Disease not found: ${s} for equipment ${e.slug}`);
        continue;
      }
      await db.diseaseOnEquipment.upsert({
        where: { diseaseId_equipmentId: { diseaseId: disease.id, equipmentId: equipment.id } },
        create: { diseaseId: disease.id, equipmentId: equipment.id },
        update: {},
      });
    }

    // Связи: врачи
    for (const s of e.doctorSlugs ?? []) {
      const doctor = await db.doctor.findUnique({ where: { slug: s } });
      if (!doctor) {
        console.warn(`⚠ Doctor not found: ${s} for equipment ${e.slug}`);
        continue;
      }
      await db.doctorOnEquipment.upsert({
        where: { doctorId_equipmentId: { doctorId: doctor.id, equipmentId: equipment.id } },
        create: { doctorId: doctor.id, equipmentId: equipment.id },
        update: {},
      });
    }

    console.log(
      `  ✓ ${e.title} (${e.specs?.length ?? 0} specs, ${e.clinicIds?.length ?? 0} clinics, ${e.procedureSlugs?.length ?? 0} procedures, ${e.diseaseSlugs?.length ?? 0} diseases, ${e.doctorSlugs?.length ?? 0} doctors)`,
    );
  }
  console.log(`✓ Equipment total: ${await db.equipment.count()}`);

  // ─── Scientific works ───────────────────────────────────────────────────────
  console.log("Seeding scientific works...");

  for (const w of SCIENTIFIC_WORKS) {
    const doctor = await db.doctor.findUnique({ where: { slug: w.doctorSlug } });
    if (!doctor) {
      console.warn(`⚠ Doctor not found: ${w.doctorSlug} for work "${w.title}"`);
      continue;
    }
    const data = {
      slug: w.slug,
      type: w.type,
      degree: w.degree ?? null,
      speciality: w.speciality ?? null,
      year: w.year ?? null,
      organization: w.organization ?? null,
      supervisor: w.supervisor ?? null,
      summary: w.summary ?? null,
      novelty: w.novelty ?? [],
      practicalValue: w.practicalValue ?? [],
      results: w.results ?? [],
      publicationCount: w.publicationCount ?? null,
      pdfUrl: w.pdfUrl ?? null,
      abstractUrl: w.abstractUrl ?? null,
      sortOrder: w.sortOrder ?? 0,
    };
    const work = await db.scientificWork.upsert({
      where: { doctorId_title: { doctorId: doctor.id, title: w.title } },
      create: { doctorId: doctor.id, title: w.title, ...data },
      update: data,
    });

    // Связи по ТЕМЕ работы (прямые, не через врача)
    for (const s of w.diseaseSlugs ?? []) {
      const disease = await db.disease.findUnique({ where: { slug: s } });
      if (!disease) {
        console.warn(`⚠ Disease not found: ${s} for work "${w.title}"`);
        continue;
      }
      await db.scientificWorkOnDisease.upsert({
        where: { workId_diseaseId: { workId: work.id, diseaseId: disease.id } },
        create: { workId: work.id, diseaseId: disease.id },
        update: {},
      });
    }
    for (const s of w.procedureSlugs ?? []) {
      const procedure = await db.procedure.findUnique({ where: { slug: s } });
      if (!procedure) {
        console.warn(`⚠ Procedure not found: ${s} for work "${w.title}"`);
        continue;
      }
      await db.scientificWorkOnProcedure.upsert({
        where: { workId_procedureId: { workId: work.id, procedureId: procedure.id } },
        create: { workId: work.id, procedureId: procedure.id },
        update: {},
      });
    }

    console.log(
      `  ✓ ${w.type}: «${w.title}» → ${doctor.lastName} ${doctor.firstName} (/${w.slug}, ${w.diseaseSlugs?.length ?? 0} diseases, ${w.procedureSlugs?.length ?? 0} procedures)`,
    );
  }

  const workCount = await db.scientificWork.count();
  console.log(`✓ Scientific works total: ${workCount}`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

