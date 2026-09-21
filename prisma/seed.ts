import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { REGULATION_TOPICS, REGULATIONS } from "./data/regulations/core";
import { EXTENDED_REGULATIONS } from "./data/regulations/extended";
import { INDEPENDENT_CONTROL_REGULATIONS } from "./data/regulations/independent-control";
import { ORDER_633N } from "./data/regulations/order-633n";
import { validateRegulationCorpus } from "./data/regulations/validate";
import { INDEPENDENT_CONTROL_OBSERVATION_FORM } from "./data/independent-control/observation-form";
import { validateIndependentControlCorpus } from "./data/independent-control/validate";
import {
  buildPrivateGlazcentrSourceAssessments,
  GLAZCENTR_FORMAL_NOC_SCOPE_ASSESSMENT,
  GLAZCENTR_INDEPENDENT_CONTROL,
} from "./data/investigations/glazcentr-independent-control";
import {
  OSTROVERHOV_LEGACY_IDENTITY_REVIEW_NOTE,
  OSTROVERHOV_SCIENTIFIC_WORKS,
} from "./data/scientific-works/ostroverhov";
import { CHURAKOV_SCIENTIFIC_WORKS } from "./data/scientific-works/churakov";
import { getInnovationContent } from "../src/lib/innovation-content";
import {
  STO_2026_EVENT,
  STO_2026_EVENT_SLUG,
  STO_2026_PROGRAM,
  STO_2026_SPEAKERS,
} from "../src/lib/events/sto-2026";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

const REGULATORY_CORPUS = [
  ...REGULATIONS,
  ...EXTENDED_REGULATIONS,
  ...INDEPENDENT_CONTROL_REGULATIONS,
  ORDER_633N,
];

function validateSeedCorpora() {
  const regulationValidation = validateRegulationCorpus(REGULATORY_CORPUS, REGULATION_TOPICS);
  const independentControlValidation = validateIndependentControlCorpus([
    INDEPENDENT_CONTROL_OBSERVATION_FORM,
  ]);
  const errors = [
    ...regulationValidation.errors.map((error) => `regulations: ${error}`),
    ...independentControlValidation.errors.map((error) => `independent-control: ${error}`),
  ];
  if (errors.length > 0) {
    throw new Error(["Seed corpora не прошли предзаписную валидацию:", ...errors.map((error) => `- ${error}`)].join("\n"));
  }
}

function regulatoryDate(value: string | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

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
  description?: string;
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
  {
    slug: "glaztsentr-tyumen",
    title: "ООО «Глазцентр-Тюмень»",
    legalName: "ООО «Глазцентр-Тюмень»",
    description:
      "Карточка организации связана с опубликованным расследованием Ассоциации о проверке использования офтальмологического оборудования.",
    city: "Тюмень",
    region: "Тюменская область",
    clinicType: "clinic",
    status: "active",
    omsEnabled: false,
    phones: [],
    address: "Тюмень, Червишевский тракт, 2",
    inn: "7203541400",
    license: "Л041-01107-72/00648949 от 25.04.2023",
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
  C15: "glaztsentr-tyumen",
};

type DoctorSeed = {
  slug: string;
  lastName: string;
  firstName: string;
  middleName: string;
  position: string | null;
  category: string;
  experienceYears: number;
  credo: string | null;
  prodoctorovUrl: string | null;
  siteUrl: string | null;
  bio?: string | null;
  career?: string | null;
  region?: string | null;
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
    slug: "alcon-allegretto-wave-eye-q",
    title: "Alcon ALLEGRETTO Wave Eye-Q",
    categoryTitle: "Лазерные системы",
    manufacturer: "Alcon",
    country: "Германия",
    year: 2003,
    summary:
      "Эксимерная лазерная система WaveLight / Alcon второго поколения для рефракционной хирургии: LASIK, волновой фронт LASIK, топографически-управляемый LASIK и ФРК в пределах показаний, утверждённых регулятором.",
    description:
      "ALLEGRETTO Wave Eye-Q — стационарная эксимерная лазерная система WaveLight, входящая в портфель Alcon. В материалах FDA она описана как второе поколение стационарных сканирующих эксимерных систем WaveLight: компактный ArF-лазер, гальванометрический сканер и встроенный трекер положения глаза работают как единый контур нанесения абляции. В информационном буклете FDA производителем системы указан WaveLight GmbH, Германия.\n\nДля топографически-управляемого LASIK система используется совместно с топографом ALLEGRO Topolyzer и программным модулем T-CAT. План лечения строится по манифестной рефракции, топографическим данным и настройкам врача; программное обеспечение проверяет целостность файла до окончательного подтверждения лечения. Указанные показания относятся к маркировке FDA и не заменяют оценку конкретного пациента врачом или локальные регистрационные требования.",
    principle:
      "Аргон-фторидный (ArF) эксимерный лазер с длиной волны 193 нм формирует ультрафиолетовые импульсы и через гальванометрический сканер позиционирует сканирующее пятно на роговице. Частота импульсов Eye-Q составляет 400 Гц; в документации FDA приведена длительность импульса 10 нс ± 5 нс. Встроенный eye tracker определяет положение глаза перед каждым импульсом, обеспечивает автоматическую центрацию абляции и при чрезмерном смещении глаза останавливает лечение. В пациентском буклете FDA размер одного импульса описан как менее 1 мм.",
    advantages: [
      "Сканирующая система: гальванометрический сканер позиционирует лазерное пятно, а встроенный eye tracker корректирует его направление по положению глаза.",
      "Автоматическая центрация и контроль движения глаза: по маркировке FDA трекер выравнивает импульс с роговицей перед его подачей и останавливает лечение при чрезмерном смещении глаза.",
      "Топографически-управляемый контур T-CAT: совместимая связка Eye-Q, ALLEGRO Topolyzer и T-CAT использует топографию роговицы и манифестную рефракцию для построения плана LASIK.",
      "Волновой фронт LASIK: FDA расширила показания Eye-Q на wavefront-guided LASIK отдельным дополнением к PMA.",
      "Планирование вне операционной зоны: WaveNet Planning Software позволяет готовить планы лечения на совместимом ноутбуке до передачи их в систему.",
    ],
    indications: [
      "LASIK: базовая маркировка FDA — коррекция миопии до −12,0 D и астигматизма до 6,0 D у пациентов от 18 лет со стабильной манифестной рефракцией.",
      "Wavefront-guided LASIK: до −7,0 D сферического эквивалента миопии или миопии с астигматизмом; до −7,0 D сферического и до −3,0 D астигматического компонента (FDA PMA P020050/S004).",
      "Топографически-управляемый LASIK (T-CAT): Eye-Q + ALLEGRO Topolyzer + T-CAT — до −9,0 D сферического эквивалента миопии; до −8,0 D сферического и до −3,0 D астигматического компонента (FDA PMA P020050/S012).",
      "Фоторефракционная кератэктомия (ФРК / PRK): до −6,0 D сферического эквивалента миопии или миопии с астигматизмом; до −6,0 D сферического и до −3,0 D астигматического компонента (FDA PMA P020050/S023).",
      "Точные показания, допустимые диапазоны и доступность программных модулей зависят от утверждённой маркировки в конкретной юрисдикции.",
    ],
    limitations: [
      "Противопоказания в маркировке FDA для T-CAT LASIK включают беременность и кормление грудью, заболевания соединительной ткани / аутоиммунные или иммунодефицитные состояния, кератоконус или подозрение на него, выраженный синдром сухого глаза, повторяющуюся эрозию роговицы, выраженную глаукому и неконтролируемый сахарный диабет.",
      "Для T-CAT LASIK противопоказанием является расчётная толщина остаточного стромального ложа менее 250 мкм; клиническая пригодность пациента определяется до вмешательства врачом.",
      "Противопоказания и риски различаются для LASIK и ФРК. Полный перечень предупреждений и осложнений приведён в прикреплённых документах FDA; эта карточка не является инструкцией по применению.",
      "Текущий статус производства модели и регистрационное удостоверение в России не указаны: в карточку не добавляется вывод без официального подтверждающего документа.",
    ],
    images: [
      "/equipment/alcon-allegretto-wave-eye-q/alcon-allegretto-wave-eye-q-system.jpg",
      "/equipment/alcon-allegretto-wave-eye-q/alcon-topography-workflow-interface.png",
      "/equipment/alcon-allegretto-wave-eye-q/alcon-treatment-planning-interface.jpeg",
    ],
    manuals: [
      "/equipment/alcon-allegretto-wave-eye-q/fda-summary-safety-effectiveness-lasik.pdf",
      "/equipment/alcon-allegretto-wave-eye-q/fda-summary-safety-effectiveness-wavefront-lasik.pdf",
      "/equipment/alcon-allegretto-wave-eye-q/fda-summary-safety-effectiveness-t-cat.pdf",
      "/equipment/alcon-allegretto-wave-eye-q/fda-procedure-manual-topography-guided-lasik.pdf",
      "/equipment/alcon-allegretto-wave-eye-q/fda-patient-information-topography-guided-lasik.pdf",
      "/equipment/alcon-allegretto-wave-eye-q/fda-summary-safety-effectiveness-prk.pdf",
    ],
    specs: [
      { group: "Идентификация линейки", label: "Серия", value: "WaveLight excimer systems" },
      { group: "Идентификация линейки", label: "Позиция в линии", value: "2" },
      { group: "Общие", label: "Тип системы", value: "Стационарная сканирующая эксимерная лазерная система для рефракционной хирургии" },
      { group: "Общие", label: "Поколение платформы WaveLight", value: "Второе; последующее поколение — WaveLight EX500 (FDA SSED P020050/S023)" },
      { group: "Общие", label: "Производитель в информационном буклете FDA", value: "WaveLight GmbH, Германия; портфель Alcon" },
      { group: "Оптические данные", label: "Источник лазерного излучения", value: "Аргон-фторидный (ArF) эксимерный лазер" },
      { group: "Оптические данные", label: "Класс лазера", value: "Класс 4" },
      { group: "Оптические данные", label: "Длина волны", value: "193 нм" },
      { group: "Оптические данные", label: "Частота импульсов", value: "400 Гц" },
      { group: "Оптические данные", label: "Длительность импульса", value: "10 нс ± 5 нс" },
      { group: "Оптические данные", label: "Размер лазерного пятна", value: "Менее 1 мм (информационный буклет FDA)" },
      { group: "Система наведения", label: "Позиционирование пятна", value: "Гальванометрический сканер" },
      { group: "Система наведения", label: "Eye tracking", value: "Встроенный; определение положения глаза, автоматическая центрация и контроль направления луча" },
      { group: "Планирование лечения", label: "Топографически-управляемое лечение", value: "ALLEGRO Topolyzer + T-CAT (при соответствующей лицензии и совместимости устройств)" },
      { group: "Планирование лечения", label: "Программное обеспечение", value: "WaveNet Planning Software; перенос плана на ноутбук системы и проверка целостности файла" },
      { group: "Комплектация", label: "Основные компоненты", value: "Лазерный блок, гальванометрический сканер, eye tracker, микроскоп, компьютерные панели и мониторы, подвижная пациентская кушетка" },
      { group: "Комплектация", label: "Управление", value: "Ножная педаль показана на официальном изображении системы в информационном буклете FDA" },
      { group: "Регуляторный статус", label: "FDA: исходное показание LASIK", value: "PMA P020050; исходное одобрение 7 октября 2003 года" },
      { group: "Регуляторный статус", label: "FDA: Wavefront-guided LASIK", value: "PMA P020050/S004" },
      { group: "Регуляторный статус", label: "FDA: T-CAT LASIK", value: "PMA P020050/S012; решение от 27 сентября 2013 года" },
      { group: "Регуляторный статус", label: "FDA: ФРК (PRK)", value: "PMA P020050/S023" },
      { group: "Регуляторный статус", label: "CE / Росздравнадзор", value: "Подтверждающие документы для конкретной модели в публичную карточку не добавлены: статус не утверждается без первичного документа" },
    ],
    // Связь модели с клиникой требует отдельного доказательства. Расследование
    // связывает конкретный экземпляр через InvestigationEquipmentInstance;
    // ClinicOnEquipment этот seed намеренно не создаёт и не изменяет.
    clinicIds: [],
    procedureSlugs: ["lazernaya-korrektsiya-zreniya", "lasik"],
    diseaseSlugs: ["miopiya", "astigmatizm"],
  },
  {
    slug: "wavelight-allegretto-wave",
    title: "WaveLight ALLEGRETTO Wave",
    categoryTitle: "Лазерные системы",
    manufacturer: "WaveLight GmbH",
    country: "Германия",
    year: 2000,
    summary:
      "Исходная эксимерная лазерная система WaveLight, представленная в 2000 году: сканирующее пятно, два гальванометрических сканера и встроенный eye tracker; одобрение FDA для рынка США — 2003 год.",
    description:
      "WaveLight ALLEGRETTO Wave — исходная модель эксимерной платформы WaveLight, представленная в 2000 году согласно официальной хронологии производителя. В исходной сводке безопасности и эффективности FDA описана сканирующая система с компактным эксимерным лазером, парой прецизионных гальванометрических сканеров и интегрированным трекером положения глаза. Одобренная FDA в 2003 году для рынка США версия Model 1008 работала с частотой 200 Гц.\n\nЭта модель стала основой последующих регуляторных дополнений платформы: Eye-Q с повышенной частотой импульсов и EX500 с новым лазерным блоком, сканером, трекером и интерфейсом. В карточке показана именно версия, описанная в исходном документе FDA; сведения о более поздних конфигурациях вынесены в их собственные страницы.",
    principle:
      "Аргон-фторидный эксимерный лазер с длиной волны 193 нм формирует сканирующее пятно. Два гальванометрических сканера позиционируют его на роговице, а интегрированный eye tracker отслеживает положение глаза и прерывает лечение при выходе за заданный диапазон. В исходной документации FDA для Model 1008 указана частота 200 Гц.",
    advantages: [
      "Сканирующее пятно малого диаметра и гальванометрическое позиционирование — конструктивная основа платформы WaveLight.",
      "Интегрированный eye tracker контролирует положение глаза и может прервать лечение при выходе за заданный диапазон.",
      "Компактный источник с малым объёмом газа и низким расходом газа описан в исходной сводке FDA.",
    ],
    indications: [
      "LASIK: исходное одобрение FDA — уменьшение или устранение миопии до −12,0 D и астигматизма до 6,0 D у пациентов от 18 лет со стабильной манифестной рефракцией.",
      "Конкретные показания зависят от версии системы и утверждённой маркировки; расширения для Eye-Q и EX500 описаны в карточках следующих поколений.",
    ],
    limitations: [
      "Противопоказания и предупреждения относятся к конкретной маркировке и пациенту; полный список приведён в прикреплённой сводке FDA.",
      "Параметры этой карточки относятся к исходной версии Model 1008 2003 года и не должны переноситься на Eye-Q или EX500 без их собственных документов.",
      "Текущий коммерческий статус исходной модели не утверждается без официального подтверждающего документа.",
    ],
    manuals: ["/equipment/wavelight-allegretto-wave/fda-summary-safety-effectiveness-lasik.pdf"],
    specs: [
      { group: "Идентификация линейки", label: "Серия", value: "WaveLight excimer systems" },
      { group: "Идентификация линейки", label: "Позиция в линии", value: "1" },
      { group: "Общие", label: "Версия, описанная в документе", value: "Model 1008" },
      { group: "Оптические данные", label: "Тип лазера", value: "Аргон-фторидный эксимерный лазер" },
      { group: "Оптические данные", label: "Длина волны", value: "193 нм" },
      { group: "Оптические данные", label: "Частота импульсов", value: "200 Гц" },
      { group: "Оптические данные", label: "Флюенс", value: "200 мДж/см² в среднем; 400 мДж/см² пиковое значение" },
      { group: "Оптические данные", label: "Оптическая зона", value: "4,5–8,0 мм; в клиническом исследовании — 6,5 мм" },
      { group: "Оптические данные", label: "Зона абляции", value: "5,2–8,7 мм для сферических; 7,0–9,0 мм для цилиндрических и сфероцилиндрических коррекций" },
      { group: "Система наведения", label: "Позиционирование", value: "Пара прецизионных гальванометрических сканеров" },
      { group: "Система наведения", label: "Eye tracking", value: "Интегрированный; отслеживание быстрых движений глаза и прерывание лечения при выходе за заданный диапазон" },
      { group: "Регуляторный статус", label: "FDA", value: "PMA P020050; решение от 7 октября 2003 года" },
    ],
    procedureSlugs: ["lazernaya-korrektsiya-zreniya", "lasik"],
    diseaseSlugs: ["miopiya", "astigmatizm"],
  },
  {
    slug: "wavelight-ex500",
    title: "WaveLight EX500",
    categoryTitle: "Лазерные системы",
    manufacturer: "Alcon",
    country: "Германия",
    year: 2011,
    summary:
      "Эксимерная лазерная система WaveLight / Alcon следующего поколения: 500 Гц, обновлённые лазерная голова, scanner и eye tracker; поддерживает персонализированные профили в составе WaveLight Refractive Suite.",
    description:
      "WaveLight EX500 — эксимерная лазерная система WaveLight / Alcon, регуляторное изменение которой FDA одобрила в 2011 году. В решении FDA прямо указаны повышение частоты импульсов с 400 до 500 Гц, новый лазерный блок, обновлённые корпус и интерфейс, новые scanner и eye tracker, сетевые возможности и программное обеспечение.\n\nНа актуальной официальной странице Alcon EX500 описан как эксимерный лазер с частотой 500 Гц и eye tracker 1050 Гц, предназначенный для интеграции с WaveLight Refractive Suite. Перечень поддерживаемых методик и их доступность зависят от маркировки и конфигурации в конкретной юрисдикции.",
    principle:
      "EX500 — сканирующая эксимерная система следующего поколения внутри платформы WaveLight. По официальному решению FDA 2011 года новая конфигурация включает обновлённые laser head, scanner, eye tracker, интерфейс и программное обеспечение; официальный сайт Alcon указывает 500 Гц для абляции и 1050 Гц для eye tracker.",
    advantages: [
      "Увеличенная до 500 Гц частота импульсов в сравнении с 400 Гц у Eye-Q по решению FDA S006.",
      "Обновлённые laser head, scanner и eye tracker — составная часть одобренной FDA конфигурации EX500.",
      "Официальная страница Alcon указывает интеграцию с WaveLight Refractive Suite и поддержку Ray Tracing Guided, Topography Guided и Wavefront Optimized процедур.",
      "Производитель описывает Z-axis alignment, cross-line projector и multi-spatial eye tracking как компоненты системы точного позиционирования.",
    ],
    indications: [
      "LASIK: диапазоны исходной маркировки WaveLight включают коррекцию миопии до −12,0 D и астигматизма до 6,0 D, а также гиперметропии до +6,0 D с учётом условий маркировки FDA.",
      "Wavefront-guided LASIK: для WaveLight-эксимерных систем — в пределах условий маркировки FDA.",
      "Topography-guided LASIK и PRK: применимость требует соответствующей одобренной конфигурации и маркировки; EX500 и Eye-Q совместно добавлены в FDA-дополнение P020050/S023 для PRK.",
    ],
    limitations: [
      "Противопоказания, предупреждения и диапазоны коррекции нужно сверять с актуальной инструкцией по применению для конкретной версии и страны обращения.",
      "Сама по себе частота 500 Гц не является показанием к операции и не заменяет предоперационное обследование.",
      "Подтверждающие документы о регистрации конкретной системы в России не добавлены — статус не утверждается без первичного документа.",
    ],
    images: ["/equipment/wavelight-ex500/alcon-wavelight-ex500-system.png"],
    manuals: ["/equipment/wavelight-ex500/fda-summary-safety-effectiveness-prk.pdf"],
    specs: [
      { group: "Идентификация линейки", label: "Серия", value: "WaveLight excimer systems" },
      { group: "Идентификация линейки", label: "Позиция в линии", value: "3" },
      { group: "Общие", label: "Тип системы", value: "Стационарная сканирующая эксимерная лазерная система" },
      { group: "Оптические данные", label: "Частота абляции", value: "500 Гц" },
      { group: "Система наведения", label: "Частота eye tracker", value: "1050 Гц (официальная страница Alcon)" },
      { group: "Система наведения", label: "Позиционирование", value: "Z-axis alignment, cross-line projector и multi-spatial eye tracking (Alcon)" },
      { group: "Конструкция", label: "Изменения относительно Eye-Q", value: "Новый laser head, scanner, eye tracker, корпус, интерфейс, сетевые возможности и программное обеспечение" },
      { group: "Интеграция", label: "Платформа", value: "WaveLight Refractive Suite" },
      { group: "Регуляторный статус", label: "FDA: EX500", value: "PMA P020050/S006; решение от 23 ноября 2011 года" },
      { group: "Регуляторный статус", label: "FDA: PRK", value: "PMA P020050/S023; решение от 21 ноября 2016 года для EX500 и Eye-Q" },
    ],
    procedureSlugs: ["lazernaya-korrektsiya-zreniya", "lasik"],
    diseaseSlugs: ["miopiya", "astigmatizm"],
  },
  {
    slug: "wavelight-refractive-suite",
    title: "WaveLight Refractive Suite",
    categoryTitle: "Лазерные системы",
    manufacturer: "Alcon",
    year: 2010,
    summary:
      "Интегрированный рефракционный комплекс Alcon WaveLight: EX500, FS200 и WaveNet Planning Station; платформа представлена WaveLight в 2010 году и получила официально описанные обновления в 2018 году.",
    description:
      "WaveLight Refractive Suite — не отдельный эксимерный лазер, а комплексная рефракционная платформа Alcon, в которой EX500 используется вместе с фемтосекундным лазером FS200 и WaveNet Planning Station. Карточка выделена как самостоятельный узел оборудования, потому что производитель описывает Suite как целостный комплекс с единым клиническим рабочим процессом.\n\nВ официальном сообщении Alcon 2018 года описаны обновлённый графический интерфейс, эргономические элементы, панель управления и взаимодействие EX500, FS200 и WaveNet при топографически-управляемом LASIK. Показанное изображение — официальный вид компонента EX500, входящего в состав комплекса; оно не выдаётся за фотографию всей Suite.",
    principle:
      "Комплекс объединяет планирование, диагностику и работу лазерных систем в едином рабочем процессе. В официальном сообщении Alcon названы WaveNet Planning Station, EX500 Excimer Laser и FS200 Femtosecond Laser; план лечения подготавливается в цифровом контуре и передаётся для выполнения соответствующей лазерной системе.",
    advantages: [
      "Единый контур от планирования в WaveNet до выполнения вмешательства на EX500 и FS200.",
      "Обновление 2018 года: более контрастный графический интерфейс, подсветка клавиатуры, обновлённые control panel и heads-up display.",
      "Поддержка topography-guided LASIK в сочетании с Contoura Vision в описанной Alcon конфигурации.",
    ],
    indications: [
      "Рефракционные лазерные процедуры выполняются компонентами комплекса в рамках утверждённой маркировки — в частности LASIK и PRK для эксимерных систем WaveLight.",
      "Миопия и астигматизм — рефракционные состояния, указанные в маркировке WaveLight-эксимерных систем; допустимые диапазоны зависят от конкретной процедуры и устройства.",
    ],
    limitations: [
      "Комплекс не заменяет самостоятельные инструкции по применению EX500, FS200 и диагностических компонентов.",
      "Показания, противопоказания и регистрационный статус необходимо проверять по инструкции и документам конкретного компонента в стране использования.",
      "Официальный PDF-документ именно для конфигурации Suite 2018 в локальную карточку не добавлен; история подтверждена официальным сообщением Alcon.",
    ],
    images: ["/equipment/wavelight-refractive-suite/wavelight-ex500-component.png"],
    specs: [
      { group: "Идентификация линейки", label: "Серия", value: "WaveLight excimer systems" },
      { group: "Идентификация линейки", label: "Позиция в линии", value: "4" },
      { group: "Тип объекта", label: "Формат", value: "Интегрированный рефракционный комплекс, а не отдельная модель эксимерного лазера" },
      { group: "Состав комплекса", label: "Эксимерный лазер", value: "WaveLight EX500" },
      { group: "Состав комплекса", label: "Фемтосекундный лазер", value: "WaveLight FS200" },
      { group: "Состав комплекса", label: "Планирование", value: "WaveNet Planning Station" },
      { group: "Обновление 2018 года", label: "Интерфейс", value: "Обновлённые GUI для WaveNet, EX500 и FS200" },
      { group: "Обновление 2018 года", label: "Эргономика", value: "Heads-up display, обновлённая control panel и подсветка клавиатуры" },
      { group: "Источник описания", label: "Официальное сообщение", value: "Alcon, 2 октября 2018 года" },
    ],
    procedureSlugs: ["lazernaya-korrektsiya-zreniya", "lasik"],
    diseaseSlugs: ["miopiya", "astigmatizm"],
  },
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

  /**
   * ZEISS VisuMax 500 — фемтосекундная лазерная платформа ZEISS (поколение 500 кГц) для
   * роговичной и рефракционной хирургии: извлечение лентикулы SMILE, формирование лоскута
   * для Фемто-LASIK, тоннели для интрастромальных сегментов (ICR) и кератопластика.
   * Наполнение — по официальным документам ZEISS из data/equipment/visumax-500/:
   *  - VisuMax_Brochure_DE.pdf (ZEISS, DE_34_010_0007V, CZ-X/2020) — техданные, применения;
   *  - SMILE_Brochure_DE.pdf (ZEISS, DE_34_010_0008VII, CZ-X/2020) — диапазон коррекции SMILE;
   *  - zeiss.com/meditec/.../visumax.html — сверка (500 кГц).
   * Официально ZEISS называет модель «VisuMax» (поколение 500 кГц); «500» — обозначение по
   * частоте, отличающее её от VisuMax 800 (2 МГц); в энциклопедии используется название
   * «ZEISS VisuMax 500».
   * PDF в БД не хранится — в базу записывается только ссылка на файл в public/. Год появления
   * достоверно не подтверждён → оставлен пустым.
   */
  {
    slug: "zeiss-visumax-500",
    title: "ZEISS VisuMax 500",
    categoryTitle: "Лазерные системы",
    manufacturer: "Carl Zeiss Meditec AG",
    country: "Германия",
    // year: не подтверждён достоверным источником → оставлено пустым
    summary:
      "Фемтосекундная лазерная платформа ZEISS (500 кГц) для роговичной и рефракционной хирургии: извлечение лентикулы SMILE, формирование лоскута для Фемто-LASIK, тоннели для интрастромальных сегментов и кератопластика.",
    description:
      "ZEISS VisuMax 500 — фемтосекундная лазерная платформа компании Carl Zeiss Meditec (Йена, Германия) для роговичной и рефракционной хирургии. Это первое фемтосекундное лазерное устройство, на котором выполняется минимально инвазивная методика извлечения лентикулы SMILE. Частота повторения импульсов 500 кГц обеспечивает короткое время лечения и высокую пропускную способность. В комбинации с эксимерным лазером ZEISS MEL 90 и станцией планирования CRS-Master платформа объединяет все три метода рефракционной лазерной хирургии: поверхностную абляцию (PRK/LASEK), хирургию лоскута (Фемто-LASIK/LASIK) и извлечение лентикулы (SMILE). Изогнутые под анатомию роговицы одноразовые контактные стёкла (размеры S/M/L) сохраняют естественную форму роговицы и не создают избыточного внутриглазного давления. Устройство оснащено интегрированным хирургическим микроскопом ZEISS с цифровой видеокамерой и щелевым освещением, а поворотная кушетка позволяет быстро перемещать пациента от фемтосекундного к эксимерному лазеру.",
    principle:
      "Фемтосекундный лазер с длиной волны 1043 нм и длительностью импульса 220–580 фс фокусируется внутри стромы роговицы, где за счёт фотодеструкции формирует заданный рисунок реза, не повреждая вышележащие слои. При SMILE внутри интактной роговицы вырезается тонкая линза — лентикула, которую хирург извлекает через микродоступ 2–4 мм; при Фемто-LASIK лазер формирует роговичный лоскут. Частота повторения импульсов 500 кГц обеспечивает короткое время лечения.",
    advantages: [
      "Частота повторения импульсов 500 кГц: короткое время лечения — больше комфорта для врача и пациента (данные ZEISS).",
      "SMILE без лоскута: малый доступ 2–4 мм, площадь бокового реза до 80 % меньше, а площадь ламеллярного реза (cap) до 30 % меньше, чем при Фемто-LASIK.",
      "Меньше пересечённых нервов и коллагеновых волокон: потенциально реже транзиторный синдром сухого глаза, ниже риск инфекций и врастания эпителия.",
      "Изогнутые одноразовые контактные стёкла трёх размеров (S/M/L) под анатомию роговицы: сохранение естественной формы без избыточного повышения ВГД.",
      "Высокоточная оптика ZEISS: минимальная энергия импульса при высокой частоте для точного трёхмерного реза на заданной глубине.",
      "Интегрированный хирургический микроскоп ZEISS с цифровой видеокамерой и щелевым освещением для непосредственного контроля результата без смены положения пациента.",
      "В комбинации с эксимерным лазером ZEISS MEL 90 и станцией CRS-Master — единая платформа для PRK/LASEK, Фемто-LASIK (в т. ч. PRESBYOND) и SMILE.",
      "Поворотная кушетка: быстрое и удобное перемещение пациента от фемтосекундного к эксимерному лазеру.",
    ],
    indications: [
      "Миопия — извлечение лентикулы по технологии SMILE: сфера −0,50…−10,00 дптр (брошюра ZEISS SMILE).",
      "Астигматизм — извлечение лентикулы по технологии SMILE: цилиндр 0…5,00 дптр; сферический эквивалент −0,50…−12,50 дптр (брошюра ZEISS SMILE).",
      "Формирование роговичного лоскута для Фемто-LASIK, в том числе PRESBYOND Laser Blended Vision для пациентов с пресбиопией.",
      "Формирование роговичных тоннелей для имплантации интрастромальных сегментов (ICR): сегменты 90–270°, в т. ч. с наклонной геометрией реза.",
      "Кератопластика: сквозная (PKP), глубокая передняя послойная (DALK) и эндотелиальная (DSEK) — опция Keratoplasty.",
      "Докоррекция после SMILE: опция CIRCLE преобразует ранее сформированную инцизию в лоскут.",
    ],
    limitations: [
      "Условия эксплуатации: температура +18…+25 °C, влажность 30–70 %.",
      "Масса устройства 870 кг (с кушеткой, платформой и ИБП) — требуется подготовленное помещение.",
      "Лазер класса 3B (DIN EN 60825-1): невидимое лазерное излучение, облучение недопустимо.",
      "Объём одобренных показаний и доступность опций различаются по странам (примечание ZEISS в брошюре).",
      "Медицинские противопоказания к вмешательству определяются врачом по результатам диагностики и в брошюре производителя не приводятся.",
    ],
    images: [
      "/equipment/zeiss-visumax-500/visumax-500-device.jpg",
      "/equipment/zeiss-visumax-500/visumax-500-mel-90-combination.jpg",
      "/equipment/zeiss-visumax-500/visumax-500-docking.jpg",
    ],
    manuals: [
      "/equipment/zeiss-visumax-500/zeiss-visumax-brochure-de.pdf",
      "/equipment/zeiss-visumax-500/zeiss-smile-brochure-de.pdf",
    ],
    specs: [
      { group: "Общие", label: "Тип лазера", value: "Фемтосекундный лазер" },
      { group: "Общие", label: "Доступные вмешательства", value: "SMILE, Фемто-LASIK (Flap), CIRCLE, ИРС (ICR), кератопластика" },
      { group: "Общие", label: "Комбинация с эксимерным лазером", value: "ZEISS MEL 90 (PRK/LASEK, Фемто-LASIK, PRESBYOND); станция планирования CRS-Master" },
      { group: "Оптические данные", label: "Длина волны", value: "1043 нм" },
      { group: "Оптические данные", label: "Длительность импульса", value: "220–580 фс" },
      { group: "Оптические данные", label: "Частота повторения импульсов", value: "500 кГц" },
      { group: "Оптические данные", label: "Класс лазера", value: "3B (DIN EN 60825-1); 190 мВт" },
      { group: "Диапазон коррекции SMILE", label: "Сфера", value: "−0,50…−10,00 дптр" },
      { group: "Диапазон коррекции SMILE", label: "Цилиндр", value: "0…5,00 дптр" },
      { group: "Диапазон коррекции SMILE", label: "Сферический эквивалент", value: "−0,50…−12,50 дптр" },
      { group: "Хирургический микроскоп", label: "Оснащение", value: "Интегрированный микроскоп ZEISS с щелевым освещением и цифровой видеокамерой" },
      { group: "Расходные материалы", label: "Контактные стёкла", value: "Одноразовые, размеры S / M / L и тип KP (кератопластика)" },
      { group: "Условия эксплуатации", label: "Температура", value: "+18 °C…+25 °C" },
      { group: "Условия эксплуатации", label: "Влажность", value: "30 %…70 %" },
      { group: "Электропитание", label: "Электрический разъём", value: "100–240 В, 50/60 Гц, макс. 16 A" },
      { group: "Габариты и масса", label: "Масса устройства", value: "870 кг (с кушеткой, платформой, ИБП)" },
      { group: "Габариты и масса", label: "Площадь основания (отдельно стоящее)", value: "Ш × Г: 3,80 м × 4,40 м" },
      { group: "Габариты и масса", label: "Площадь основания (MEL 90 + VisuMax, 90°)", value: "Ш × Г: 3,92 м × 3,94 м" },
    ],
    // Клиника: C02.
    clinicIds: ["C02"],
    // Процедуры: подтверждено брошюрой ZEISS VisuMax (SMILE, Фемто-LASIK, ICR-тоннели).
    // SMILE pro НЕ включён — это исключительно VisuMax 800 (2 МГц).
    procedureSlugs: ["smile", "femto-lasik", "implantatsiya-rogovichnykh-segmentov"],
    // Заболевания: брошюра ZEISS SMILE прямо указывает «SMILE für Myopie und Astigmatismus».
    diseaseSlugs: ["miopiya", "astigmatizm"],
    // Врачи: достоверного источника, называющего конкретного врача именно на VisuMax 500,
    // нет → связи не создаются (запрет на вывод по месту работы).
    doctorSlugs: [],
  },
  {
    slug: "lightmed-lightlas-slt-yag",
    title: "Lightmed Lightlas SLT/YAG",
    categoryTitle: "Лазерные системы",
    manufacturer: "LIGHTMED",
    country: "США / Тайвань",
    summary:
      "Комбинированная офтальмологическая YAG/SLT-платформа Lightmed: в клиническом случае Островерхова А. И. YAG-режим 1064 нм использован для лазерной гиалоидопунктуры при ретинопатии Вальсальвы.",
    description:
      "В статье Островерхова А. И. Lightmed Lightlas SLT/YAG указан как YAG-лазер с длиной волны 1064 нм, использованный для YAG лазерной гиалоидопунктуры при массивном субгиалоидном кровоизлиянии. Официальная брошюра LIGHTMED описывает LIGHTLas SLT Deux-V как комбинированную SLT/YAG-систему с Q-switched Nd:YAG 1064 нм, SLT-режимом 532 нм, интегрированной щелевой лампой, фокусным смещением ±500 мкм и опциями расширения рабочего места. В карточке разделены параметры, подтверждённые статьёй, и технические данные из официальной документации производителя.",
    principle:
      "YAG-режим использует короткий импульс Q-switched Nd:YAG 1064 нм для фотодеструкции в заданной точке фокуса. В опубликованном клиническом случае импульсы наносились по нижнему краю субгиалоидного кровоизлияния до выхода крови в полость стекловидного тела; SLT-режим этой платформы в официальной брошюре описан как низкоэнергетическое воздействие 532 нм на трабекулярную сеть.",
    advantages: [
      "Комбинированная YAG/SLT-платформа в одном рабочем месте.",
      "Двухлучевая YAG-система наведения и отдельное SLT-наведение.",
      "Пятиступенчатое увеличение 5×, 8×, 14×, 25× и 38×.",
      "Диапазон фокусного смещения ±500 мкм для переднего и заднего офсета.",
      "Пассивное воздушное охлаждение и модульная конструкция обслуживания по данным производителя.",
    ],
    indications: [
      "YAG лазерная гиалоидопунктура в описанном клиническом случае ретинопатии Вальсальвы.",
      "YAG-капсулотомия, периферическая иридотомия и витреолизис — как области применения YAG-V/SLT Deux-V, указанные в официальных материалах LIGHTMED.",
      "SLT для снижения внутриглазного давления при глаукоме — согласно официальной брошюре SLT Deux-V.",
    ],
    limitations: [
      "Связь с ретинопатией Вальсальвы и параметрами 6 импульсов по 4,5 мДж относится только к опубликованному клиническому случаю.",
      "Карточка не создаёт связь с клиникой: предоставленная статья не подтверждает место установки аппарата.",
      "Технические характеристики приведены по официальным брошюрам LIGHTMED и не заменяют актуальную инструкцию по эксплуатации конкретной поставки.",
    ],
    images: [
      "/equipment/lightmed-lightlas-slt-yag/lightmed-slt-deux-v-workstation.jpg",
      "/equipment/lightmed-lightlas-slt-yag/lightmed-slt-deux-v-system.png",
      "/equipment/lightmed-lightlas-slt-yag/lightmed-yag-v-system.png",
    ],
    manuals: [
      "/equipment/lightmed-lightlas-slt-yag/lightmed-slt-deux-v-brochure.pdf",
      "/equipment/lightmed-lightlas-slt-yag/lightmed-lightlas-yag-v-brochure.pdf",
      "/equipment/lightmed-lightlas-slt-yag/lightmed-lightlas-slt-brochure.pdf",
    ],
    specs: [
      { group: "Идентификация", label: "Модель, указанная в статье", value: "Lightmed Lightlas SLT/YAG" },
      { group: "Идентификация", label: "Официальная модель в брошюре", value: "LIGHTLas SLT Deux-V" },
      { group: "Идентификация", label: "Платформа", value: "SLT/YAG combination system" },
      { group: "Идентификация", label: "Регистрационное наименование в брошюре", value: "Lightlas SeLecTor Deux (FDA and CE registered model name)" },
      { group: "Оптические данные", label: "Тип лазера в статье", value: "YAG-лазер" },
      { group: "YAG Mode", label: "Тип лазера", value: "Q-Switched Nd:YAG" },
      { group: "YAG Mode", label: "Длина волны", value: "1064 нм" },
      { group: "YAG Mode", label: "Диапазон энергии", value: "0,2–≤15 мДж (single pulse); 10–≤25 мДж (double pulse); 20–≤45 мДж (triple pulse)" },
      { group: "YAG Mode", label: "Длительность импульса", value: "4 нс" },
      { group: "YAG Mode", label: "Burst mode", value: "1, 2 или 3 импульса за выстрел, выбирается пользователем" },
      { group: "YAG Mode", label: "Размер пятна", value: "8 мкм" },
      { group: "YAG Mode", label: "Угол конуса", value: "16°" },
      { group: "YAG Mode", label: "Смещение лечебного луча", value: "±500 мкм, плавная регулировка" },
      { group: "YAG Mode", label: "Прицельный луч", value: "Двухлучевой лазерный диод, красный 635 нм, плавная регулировка" },
      { group: "SLT Mode", label: "Тип лазера SLT", value: "Q-switched frequency-doubled Nd:YAG" },
      { group: "SLT Mode", label: "Длина волны SLT", value: "532 нм" },
      { group: "SLT Mode", label: "Диапазон энергии SLT", value: "0,2–2,6 мДж, плавная регулировка" },
      { group: "SLT Mode", label: "Длительность импульса SLT", value: "3 нс" },
      { group: "SLT Mode", label: "Размер пятна SLT", value: "400 мкм" },
      { group: "SLT Mode", label: "Угол конуса SLT", value: "<3°" },
      { group: "Оптика и рабочее место", label: "Лазерная доставка", value: "Интегрированная щелевая лампа Galilean, стереоскопический 16× микроскоп" },
      { group: "Оптика и рабочее место", label: "Увеличение", value: "5 положений: 5×, 8×, 14×, 25×, 38×" },
      { group: "Оптика и рабочее место", label: "Повторение импульсов", value: "До 3,0 Гц" },
      { group: "Оптика и рабочее место", label: "Защитный фильтр", value: "Fixed OD5 @ 1064 нм и 532 нм" },
      { group: "Электропитание", label: "Питание", value: "100–240 VAC, 50–60 Hz, auto-ranging" },
      { group: "Электропитание", label: "Потребляемая мощность", value: "200 VA" },
      { group: "Габариты и масса", label: "Габариты", value: "45 × 34 × 52 см" },
      { group: "Габариты и масса", label: "Масса", value: "24 кг система; 33 кг в упаковке" },
      { group: "Параметры клинического случая", label: "Количество импульсов", value: "6" },
      { group: "Параметры клинического случая", label: "Мощность импульса", value: "4,5 мДж" },
      { group: "Сопутствующая оптика", label: "Линза", value: "VOLK SUPER QUAD 160" },
    ],
    procedureSlugs: ["yag-lazernaya-gialoidopunktura"],
    diseaseSlugs: ["retinopatiya-valsalvy"],
  },
  {
    slug: "volk-super-quad-160",
    title: "VOLK SUPER QUAD 160",
    categoryTitle: "Оптические приборы",
    manufacturer: "Volk Optical",
    country: "США",
    summary:
      "Контактная офтальмологическая лазерная линза Volk Super Quad 160: в клиническом случае Островерхова А. И. использована как сопутствующая оптика при YAG лазерной гиалоидопунктуре.",
    description:
      "В статье Островерхова А. И. линза VOLK SUPER QUAD 160 указана как используемая при проведении YAG лазерной гиалоидопунктуры с помощью YAG-лазера 1064 нм Lightmed Lightlas SLT/YAG. Официальная страница и каталог Volk описывают Super Quad 160 как контактную лазерную линзу для широкопольного осмотра сетчатки и лазерных вмешательств, включая панретинальную коагуляцию и работу на дальней периферии сетчатки.",
    principle:
      "Контактная линза расширяет поле визуализации глазного дна и меняет масштаб изображения и лазерного пятна. По официальным данным Volk Super Quad 160 обеспечивает поле зрения 160°/165°, уменьшение изображения 0,50× и увеличение лазерного пятна 2,0×; в статье эта оптика применялась вместе с YAG-лазером при субгиалоидном кровоизлиянии.",
    advantages: [
      "Широкое поле визуализации сетчатки до 160°/165°.",
      "Подходит для PRP и других лазерных процедур на дальней периферии сетчатки по официальному каталогу.",
      "Версия с фланцем рекомендована производителем для лазера из-за лучшей стабильности на роговице.",
      "Официальная страница производителя указывает 30 мм PRP laser lens surface для крупного и чёткого изображения сетчатки.",
    ],
    indications: [
      "Использование при YAG лазерной гиалоидопунктуре в описанном клиническом случае.",
      "Панретинальный осмотр и лазерные процедуры на сетчатке по официальному каталогу Volk.",
      "PRP и другие лазерные вмешательства на дальней периферии сетчатки.",
    ],
    limitations: [
      "Карточка не создаёт связь с клиникой: статья не подтверждает конкретное место использования линзы.",
      "Это оптическая контактная линза, а не самостоятельная лазерная система; клиническое применение зависит от выбранного лазера и методики.",
      "Для контактных лазерных линз Volk обязательны очистка, дезинфекция или стерилизация по инструкции производителя.",
      "В официальном FAQ Volk указано, что варианты с фланцем и без фланца требуют goniosol для визуализации и лазерных процедур.",
    ],
    images: [
      "/equipment/volk-super-quad-160/volk-super-quad-160-lens.png",
      "/equipment/volk-super-quad-160/volk-super-quad-160-field-of-view.jpg",
    ],
    manuals: [
      "/equipment/volk-super-quad-160/volk-catalog-2025.pdf",
      "/equipment/volk-super-quad-160/volk-contact-laser-diagnostic-lenses-care-guide.pdf",
    ],
    specs: [
      { group: "Идентификация", label: "Модель, указанная в статье", value: "VOLK SUPER QUAD 160" },
      { group: "Идентификация", label: "Официальное название", value: "Super Quad® 160 PRP Laser Lens" },
      { group: "Тип объекта", label: "Назначение в статье", value: "Линза для проведения YAG лазерной гиалоидопунктуры" },
      { group: "Связанное оборудование", label: "Лазер", value: "Lightmed Lightlas SLT/YAG" },
      { group: "Официальное применение", label: "Primary application", value: "PRP, widefield view for pan retinal examination and laser treatments" },
      { group: "Оптические данные", label: "Поле зрения", value: "160° / 165°" },
      { group: "Оптические данные", label: "Image magnification", value: "0,50×" },
      { group: "Оптические данные", label: "Laser spot magnification", value: "2,0×" },
      { group: "Контактная часть", label: "Диаметр контакта — flange", value: "16,5 мм" },
      { group: "Контактная часть", label: "Диаметр контакта — no flange", value: "15,7 мм" },
      { group: "Версии", label: "Flange", value: "VSQUAD160" },
      { group: "Версии", label: "No Flange", value: "VSQUAD160NF" },
      { group: "Эксплуатация", label: "Средство для контактного применения", value: "Goniosol требуется для визуализации и лазерных процедур по FAQ Volk" },
      { group: "Эксплуатация", label: "Обработка", value: "Очистка с последующей дезинфекцией высокого уровня или стерилизацией по инструкции Volk" },
    ],
    procedureSlugs: ["yag-lazernaya-gialoidopunktura"],
    diseaseSlugs: ["retinopatiya-valsalvy"],
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
  authors?: readonly string[];
  doctorAuthorIndex?: number | null;
  bibliography?: string | null;
  journal?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  doi?: string | null;
  sourcePageUrl?: string | null;
  sourcePdfUrl?: string | null;
  sourceStatus?: "FULL_TEXT" | "EXTRACTED_PAGES" | "SCANNED_PAGES" | "BIBLIOGRAPHIC_ONLY";
  sourceNote?: string | null;
  contentKind?: "ORIGINAL_RESEARCH" | "CLINICAL_CASE" | "REVIEW" | "THESIS" | "OTHER";
  topic?: string | null;
  /** Заболевания, РЕАЛЬНО исследуемые в работе (не направления автора). */
  diseaseSlugs?: readonly string[];
  /** Процедуры/методики, РЕАЛЬНО исследуемые в работе. */
  procedureSlugs?: readonly string[];
  degree?: string;
  speciality?: string;
  year?: number;
  organization?: string | null;
  supervisor?: string | null;
  summary?: string | null;
  novelty?: readonly string[];
  practicalValue?: readonly string[];
  results?: readonly string[];
  conclusions?: readonly string[];
  publicationCount?: number;
  pdfUrl?: string | null;
  abstractUrl?: string | null;
  images?: readonly string[];
  isPublished?: boolean;
  evidenceValidatedAt?: Date | null;
  publishedAt?: Date | null;
  publicationBlockReason?: string | null;
  rightsVerifiedAt?: Date | null;
  rightsBasis?:
    | "UNVERIFIED"
    | "OPEN_LICENSE"
    | "AUTHOR_PERMISSION"
    | "PUBLISHER_PERMISSION"
    | "USER_CONFIRMED_PERMISSION"
    | "PUBLIC_DOMAIN";
  rightsNote?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  equipmentSlugs?: readonly string[];
  sortOrder?: number;
};

const SCIENTIFIC_WORKS: ScientificWorkSeed[] = [
  ...OSTROVERHOV_SCIENTIFIC_WORKS.map((work, index) => ({
    ...work,
    sortOrder: index + 10,
  })),
  ...CHURAKOV_SCIENTIFIC_WORKS,
  {
    doctorSlug: "ostroverhov-aleksandr-ivanovich",
    slug: "yag-lazernaya-gialoidopunktura-retinopatiya-valsalvy",
    type: "Клинический случай / научная статья",
    authors: ["А.И. Островерхов"],
    doctorAuthorIndex: 0,
    sourceStatus: "FULL_TEXT",
    sourceNote: "Полный текст и клинические иллюстрации представлены в существующей публикации.",
    contentKind: "CLINICAL_CASE",
    title:
      "Клинический случай YAG лазерной гиалоидопунктуры с консервативным лечением при ретинопатии Вальсальвы",
    diseaseSlugs: ["retinopatiya-valsalvy"],
    procedureSlugs: ["yag-lazernaya-gialoidopunktura"],
    equipmentSlugs: ["lightmed-lightlas-slt-yag", "volk-super-quad-160"],
    speciality: "Патология сетчатки; лазерные методы лечения",
    summary:
      "Научная статья описывает клинический случай пациентки 22 лет с резким снижением зрения левого глаза после интенсивных физических нагрузок и массивным субгиалоидным кровоизлиянием в макулярной области. На основании обследования и анамнеза был выставлен диагноз ретинопатия Вальсальвы. В работе описано комбинированное лечение: YAG лазерная гиалоидопунктура с последующим курсом медикаментозной терапии. Уже на следующий день после процедуры острота зрения левого глаза повысилась до 0,9, а на 5-е сутки — до 1,0.",
    novelty: [
      "В актуальности статьи ретинопатия Вальсальвы связана с повышением внутригрудного и внутрибрюшного давления, которое может повышать внутриглазное венозное давление и приводить к повреждению ретинального капилляра, субгиалоидным кровоизлияниям и другим геморрагическим проявлениям.",
      "Длительное нахождение крови в ретровитреальном пространстве описано как фактор риска образования эпиретинальных мембран; поэтому ранняя диагностика, медикаментозное лечение и YAG лазерная гиалоидопунктура представлены как обоснованный подход для предупреждения осложнений.",
    ],
    practicalValue: [
      "Цель работы — поделиться клиническим случаем лечения ретинопатии Вальсальвы путём YAG лазерной гиалоидопунктуры и медикаментозной терапии.",
      "Клинический случай: пациентка Ч., 22 года, обратилась с жалобами на резкое снижение зрения левого глаза в течение 4 дней после интенсивных физических нагрузок; при обследовании острота зрения левого глаза составляла 0,3 и не корригировалась.",
      "Метод лечения: YAG лазерная гиалоидопунктура проведена на YAG-лазере 1064 нм Lightmed Lightlas SLT/YAG с линзой VOLK SUPER QUAD 160 в условиях медикаментозного мидриаза и инстилляционной анестезии; нанесено 6 импульсов мощностью 4,5 мДж в области нижнего края кровоизлияния до выхода крови в полость стекловидного тела.",
      "Консервативное лечение включало парабульбарные инъекции Гемазы 5000 МЕ, таблетки Вобензим по схеме, внутримышечные инъекции Этамзилата натрия 12,5% и эндоназальный электрофорез с 3% раствором калия йодида.",
    ],
    results: [
      "На следующий день после YAG лазерной гиалоидопунктуры острота зрения левого глаза составила 0,9.",
      "На 5-е сутки после комбинированного лечения острота зрения левого глаза составила 1,0.",
      "Контрольное ОКТ на 5-е сутки показало полное рассасывание кровоизлияния в области макулы.",
    ],
    conclusions: [
      "В выводах статьи YAG лазерная гиалоидопунктура с последующим курсом медикаментозного лечения описана как возможный альтернативный и безопасный метод лечения ретинопатии Вальсальвы и субгиалоидных кровоизлияний в короткий временной промежуток.",
    ],
    isPublished: true,
    evidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
    publishedAt: new Date("2026-08-06T00:00:00.000Z"),
    publicationBlockReason: null,
    rightsVerifiedAt: null,
    rightsBasis: "UNVERIFIED",
    rightsNote:
      "Документальное подтверждение прав на локальную копию и иллюстрации не найдено; локальные материалы исключены из публичной проекции до проверки.",
    pdfUrl: null,
    images: [],
    seoTitle:
      "Клинический случай YAG лазерной гиалоидопунктуры при ретинопатии Вальсальвы — Островерхов А. И. | Научные публикации",
    seoDescription:
      "Клинический случай YAG лазерной гиалоидопунктуры при ретинопатии Вальсальвы: методика, результаты и использованное оборудование.",
    sortOrder: 100,
  },
];

const OSTROVERHOV_SCIENTIFIC_WORK_SLUGS = new Set(
  OSTROVERHOV_SCIENTIFIC_WORKS.map((work) => work.slug),
);

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
    photoUrl: "/doctors/ostroverkhov.png",
    diseaseSlugs: ["kosoglazie", "katarakta", "ptoz"],
    procedureSlugs: ["khirurgiya-kosoglaziya", "blefaroplastika", "fakoemulsifikatsiya-katarakty"],
  },
  {
    slug: "churakov-timur-kasimovich",
    lastName: "Чураков",
    firstName: "Тимур",
    middleName: "Касимович",
    position: "к.м.н., врач-офтальмолог, офтальмохирург, рефракционный хирург",
    category: "Рефракционная хирургия",
    experienceYears: 14,
    credo: null,
    prodoctorovUrl: null,
    siteUrl: null,
    bio:
      "Рефракционная хирургия, лазерная коррекция зрения, диагностика и лечение заболеваний роговицы. Научные интересы связаны с морфофункциональными изменениями роговицы после LASIK, пахиметрией, конфокальной микроскопией, кератотопографией Pentacam, кросслинкингом и кератоконусом.",
    career:
      "В офтальмологии с 2012 года.\n2010 — высшее медицинское образование по специальности «Педиатрия», квалификация «Врач», Санкт-Петербургская государственная педиатрическая медицинская академия.\n2012 — клиническая ординатура по специальности «Офтальмология», Северо-Западный государственный медицинский университет имени И. И. Мечникова.\n2015 — очная аспирантура кафедры глазных болезней СЗГМУ имени И. И. Мечникова.\n2017 — кандидат медицинских наук; защита диссертации состоялась 26.12.2016, диплом выдан в 2017 году.\n2022 — периодическая аккредитация по офтальмологии, действительна до 21.06.2027.\n\nПодготовка по технологиям: ZEISS VisuMax SMILE (2021), Alcon WaveLight Level II (2024; WaveLight EX500, FS200 и ALLEGRO Topolyzer Vario), ZEISS VisuMax SMILE Pro (2026). Эти сведения подтверждают обучение и не являются подтверждением текущего места работы или использования оборудования.",
    region: "Санкт-Петербург",
    clinicIds: [],
    specialties: [
      "Рефракционная хирургия",
      "Лазерная коррекция зрения",
      "Кератоконус",
      "Заболевания роговицы",
    ],
    photoUrl: "/doctors/churakov-timur-kasimovich.webp",
    diseaseSlugs: [],
    procedureSlugs: [],
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

type DiseaseSeed = {
  slug: string;
  title: string;
  categoryTitle: string;
  summary?: string;
  description?: string;
  symptoms?: string[];
  diagnostics?: string;
  treatment?: string;
  procedureSlugs?: string[];
};

const DISEASES: DiseaseSeed[] = [
  { slug: "miopiya", title: "Миопия", categoryTitle: "Нарушения рефракции" },
  {
    slug: "astigmatizm",
    title: "Астигматизм",
    categoryTitle: "Нарушения рефракции",
    procedureSlugs: ["lazernaya-korrektsiya-zreniya"],
  },
  { slug: "keratokonus", title: "Кератоконус", categoryTitle: "Патология роговицы" },
  { slug: "katarakta", title: "Катаракта", categoryTitle: "Патология хрусталика" },
  { slug: "otsloika-setchatki", title: "Отслойка сетчатки", categoryTitle: "Патология сетчатки" },
  { slug: "makulyarnyy-razryv", title: "Макулярный разрыв", categoryTitle: "Патология сетчатки" },
  {
    slug: "vozrastnaya-makulyarnaya-degeneratsiya",
    title: "Возрастная макулярная дегенерация",
    categoryTitle: "Патология сетчатки",
    procedureSlugs: ["anti-vegf-terapiya"],
  },
  { slug: "diabeticheskiy-makulyarnyy-otek", title: "Диабетический макулярный отек", categoryTitle: "Патология сетчатки" },
  { slug: "kosoglazie", title: "Косоглазие", categoryTitle: "Врождённые аномалии" },
  { slug: "ptoz", title: "Птоз", categoryTitle: "Орбитальная патология" },
  { slug: "glaukoma", title: "Глаукома", categoryTitle: "Глаукома" },
  { slug: "ambliopiya", title: "Амблиопия", categoryTitle: "Нарушения рефракции" },
  { slug: "dakriotsistit", title: "Дакриоцистит", categoryTitle: "Патология слёзных органов" },
  { slug: "diabeticheskaya-retinopatiya", title: "Диабетическая ретинопатия", categoryTitle: "Патология сетчатки" },
  {
    slug: "retinopatiya-valsalvy",
    title: "Ретинопатия Вальсальвы",
    categoryTitle: "Патология сетчатки",
    summary:
      "Ретинопатия Вальсальвы в научной статье Островерхова А. И. описана как состояние, при котором повышение внутригрудного и внутрибрюшного давления может приводить к повышению внутриглазного венозного давления и геморрагическим изменениям сетчатки.",
    description:
      "В представленном клиническом случае ретинопатия Вальсальвы была диагностирована у пациентки 22 лет после интенсивных физических нагрузок и резкого снижения зрения левого глаза. В макулярной области левого глаза было выявлено массивное субгиалоидное кровоизлияние размером более трёх диаметров диска зрительного нерва с захватом фовеа. По данным ОКТ описан массивный субгиалоидный очаг кровоизлияния под задней гиалоидной мембраной, захватывающий фовеолу и местами экранирующий сетчатку.",
    symptoms: [
      "Резкое снижение зрения после интенсивных физических нагрузок.",
      "Массивное субгиалоидное кровоизлияние в макулярной области.",
      "Захват фовеа и частичное экранирование сетчатки по данным ОКТ.",
    ],
    diagnostics:
      "В клиническом случае использованы проверка остроты зрения, рефракция на широкий зрачок, измерение внутриглазного давления, измерение передне-задней оси, офтальмоскопия и ОКТ левого глаза.",
    treatment:
      "В статье описано комбинированное лечение: YAG лазерная гиалоидопунктура с последующим курсом медикаментозной терапии.",
    procedureSlugs: ["yag-lazernaya-gialoidopunktura"],
  },
  { slug: "uveit", title: "Увеит", categoryTitle: "Воспалительные заболевания" },
  { slug: "keratit", title: "Кератит", categoryTitle: "Воспалительные заболевания" },
];

// ─── Procedure seeds (from doctor-seed-data.md) ────────────────────────────────

type ProcedureSeed = {
  slug: string;
  title: string;
  categoryTitle: string;
  summary?: string;
  description?: string;
};

const PROCEDURES: ProcedureSeed[] = [
  { slug: "lazernaya-korrektsiya-zreniya", title: "Лазерная коррекция зрения", categoryTitle: "Рефракционные операции" },
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
  {
    slug: "yag-lazernaya-gialoidopunktura",
    title: "YAG лазерная гиалоидопунктура",
    categoryTitle: "Лазерные процедуры",
    summary:
      "YAG лазерная гиалоидопунктура — методика, описанная в клиническом случае лечения ретинопатии Вальсальвы и массивного субгиалоидного кровоизлияния.",
    description:
      "В статье Островерхова А. И. YAG лазерная гиалоидопунктура проведена в условиях медикаментозного мидриаза и инстилляционной анестезии. Использован YAG-лазер 1064 нм Lightmed Lightlas SLT/YAG и линза VOLK SUPER QUAD 160. В области нижнего края кровоизлияния нанесено 6 импульсов мощностью 4,5 мДж до получения выхода крови в полость стекловидного тела. Методика сопровождалась последующим курсом медикаментозного лечения.",
  },
  { slug: "khirurgiya-kosoglaziya", title: "Хирургия косоглазия", categoryTitle: "Хирургические операции" },
  { slug: "blefaroplastika", title: "Блефаропластика", categoryTitle: "Хирургические операции" },
  { slug: "slt", title: "SLT", categoryTitle: "Лазерные процедуры" },
  { slug: "navilas", title: "NAVILAS", categoryTitle: "Лазерные процедуры" },
  { slug: "vitreolizis", title: "Витреолизис", categoryTitle: "Лазерные процедуры" },
  { slug: "zamena-khrustalika", title: "Замена хрусталика", categoryTitle: "Хирургические операции" },
  { slug: "zondirovanie-sleznykh-kanalov", title: "Зондирование слезных каналов", categoryTitle: "Хирургические операции" },
  { slug: "diagnosticheskiy-priem", title: "Диагностический прием", categoryTitle: "Диагностические процедуры" },
];

// ─── Первое расследование Ассоциации ─────────────────────────────────────────
// Все формулировки ниже основаны исключительно на файлах из
// docs/httpstumenglazcentre/. Полные тексты обращений сохранены как доступные
// расшифровки, потому что браузеры не отображают DOCX встроенно.

async function seedRegulatoryCorpus() {
  const validation = validateRegulationCorpus(REGULATORY_CORPUS, REGULATION_TOPICS);
  if (!validation.valid) {
    throw new Error(
      ["Нормативный корпус не прошёл предзаписную валидацию:", ...validation.errors.map((error) => `- ${error}`)].join(
        "\n",
      ),
    );
  }

  console.log("Seeding neutral regulatory corpus...");

  const topicIds = new Map<string, string>();
  for (const topic of REGULATION_TOPICS) {
    const seededTopic = await db.regulationTopic.upsert({
      where: { slug: topic.slug },
      create: topic,
      update: {
        title: topic.title,
        description: topic.description,
        sortOrder: topic.sortOrder,
        isPublished: topic.isPublished,
      },
    });
    topicIds.set(topic.slug, seededTopic.id);
  }

  const regulationIds = new Map<string, string>();
  const editionIds = new Map<string, string>();

  for (const regulation of REGULATORY_CORPUS) {
    const regulationData = {
      title: regulation.title,
      summary: regulation.summary,
      sourceUrl: regulation.officialPublicationUrl,
      documentType: regulation.documentType,
      number: regulation.number,
      adoptedAt: regulatoryDate(regulation.adoptedAt),
      issuingAuthority: regulation.issuingAuthority,
      jurisdiction: regulation.jurisdiction,
      officialPublicationUrl: regulation.officialPublicationUrl,
      legalStatus: regulation.legalStatus,
      effectiveFrom: regulatoryDate(regulation.effectiveFrom),
      effectiveTo: regulatoryDate(regulation.effectiveTo),
      isPublished: regulation.isPublished,
      publishedAt: regulatoryDate(regulation.publishedAt),
      seoTitle: regulation.seoTitle,
      seoDescription: regulation.seoDescription,
    };
    const seededRegulation = await db.regulation.upsert({
      where: { slug: regulation.slug },
      create: { slug: regulation.slug, content: regulation.content ?? null, ...regulationData },
      update: {
        ...regulationData,
        ...(regulation.content === undefined ? {} : { content: regulation.content }),
      },
    });
    regulationIds.set(regulation.slug, seededRegulation.id);

    for (const topicSlug of regulation.topicSlugs) {
      const topicId = topicIds.get(topicSlug);
      if (!topicId) throw new Error(`Не найдена тема нормы: ${topicSlug}`);
      await db.regulationOnTopic.upsert({
        where: { regulationId_topicId: { regulationId: seededRegulation.id, topicId } },
        create: { regulationId: seededRegulation.id, topicId },
        update: {},
      });
    }

    for (const edition of regulation.editions) {
      const editionData = {
        title: edition.title,
        effectiveFrom: regulatoryDate(edition.effectiveFrom)!,
        effectiveTo: regulatoryDate(edition.effectiveTo),
        legalStatus: edition.legalStatus,
        transitionNote: edition.transitionNote ?? null,
        officialTextUrl: edition.officialTextUrl,
        verifiedAt: regulatoryDate(edition.verifiedAt),
        historicalUseAllowed: edition.historicalUseAllowed,
        verificationNote: edition.verificationNote,
        isPublished: edition.isPublished,
        publishedAt: regulatoryDate(edition.publishedAt),
      };
      const seededEdition = await db.regulationEdition.upsert({
        where: { regulationId_key: { regulationId: seededRegulation.id, key: edition.key } },
        create: { regulationId: seededRegulation.id, key: edition.key, ...editionData },
        update: editionData,
      });
      editionIds.set(`${regulation.slug}:${edition.key}`, seededEdition.id);

      for (const provision of edition.provisions) {
        const topicId = topicIds.get(provision.topicSlug);
        if (!topicId) throw new Error(`Не найдена тема положения: ${provision.topicSlug}`);
        const provisionData = {
          topicId,
          locator: provision.locator,
          title: provision.title,
          requirement: provision.requirement,
          applicability: provision.applicability,
          effectiveFrom: regulatoryDate(provision.effectiveFrom),
          effectiveTo: regulatoryDate(provision.effectiveTo),
          isPublished: provision.isPublished,
          publishedAt: regulatoryDate(provision.publishedAt),
          sortOrder: provision.sortOrder,
        };
        const seededProvision = await db.regulationProvision.upsert({
          where: { editionId_key: { editionId: seededEdition.id, key: provision.key } },
          create: { editionId: seededEdition.id, key: provision.key, ...provisionData },
          update: provisionData,
        });

        for (const check of provision.checks) {
          const checkData = {
            question: check.question,
            factToEstablish: check.factToEstablish,
            primaryEvidenceType: check.primaryEvidenceType,
            officialSearchUrl: check.officialSearchUrl ?? null,
            officialSearchLabel: check.officialSearchLabel ?? null,
            nonCompliancePattern: check.nonCompliancePattern ?? null,
            evidenceThreshold: check.evidenceThreshold,
            applicabilityNote: check.applicabilityNote ?? null,
            isPublished: check.isPublished,
            publishedAt: regulatoryDate(check.publishedAt),
            sortOrder: check.sortOrder,
          };
          await db.regulatoryCheck.upsert({
            where: { provisionId_key: { provisionId: seededProvision.id, key: check.key } },
            create: { provisionId: seededProvision.id, key: check.key, ...checkData },
            update: checkData,
          });
        }

        for (const requirement of provision.equipmentRequirements ?? []) {
          const requirementData = {
            appendix: requirement.appendix,
            subsection: requirement.subsection ?? null,
            tableTitle: requirement.tableTitle ?? null,
            position: requirement.position,
            deviceTypeCode: requirement.deviceTypeCode ?? null,
            regulatoryName: requirement.regulatoryName,
            displayName: requirement.displayName ?? null,
            quantity: requirement.quantity,
            applicabilityCondition: requirement.applicabilityCondition ?? null,
            isPublished: requirement.isPublished,
            publishedAt: regulatoryDate(requirement.publishedAt),
            sortOrder: requirement.sortOrder,
          };
          await db.regulationEquipmentRequirement.upsert({
            where: {
              provisionId_stableKey: {
                provisionId: seededProvision.id,
                stableKey: requirement.stableKey,
              },
            },
            create: { provisionId: seededProvision.id, stableKey: requirement.stableKey, ...requirementData },
            update: requirementData,
          });
        }
      }
    }

    for (const source of regulation.sources) {
      const editionId = source.editionKey
        ? editionIds.get(`${regulation.slug}:${source.editionKey}`)
        : undefined;
      if (source.editionKey && !editionId) {
        throw new Error(`Не найдена редакция источника: ${regulation.slug}:${source.editionKey}`);
      }
      const sourceData = {
        editionId: editionId ?? null,
        kind: source.kind,
        title: source.title,
        isOfficial: source.isOfficial,
        isPublished: source.isPublished ?? true,
        publishedAt:
          source.isPublished === false
            ? null
            : regulatoryDate(source.publishedAt ?? "2026-08-12"),
        sourceDate: regulatoryDate(source.sourceDate),
        sortOrder: source.sortOrder,
      };
      await db.regulationSource.upsert({
        where: { regulationId_url: { regulationId: seededRegulation.id, url: source.url } },
        create: { regulationId: seededRegulation.id, url: source.url, ...sourceData },
        update: sourceData,
      });
    }
  }

  // Связи создаются вторым проходом, когда оба акта уже есть в БД.
  for (const regulation of REGULATORY_CORPUS) {
    const sourceRegulationId = regulationIds.get(regulation.slug)!;
    for (const relation of regulation.relations ?? []) {
      const targetRegulationId = regulationIds.get(relation.targetSlug);
      if (!targetRegulationId) throw new Error(`Не найден целевой акт: ${relation.targetSlug}`);
      const legalEffectFrom = regulatoryDate(relation.legalEffectFrom);
      const existing = await db.regulationRelation.findFirst({
        where: { sourceRegulationId, targetRegulationId, type: relation.type, legalEffectFrom },
        select: { id: true },
      });
      const relationData = {
        note: relation.note ?? null,
        officialSourceUrl: relation.officialSourceUrl ?? null,
        isPublished: relation.isPublished,
      };
      if (existing) {
        await db.regulationRelation.update({ where: { id: existing.id }, data: relationData });
      } else {
        await db.regulationRelation.create({
          data: { sourceRegulationId, targetRegulationId, type: relation.type, legalEffectFrom, ...relationData },
        });
      }
    }
  }

  console.log(`✓ Regulatory corpus: ${REGULATORY_CORPUS.length} acts, ${REGULATION_TOPICS.length} topics`);
}

const GLAZCENTR_INVESTIGATION = {
  slug: "proverka-oborudovaniya-glaztsentr-tyumen",
  title: "Проверка использования офтальмологического оборудования в ООО «Глазцентр-Тюмень»",
  summary:
    "Опубликованы материалы проверки сведений об использовании в ООО «Глазцентр-Тюмень» конкретного экземпляра эксимерной лазерной системы ALLEGRETTO Wave Eye-Q, зав. № 1010-2571, 2010 года выпуска.",
  status: "Опубликовано; ожидаются результаты проверок компетентных органов",
  statusNote:
    "Опубликованные материалы содержат обращения Ассоциации и ответы производителя. Они не являются судебным решением или заключением государственного органа.",
  publishedAt: new Date("2026-08-05T00:00:00.000Z"),
  seoTitle: "Расследование Ассоциации: проверка оборудования ООО «Глазцентр-Тюмень»",
  seoDescription:
    "Документы, хронология и статус проверки сведений об использовании в ООО «Глазцентр-Тюмень» конкретного экземпляра ALLEGRETTO Wave Eye-Q, зав. № 1010-2571.",
  sections: [
    {
      key: "summary",
      title: "Краткое описание",
      content:
        "Предмет публикации — проверка сведений об использовании в ООО «Глазцентр-Тюмень» эксимерной лазерной системы ALLEGRETTO модели Wave Eye-Q, зав. № 1010-2571, 2010 года выпуска. В материалах Ассоциации указаны ответы ООО «Алкон Фармацевтика» и проекты обращений в Департамент здравоохранения Тюменской области и территориальный орган Росздравнадзора.\n\nСтраница отделяет содержание первичных документов от правовой позиции заявителя. Она не устанавливает нарушение, не заменяет техническую экспертизу и не содержит выводов, которых нет в переданном комплекте.",
    },
    {
      key: "object-under-review",
      title: "Объект проверки",
      content:
        "Модель: ALLEGRETTO Wave Eye-Q.\nЗаводской номер: 1010-2571.\nГод выпуска: 2010.\n\nОснование идентификации: эти реквизиты указаны в ответе ООО «Алкон Фармацевтика» от 07.04.2026 № 22-04-2026/L на запрос УМВД России по г. Тюмени. В обращении Ассоциации в Росздравнадзор запрошена дополнительная проверка с сопоставлением серийного номера в программном обеспечении с документами при участии технических специалистов.\n\nЭтот блок описывает конкретный экземпляр, указанный в переданных материалах. Карточка модели оборудования содержит энциклопедические сведения о модели в целом и не является выводом о статусе иных экземпляров.",
    },
    {
      key: "official-documents",
      title: "Официальные документы",
      content:
        "Для уточнения происхождения и правового статуса оборудования был направлен запрос. После получения ответа ООО „Алкон Фармацевтика“ Ассоциация направила материалы в Департамент здравоохранения Тюменской области и территориальный орган Росздравнадзора для рассмотрения в пределах их полномочий.",
    },
    {
      key: "manufacturer-responses",
      title: "Ответы производителя",
      content:
        "На скане письма ООО «Алкон Фармацевтика» от 07.04.2026 № 22-04-2026/L указано, что это общество не ввозило на территорию Российской Федерации систему офтальмологическую эксимерную лазерную ALLEGRETTO модели Wave Eye-Q, зав. № 1010-2571, 2010 года выпуска.\n\nНа отдельном скане дополнительного сообщения ООО «Алкон Фармацевтика» указано, что до списания эта система находилась в эксплуатации в одной из клиник Румынии и использовалась по прямому назначению. В файле не указаны дата и исходящий номер дополнительного сообщения; поэтому они не добавлены в хронологию как установленные реквизиты.",
    },
    {
      key: "legal-basis",
      title: "Нормативная база, указанная в обращениях",
      content:
        "В проектах обращений Ассоциация ссылается, в частности, на часть 4 статьи 38 и статью 79 Федерального закона № 323-ФЗ, статьи 6, 7 и 10 Федерального закона № 59-ФЗ, а также на статью 20 Федерального закона № 99-ФЗ. Также в материалах упомянут приказ Департамента здравоохранения Тюменской области от 13.03.2024 № 69 и лицензия № Л041-01107-72/00648949 от 25.04.2023.\n\nЭто перечисление воспроизводит нормативные ссылки из предоставленных документов и не является самостоятельным юридическим заключением Ассоциации на этой странице.",
    },
    {
      key: "conclusions",
      title: "Выводы по опубликованным материалам",
      content:
        "Документы позволяют зафиксировать предмет проверки, идентификаторы конкретной системы и позицию, изложенную в письмах ООО «Алкон Фармацевтика». В обращении в Росздравнадзор Ассоциация просит сверить фактический серийный номер в программном обеспечении оборудования с документами с привлечением технических специалистов.\n\nОкончательные выводы о законности обращения медицинского изделия, достоверности сведений для лицензирования и мерах реагирования находятся в компетенции уполномоченных органов и не подменяются публикацией.",
    },
    {
      key: "status",
      title: "Статус расследования",
      content:
        "Статус публикации: материалы Ассоциации опубликованы. В переданном комплекте есть текст новости, в котором сказано о направлении обращений, однако на копиях самих обращений поля даты остаются незаполненными, а подтверждения отправки в папке нет. Поэтому на странице отмечено ожидание результатов проверок, а не завершение рассмотрения.",
    },
  ],
  timeline: [
    {
      key: "police-response-reference",
      date: new Date("2026-03-19T00:00:00.000Z"),
      dateLabel: "19 марта 2026",
      title: "Упомянут ответ УМВД России по г. Тюмени",
      description:
        "В обращении в Росздравнадзор приведена ссылка на ответ УМВД № 3/266601184932. Сам ответ в переданном комплекте отсутствует; эта дата отмечена как ссылка внутри обращения, а не как самостоятельно опубликованный первичный документ.",
    },
    {
      key: "manufacturer-request",
      date: new Date("2026-03-26T00:00:00.000Z"),
      dateLabel: "26 марта 2026",
      title: "Запрос УМВД в ООО «Алкон Фармацевтика»",
      description:
        "В скане ответа производителя указано, что запрос № 91/3/2-956 датирован 26.03.2026.",
    },
    {
      key: "manufacturer-received-request",
      date: new Date("2026-03-31T00:00:00.000Z"),
      dateLabel: "31 марта 2026",
      title: "Получение запроса производителем",
      description:
        "В том же скане указано, что ООО «Алкон Фармацевтика» получило запрос по электронной почте 31.03.2026.",
    },
    {
      key: "manufacturer-response",
      date: new Date("2026-04-07T00:00:00.000Z"),
      dateLabel: "7 апреля 2026",
      title: "Ответ ООО «Алкон Фармацевтика» № 22-04-2026/L",
      description:
        "В документе указано, что ООО «Алкон Фармацевтика» не ввозило на территорию Российской Федерации названную систему с зав. № 1010-2571.",
    },
    {
      key: "manufacturer-supplement",
      date: null,
      dateLabel: "Дата не указана в файле",
      title: "Дополнительное сообщение ООО «Алкон Фармацевтика»",
      description:
        "На скане сообщается, что до списания система находилась в эксплуатации в одной из клиник Румынии. Дата и номер на изображении отсутствуют.",
    },
    {
      key: "association-appeals",
      date: null,
      dateLabel: "2026 год; дата отправки не подтверждена комплектом",
      title: "Подготовлены обращения Ассоциации",
      description:
        "В папке есть два обращения Ассоциации с незаполненными датами. Проект новости сообщает об их направлении, но подтверждения отправки не приложены.",
    },
  ],
  documents: [
    {
      slug: "alcon-response-2026-04-07",
      kind: "manufacturer-response",
      title: "Ответ ООО «Алкон Фармацевтика» от 07.04.2026 № 22-04-2026/L",
      summary:
        "Скан официального ответа: ООО «Алкон Фармацевтика» сообщает, что не ввозило указанную систему на территорию Российской Федерации.",
      source: "ООО «Алкон Фармацевтика»",
      documentDate: new Date("2026-04-07T00:00:00.000Z"),
      storageFileName: null,
      fileUrl: "/investigations/glaztsentr-tyumen/alcon-response-2026-04-07.jpg",
      previewImageUrl: "/investigations/glaztsentr-tyumen/alcon-response-2026-04-07.jpg",
      mimeType: "image/jpeg",
      isEvidence: true,
    },
    {
      slug: "alcon-supplement",
      kind: "manufacturer-response",
      title: "Дополнительное сообщение ООО «Алкон Фармацевтика»",
      summary:
        "Скан дополнительного сообщения о том, что до списания система эксплуатировалась в одной из клиник Румынии. Реквизиты даты и номера на файле отсутствуют.",
      source: "ООО «Алкон Фармацевтика»",
      storageFileName: null,
      fileUrl: "/investigations/glaztsentr-tyumen/alcon-supplement.jpg",
      previewImageUrl: "/investigations/glaztsentr-tyumen/alcon-supplement.jpg",
      mimeType: "image/jpeg",
      isEvidence: true,
    },
    {
      slug: "appeal-to-depzdrav",
      kind: "association-appeal",
      title: "Обращение Ассоциации в Департамент здравоохранения Тюменской области",
      summary:
        "Полная текстовая расшифровка обращения. Поле даты в копии не заполнено.",
      source: "Ассоциация офтальмологических клиник",
      storageFileName: null,
      fileUrl: null,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      content: String.raw`«АССОЦИАЦИЯ ОФТАЛЬМОЛОГИЧЕСКИХ КЛИНИК»
620092, Свердловская область, г.о. город Екатеринбург, ул. Владимира Высоцкого, д. 5
+7 (919) 937-01-01; aok86e@mail.ru
ИНН 6670530741, КПП 667001001, ОГРН 1256600034976, ОКПО 50986957

Директору Департамента здравоохранения Тюменской области
Логиновой Н. В.
625000, г. Тюмень, ул. Герцена, д. 74

Копия: Министру здравоохранения Российской Федерации Мурашко М. А.
127994, ГСП-4, г. Москва, Рахмановский пер., д. 3
От Ассоциации офтальмологических клиник
620092, г. Екатеринбург, ул. Владимира Высоцкого, д. 5

ЗАЯВЛЕНИЕ

В соответствии со статьями 38, 79 Федерального закона от 21.11.2011 № 323-ФЗ «Об основах охраны здоровья граждан в Российской Федерации», а также статьями 6, 7, 10 Федерального закона от 02.05.2006 № 59-ФЗ «О порядке рассмотрения обращений граждан Российской Федерации», Ассоциация офтальмологических клиник сообщает о следующем.

В соответствии с приказом Департамента здравоохранения Тюменской области от 13.03.2024 № 69 «Об организации оказания плановой медицинской помощи пациентам по профилю «офтальмология» ООО «Глазцентр-Тюмень» включено в перечень медицинских организаций, оказывающих консультативно-диагностическую и специализированную медицинскую помощь пациентам с заболеваниями органа зрения.

Указанная организация участвует в реализации Территориальной программы государственных гарантий бесплатного оказания медицинской помощи в Тюменской области на основании согласования с ГАУЗ ТО «Областной офтальмологический диспансер».

В ходе доследственной проверки, проведенной УМВД России по г. Тюмени, установлено, что ООО «Глазцентр-Тюмень» в своей медицинской деятельности использует эксимерный лазер «Alcon ALLEGRETTO Eye-Q», заводской номер 1010-2571, 2010 года выпуска.

Официальный дистрибьютор — ООО «Алкон Фармацевтика» — в письме от 07.04.2026 № 22-04-2026/L, направленном в УМВД России по г. Тюмени, сообщил, что указанное оборудование не ввозилось на территорию Российской Федерации, а до списания находилось в эксплуатации в одной из клиник Румынии.

Таким образом, данное оборудование:

— не проходило обязательную государственную регистрацию в Росздравнадзоре;
— не имеет регистрационного удостоверения, действующего на территории РФ;
— не проходило технические испытания, токсикологические и клинические исследования, подтверждающие его качество, эффективность и безопасность;
— является списанным и не подлежит использованию по прямому назначению.

Указанные обстоятельства являются прямым нарушением части 4 статьи 38 Федерального закона № 323-ФЗ, согласно которой на территории Российской Федерации разрешается обращение только зарегистрированных медицинских изделий.

В соответствии с пунктом 2 примечаний к приказу Департамента здравоохранения Тюменской области от 13.03.2024 № 69, направление пациентов в медицинские организации частной системы здравоохранения осуществляется по согласованию с ГАУЗ ТО «Областной офтальмологический диспансер».

Включение ООО «Глазцентр-Тюмень» в маршрутизацию пациентов означает, что граждане, обратившиеся за медицинской помощью в государственные медицинские организации, могут быть направлены в указанную клинику для проведения диагностических и лечебных процедур на оборудовании, которое:

— не имеет документов, подтверждающих его безопасность и эффективность;
— не прошло регистрацию в установленном порядке;
— является списанным и бывшим в употреблении в другой стране.

Использование такого оборудования создает прямую угрозу жизни и здоровью пациентов, в том числе может повлечь необратимую утрату зрения.

Обращаем внимание, что формальное наличие лицензии на медицинскую деятельность, полученной на основании недостоверных сведений о материально-техническом оснащении, не может служить основанием для включения организации в маршрутизацию пациентов.

Государство обязано защищать здоровье граждан, а не создавать условия для его утраты. Направление пациентов в организацию, использующую нелегальное медицинское оборудование, является прямым нарушением конституционного права на охрану здоровья.

На основании изложенного, ПРОШУ:

1. Принять меры по исключению ООО «Глазцентр-Тюмень» из маршрутизации пациентов по профилю «офтальмология» до проведения полной и объективной проверки законности использования медицинского оборудования.
2. Направить запрос в Росздравнадзор по Тюменской области для подтверждения либо опровержения факта наличия действующего регистрационного удостоверения на эксимерный лазер «Alcon ALLEGRETTO Eye-Q», заводской номер 1010-2571.
3. Приостановить действие согласования, предусмотренного пунктом 2 примечаний к приказу от 13.03.2024 № 69, в отношении ООО «Глазцентр-Тюмень» до завершения проверки.

Обращаем внимание, что формальный подход к рассмотрению данного обращения и оставление ООО «Глазцентр-Тюмень» в маршрутизации пациентов будет расценено как создание условий для использования незарегистрированного медицинского оборудования и подвергания опасности жизни и здоровья граждан, что является недопустимым.

Ответ прошу направить на адрес электронной почты 89827713747@mail.ru.

Приложение: письмо ООО «Алкон Фармацевтика» от 07.04.2026 № 22-04-2026/L.

Руководитель Ассоциации А. С. Черных
«___» ____________ 2026 г.`,
      isEvidence: true,
    },
    {
      slug: "appeal-to-roszdravnadzor",
      kind: "association-appeal",
      title: "Обращение Ассоциации в территориальный орган Росздравнадзора",
      summary:
        "Полная текстовая расшифровка обращения. Поле даты в копии не заполнено.",
      source: "Ассоциация офтальмологических клиник",
      storageFileName: null,
      fileUrl: null,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      content: String.raw`«АССОЦИАЦИЯ ОФТАЛЬМОЛОГИЧЕСКИХ КЛИНИК»
620092, Свердловская область, г.о. город Екатеринбург, ул. Владимира Высоцкого, д. 5
+7 (919) 937-01-01; aok86e@mail.ru
ИНН 6670530741, КПП 667001001, ОГРН 1256600034976, ОКПО 50986957

Руководителю Территориального органа Федеральной службы по надзору в сфере здравоохранения по Тюменской области, Ханты-Мансийскому автономному округу – Югре и Ямало-Ненецкому автономному округу
Левкиной Е. Г.
625023, г. Тюмень, ул. Энергетиков, д. 26

Копия: Руководителю Федеральной службы по надзору в сфере здравоохранения Самойловой В. А.
109074, г. Москва, Славянская пл., д. 4, стр. 1
От Ассоциации офтальмологических клиник
620092, г. Екатеринбург, ул. Владимира Высоцкого, д. 5

ЗАЯВЛЕНИЕ

В соответствии со ст. 38, 79 Федерального закона от 21.11.2011 № 323-ФЗ «Об основах охраны здоровья граждан в Российской Федерации», Ассоциация офтальмологических клиник заявляет о грубейших нарушениях законодательства в сфере обращения медицинских изделий, допускаемых ООО «ГЛАЗЦЕНТР-ТЮМЕНЬ» (ИНН 7203541400, ОГРН 1227200012270).

В силу части 4 статьи 38 Федерального закона № 323-ФЗ на территории Российской Федерации разрешается обращение только зарегистрированных медицинских изделий. Государственная регистрация проводится на основании результатов технических испытаний, токсикологических и клинических исследований, подтверждающих качество, эффективность и безопасность изделия, а также его соответствие обязательным требованиям. Процедура регистрации, результатом которой является выдача регистрационного удостоверения, является единственным легальным основанием для ввоза, производства и использования медицинского изделия.

Вместе с тем, ООО «ГЛАЗЦЕНТР-ТЮМЕНЬ» при оказании медицинской помощи использует эксимерный лазер ALLEGRETTO Eye-Q, заводской номер 1010-2571, 2010 года выпуска. Согласно официальному ответу ООО «Алкон Фармацевтика» от 07.04.2026 № 22-04-2026/L, направленному в УМВД России по г. Тюмени, указанное оборудование не ввозилось на территорию Российской Федерации официальным дистрибьютором; до списания находилось в эксплуатации в одной из клиник Румынии. Таким образом, лазер был ввезен на территорию РФ с нарушением установленного порядка и не может быть признан безопасным для применения.

Использование незарегистрированного медицинского изделия создает прямую угрозу жизни и здоровью неопределенного круга лиц и является нарушением требований, установленных статьей 38 Федерального закона № 323-ФЗ.

В соответствии действующим законодательством для получения лицензии на медицинскую деятельность в лицензирующий орган предоставляются сведения об оснащении медицинскими изделиями, включая номера регистрационных удостоверений. Предоставление заведомо недостоверных сведений является основанием для аннулирования лицензии.

Медицинская деятельность ООО «ГЛАЗЦЕНТР-ТЮМЕНЬ» осуществляется на основании лицензии № Л041-01107-72/00648949 от 25.04.2023. В силу закона медицинское изделие допускается к применению только при наличии регистрационного удостоверения. Поскольку лицензия была получена на основании недостоверных сведений о материально-техническом оснащении (использование незарегистрированного оборудования), лицензия подлежит аннулированию. В соответствии со статьей 20 Федерального закона от 04.05.2011 № 99-ФЗ «О лицензировании отдельных видов деятельности», действие лицензии прекращается в том числе на основании решения суда об аннулировании лицензии. Росздравнадзор и его территориальные органы уполномочены на обращение в суд с соответствующим заявлением.

Ранее территориальными органами Росздравнадзора и УМВД России по г. Тюмени проводился визуальный осмотр оборудования. Как указано в ответе УМВД от 19.03.2026 № 3/266601184932, проверка ограничилась фиксацией сходства заводского номера на шильдике. При этом специалистами не проводилась проверка серийного номера на местоположение оборудования и его использовании. Данный подход не может считаться надлежащей проверкой в силу требований Административного регламента и не позволяет установить подлинность происхождения оборудования. Формальная проверка без привлечения квалифицированных технических специалистов и запросов дистрибьютору не исключает угрозу для здоровья пациентов.

Таким образом, в непосредственной близости от территориального органа Росздравнадзора, на территории города Тюмени, ООО «ГЛАЗЦЕНТР-ТЮМЕНЬ» систематически используется медицинское оборудование, ввезенное с нарушением установленного порядка, не прошедшее государственную регистрацию и признанное официальным дистрибьютором списанным. Данное оборудование представляет прямую угрозу жизни и здоровью пациентов, в том числе может повлечь необратимую утрату зрения. Вместе с тем, меры реагирования со стороны уполномоченных органов носят формальный характер, что фактически лишает граждан конституционного права на охрану здоровья и оставляет безнаказанными лиц, ежедневно подвергающих опасности неопределенный круг лиц. Закон в данном случае должен действовать безусловно и неотвратимо, а формальные отписки недопустимы.

На основании изложенного, ПРОШУ:

1. Организовать внеплановую выездную проверку ООО «ГЛАЗЦЕНТР-ТЮМЕНЬ» по адресу: г. Тюмень, ул. Червишевский тракт, д. 2, с привлечением технических специалистов (инженеров), имеющих доступ к сервисному меню оборудования, в целях сверки реального серийного номера в программном обеспечении с данными, указанными в документах.
2. Обеспечить проведение проверки с привлечением специалистов, обладающих необходимой квалификацией для идентификации медицинского изделия по данным, содержащимся в программном обеспечении, а не только по внешним идентификационным шильдам.
3. При выявлении нарушения — изъять эксимерный лазер ALLEGRETTO Eye-Q (зав. номер 1010-2571) в порядке, установленном законодательством, и принять меры по его изоляции от обращения, вплоть до уничтожения, как недоброкачественного медицинского изделия.
4. Инициировать процедуру аннулирования лицензии № Л041-01107-72/00648949 от 25.04.2023 в судебном порядке в связи с ее получением на основании недостоверных сведений, предусмотренных законодательством Российской Федерации.
5. Направить материалы проверки в органы предварительного следствия.

Ответ прошу направить на адрес электронной почты 89827713747@mail.ru.

Приложение: письмо ООО «Алкон Фармацевтика» от 07.04.2026 № 22-04-2026/L.

Руководитель Ассоциации А. С. Черных
«___» ____________ 2026 г.`,
      isEvidence: true,
    },
  ],
  clinicSlugs: ["glaztsentr-tyumen"],
  equipmentSlugs: ["alcon-allegretto-wave-eye-q"],
  // В документах речь идёт о коррекции зрения без конкретного диагноза.
  diseaseSlugs: [] as string[],
  procedureSlugs: ["lazernaya-korrektsiya-zreniya"],
} as const;

const GLAZCENTR_NEWS = {
  slug: "opublikovano-rassledovanie-glaztsentr-tyumen",
  title: "Опубликованы материалы проверки конкретного экземпляра ALLEGRETTO Wave Eye-Q в ООО «Глазцентр-Тюмень»",
  summary:
    "Опубликованы материалы проверки сведений об использовании в ООО «Глазцентр-Тюмень» конкретного экземпляра ALLEGRETTO Wave Eye-Q, зав. № 1010-2571, 2010 года выпуска. Окончательные выводы ожидают оценки уполномоченных органов.",
  content: String.raw`## Почему началась проверка

В обращениях Ассоциации конкретный экземпляр эксимерной лазерной системы ALLEGRETTO Wave Eye-Q, заводской номер 1010-2571, 2010 года выпуска, назван используемым ООО «Глазцентр-Тюмень». Предмет публикации — проверка этих сведений, а не оценка модели оборудования в целом. В ответе ООО «Алкон Фармацевтика» на запрос УМВД России по г. Тюмени от 7 апреля 2026 года компания сообщила, что не ввозила названную систему на территорию Российской Федерации.

## Что подтверждено документами

- Скан официального ответа ООО «Алкон Фармацевтика» идентифицирует модель, заводской номер и год выпуска системы, а также сообщает, что эта компания её не ввозила в Россию.
- В отдельном сообщении ООО «Алкон Фармацевтика» указано, что до списания система находилась в эксплуатации в одной из клиник Румынии. На скане нет даты и исходящего номера — поэтому этот факт опубликован без добавления неуказанных реквизитов.
- В комплекте представлены два обращения Ассоциации: в Департамент здравоохранения Тюменской области и в территориальный орган Росздравнадзора. Они фиксируют позицию Ассоциации и перечень запрошенных проверочных действий.

## Что ещё требует проверки

Обращение в Росздравнадзор просит привлечь технических специалистов и сопоставить серийный номер в программном обеспечении лазера с документами, а не ограничиваться внешней маркировкой. Такой порядок проверки запрошен Ассоциацией, чтобы проверить изложенные в обращении обстоятельства.

В опубликованном комплекте нет ответа Росздравнадзора, Департамента здравоохранения или судебного решения. В копиях обращений не заполнена дата, а подтверждение их отправки не приложено. Поэтому материал не устанавливает нарушение, не заменяет экспертизу и не подменяет решение уполномоченного органа.

## Какие материалы опубликованы

В новости собраны ссылки на четыре документа доказательной базы: два сообщения ООО «Алкон Фармацевтика» и две копии обращений Ассоциации. Полные сканы, текстовые расшифровки и хронология размещены в расследовании, чтобы читатель мог отделить содержание документов от позиции заявителя.

## Текущий статус

Материалы проверки опубликованы. Статус расследования — ожидание результатов проверок компетентных органов. Нормативные ссылки, приведённые в обращениях, отражают правовую позицию Ассоциации, а не самостоятельное юридическое заключение в этой новости.

## Что будет дальше

Мы будем обновлять публикацию только после появления новых официальных документов. До этого момента основанием для выводов остаются опубликованные первичные материалы и прямо обозначенные границы проверки.`,
  seoTitle: "Проверка конкретного экземпляра ALLEGRETTO Wave Eye-Q: документы и статус",
  seoDescription:
    "Материалы проверки конкретного экземпляра ALLEGRETTO Wave Eye-Q, зав. № 1010-2571, указанного в документах об ООО «Глазцентр-Тюмень»: официальный ответ, обращения и статус.",
} as const;

async function seedGlazcentrInvestigation() {
  const data = {
    title: GLAZCENTR_INVESTIGATION.title,
    summary: GLAZCENTR_INVESTIGATION.summary,
    status: GLAZCENTR_INVESTIGATION.status,
    statusNote: GLAZCENTR_INVESTIGATION.statusNote,
    isPublished: true,
    evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
    publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
    seoTitle: GLAZCENTR_INVESTIGATION.seoTitle,
    seoDescription: GLAZCENTR_INVESTIGATION.seoDescription,
  };

  const investigation = await db.investigation.upsert({
    where: { slug: GLAZCENTR_INVESTIGATION.slug },
    create: { slug: GLAZCENTR_INVESTIGATION.slug, ...data },
    update: data,
  });

  for (const [sortOrder, section] of GLAZCENTR_INVESTIGATION.sections.entries()) {
    await db.investigationSection.upsert({
      where: { investigationId_key: { investigationId: investigation.id, key: section.key } },
      create: {
        investigationId: investigation.id,
        sortOrder,
        ...section,
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
      update: {
        title: section.title,
        content: section.content,
        sortOrder,
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
    });
  }

  for (const [sortOrder, event] of GLAZCENTR_INVESTIGATION.timeline.entries()) {
    await db.investigationTimelineEvent.upsert({
      where: { investigationId_key: { investigationId: investigation.id, key: event.key } },
      create: {
        investigationId: investigation.id,
        sortOrder,
        ...event,
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
      update: {
        date: event.date,
        dateLabel: event.dateLabel,
        title: event.title,
        description: event.description,
        sortOrder,
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
    });
  }

  for (const [sortOrder, document] of GLAZCENTR_INVESTIGATION.documents.entries()) {
    await db.investigationDocument.upsert({
      where: { investigationId_slug: { investigationId: investigation.id, slug: document.slug } },
      create: {
        investigationId: investigation.id,
        sortOrder,
        ...document,
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
      update: {
        ...document,
        sortOrder,
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
    });
  }

  // These files were previously copied as supporting material. They are not
  // primary documents or evidence and must not remain attached to a public
  // investigation after the evidence-only policy was introduced.
  await db.investigationDocument.deleteMany({
    where: {
      investigationId: investigation.id,
      slug: { in: ["news-draft-source", "supporting-research-report", "clinic-warning-mockup"] },
    },
  });

  const [clinics, equipment, diseases, procedures] = await Promise.all([
    Promise.all(
      GLAZCENTR_INVESTIGATION.clinicSlugs.map((clinicSlug) =>
        db.clinic.findUnique({ where: { slug: clinicSlug } }),
      ),
    ),
    Promise.all(
      GLAZCENTR_INVESTIGATION.equipmentSlugs.map((equipmentSlug) =>
        db.equipment.findUnique({ where: { slug: equipmentSlug } }),
      ),
    ),
    Promise.all(
      GLAZCENTR_INVESTIGATION.diseaseSlugs.map((diseaseSlug) =>
        db.disease.findUnique({ where: { slug: diseaseSlug } }),
      ),
    ),
    Promise.all(
      GLAZCENTR_INVESTIGATION.procedureSlugs.map((procedureSlug) =>
        db.procedure.findUnique({ where: { slug: procedureSlug } }),
      ),
    ),
  ]);

  if ([...clinics, ...equipment, ...diseases, ...procedures].some((entity) => !entity)) {
    throw new Error("Required entity for the Glazcentr investigation was not seeded");
  }

  for (const clinic of clinics) {
    await db.investigationOnClinic.upsert({
      where: { investigationId_clinicId: { investigationId: investigation.id, clinicId: clinic!.id } },
      create: {
        investigationId: investigation.id,
        clinicId: clinic!.id,
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
      update: {
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
    });
  }
  for (const item of equipment) {
    await db.investigationOnEquipment.upsert({
      where: { investigationId_equipmentId: { investigationId: investigation.id, equipmentId: item!.id } },
      create: {
        investigationId: investigation.id,
        equipmentId: item!.id,
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
      update: {
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
    });
  }
  for (const disease of diseases) {
    await db.investigationOnDisease.upsert({
      where: { investigationId_diseaseId: { investigationId: investigation.id, diseaseId: disease!.id } },
      create: {
        investigationId: investigation.id,
        diseaseId: disease!.id,
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
      update: {
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
    });
  }
  for (const procedure of procedures) {
    await db.investigationOnProcedure.upsert({
      where: { investigationId_procedureId: { investigationId: investigation.id, procedureId: procedure!.id } },
      create: {
        investigationId: investigation.id,
        procedureId: procedure!.id,
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
      update: {
        isPublished: true,
        evidenceValidatedAt: new Date("2026-08-05T00:00:00.000Z"),
        publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      },
    });
  }

  const primaryClinic = clinics[0]!;
  const catalogEquipment = equipment[0]!;
  const equipmentInstance = await db.investigationEquipmentInstance.upsert({
    where: {
      investigationId_key: {
        investigationId: investigation.id,
        key: "allegretto-wave-eye-q-1010-2571",
      },
    },
    create: {
      investigationId: investigation.id,
      equipmentId: catalogEquipment.id,
      key: "allegretto-wave-eye-q-1010-2571",
      model: "ALLEGRETTO Wave Eye-Q",
      serialNumber: "1010-2571",
      manufactureYear: 2010,
      identificationSummary:
        "Модель, заводской номер и год выпуска воспроизведены из ответа ООО «Алкон Фармацевтика» от 07.04.2026 № 22-04-2026/L. Связь с каталожной моделью нужна для навигации и не переносит выводы о конкретном экземпляре на модель в целом.",
      isPublished: true,
      publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
    },
    update: {
      equipmentId: catalogEquipment.id,
      model: "ALLEGRETTO Wave Eye-Q",
      serialNumber: "1010-2571",
      manufactureYear: 2010,
      identificationSummary:
        "Модель, заводской номер и год выпуска воспроизведены из ответа ООО «Алкон Фармацевтика» от 07.04.2026 № 22-04-2026/L. Связь с каталожной моделью нужна для навигации и не переносит выводы о конкретном экземпляре на модель в целом.",
      isPublished: true,
      publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
    },
  });

  const registrationCheck = await db.regulatoryCheck.findFirst({
    where: {
      key: "registration-match",
      provision: {
        edition: {
          regulation: { slug: "federal-law-323-fz" },
        },
      },
    },
    select: { id: true },
  });
  if (!registrationCheck) {
    throw new Error("Regulatory check federal-law-323-fz/registration-match was not seeded");
  }

  const registrationAssessment = await db.investigationRegulatoryAssessment.upsert({
    where: {
      investigationId_key: {
        investigationId: investigation.id,
        key: "allegretto-1010-2571-registration-match",
      },
    },
    create: {
      investigationId: investigation.id,
      regulatoryCheckId: registrationCheck.id,
      clinicId: primaryClinic.id,
      equipmentInstanceId: equipmentInstance.id,
      key: "allegretto-1010-2571-registration-match",
      eventDateLabel:
        "Период использования конкретного экземпляра в клинике требует подтверждения первичным документом",
      status: "REQUIRES_VERIFICATION",
      applicabilityStatus: "REQUIRES_VERIFICATION",
      restrictedSignals: [
        "DOCUMENT_NOT_FOUND",
        "OLD_MANUFACTURE_YEAR",
        "THIRD_PARTY_STATEMENT",
      ],
      neutralConclusion:
        "Наличие или отсутствие применимой регистрации для конкретного экземпляра не установлено опубликованным комплектом. Требуются официальная реестровая запись с историей статуса и точное сопоставление производителя, модели и модификации.",
      alternativeVersion:
        "Регистрационная запись могла быть оформлена на иное официальное наименование, производителя или модификацию, а подтверждающие документы могли не входить в переданный комплект. Эту версию необходимо проверить по документам клиники и официальному реестру.",
      evidenceGaps:
        "Нет заверенной копии регистрационного удостоверения, архивной выписки из Государственного реестра медицинских изделий на дату использования, документов ввоза и приобретения, а также первичного документа, подтверждающего период использования экземпляра в клинике.",
      supportingEvidenceSearchCompleted: false,
      refutingEvidenceSearchCompleted: false,
      isPublished: false,
      evidenceValidatedAt: null,
      publishedAt: null,
    },
    update: {
      regulatoryCheckId: registrationCheck.id,
      appliedEditionId: null,
      clinicId: primaryClinic.id,
      procedureId: null,
      equipmentInstanceId: equipmentInstance.id,
      eventFrom: null,
      eventTo: null,
      eventDateLabel:
        "Период использования конкретного экземпляра в клинике требует подтверждения первичным документом",
      status: "REQUIRES_VERIFICATION",
      applicabilityStatus: "REQUIRES_VERIFICATION",
      restrictedSignals: [
        "DOCUMENT_NOT_FOUND",
        "OLD_MANUFACTURE_YEAR",
        "THIRD_PARTY_STATEMENT",
      ],
      neutralConclusion:
        "Наличие или отсутствие применимой регистрации для конкретного экземпляра не установлено опубликованным комплектом. Требуются официальная реестровая запись с историей статуса и точное сопоставление производителя, модели и модификации.",
      alternativeVersion:
        "Регистрационная запись могла быть оформлена на иное официальное наименование, производителя или модификацию, а подтверждающие документы могли не входить в переданный комплект. Эту версию необходимо проверить по документам клиники и официальному реестру.",
      evidenceGaps:
        "Нет заверенной копии регистрационного удостоверения, архивной выписки из Государственного реестра медицинских изделий на дату использования, документов ввоза и приобретения, а также первичного документа, подтверждающего период использования экземпляра в клинике.",
      supportingEvidenceSearchCompleted: false,
      refutingEvidenceSearchCompleted: false,
      isPublished: false,
      evidenceValidatedAt: null,
      publishedAt: null,
    },
  });

  const manufacturerResponse = await db.investigationDocument.findUnique({
    where: {
      investigationId_slug: {
        investigationId: investigation.id,
        slug: "alcon-response-2026-04-07",
      },
    },
    select: { id: true },
  });
  if (!manufacturerResponse) {
    throw new Error("Manufacturer response for the ALLEGRETTO instance was not seeded");
  }
  await db.investigationAssessmentEvidence.upsert({
    where: {
      assessmentId_documentId: {
        assessmentId: registrationAssessment.id,
        documentId: manufacturerResponse.id,
      },
    },
    create: {
      investigationId: investigation.id,
      assessmentId: registrationAssessment.id,
      documentId: manufacturerResponse.id,
      role: "CONTEXT",
      isPrimary: true,
      provenanceVerifiedAt: null,
      note:
        "Документ подтверждает идентификаторы экземпляра и позицию указанного юридического лица о том, что оно не ввозило систему. Он не подтверждает отсутствие регистрации, незаконность обращения или неприменимость иной регистрационной записи.",
    },
    update: {
      role: "CONTEXT",
      isPrimary: true,
      provenanceVerifiedAt: null,
      note:
        "Документ подтверждает идентификаторы экземпляра и позицию указанного юридического лица о том, что оно не ввозило систему. Он не подтверждает отсутствие регистрации, незаконность обращения или неприменимость иной регистрационной записи.",
    },
  });

  await db.investigationEquipmentInstanceEvidence.upsert({
    where: {
      equipmentInstanceId_documentId: {
        equipmentInstanceId: equipmentInstance.id,
        documentId: manufacturerResponse.id,
      },
    },
    create: {
      investigationId: investigation.id,
      equipmentInstanceId: equipmentInstance.id,
      documentId: manufacturerResponse.id,
      note:
        "По опубликованному скану сверены модель, заводской номер и год выпуска. Связь подтверждает только идентификацию экземпляра и не подтверждает правовое нарушение.",
      evidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
      isPublished: true,
      publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
    },
    update: {
      note:
        "По опубликованному скану сверены модель, заводской номер и год выпуска. Связь подтверждает только идентификацию экземпляра и не подтверждает правовое нарушение.",
      evidenceValidatedAt: new Date("2026-08-12T00:00:00.000Z"),
      isPublished: true,
      publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
    },
  });

  await db.investigationTimelineEvent.updateMany({
    where: {
      investigationId: investigation.id,
      key: {
        in: [
          "police-response-reference",
          "manufacturer-request",
          "manufacturer-received-request",
          "manufacturer-response",
          "manufacturer-supplement",
          "association-appeals",
        ],
      },
    },
    data: { equipmentInstanceId: equipmentInstance.id },
  });

  const news = await db.news.upsert({
    where: { slug: GLAZCENTR_NEWS.slug },
    create: {
      ...GLAZCENTR_NEWS,
      isPublished: true,
      publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
    },
    update: {
      title: GLAZCENTR_NEWS.title,
      summary: GLAZCENTR_NEWS.summary,
      content: GLAZCENTR_NEWS.content,
      isPublished: true,
      publishedAt: GLAZCENTR_INVESTIGATION.publishedAt,
      seoTitle: GLAZCENTR_NEWS.seoTitle,
      seoDescription: GLAZCENTR_NEWS.seoDescription,
    },
  });

  await db.newsOnInvestigation.upsert({
    where: { newsId_investigationId: { newsId: news.id, investigationId: investigation.id } },
    create: { newsId: news.id, investigationId: investigation.id },
    update: {},
  });

  console.log(
    "✓ Investigation: " +
      investigation.title +
      " (" +
      GLAZCENTR_INVESTIGATION.documents.length +
      " documents, " +
      GLAZCENTR_INVESTIGATION.procedureSlugs.length +
      " procedures)",
  );
}

async function seedIndependentControlCorpus() {
  const validation = validateIndependentControlCorpus([
    INDEPENDENT_CONTROL_OBSERVATION_FORM,
  ]);
  if (!validation.valid) {
    throw new Error(
      [
        "Корпус независимого контроля не прошёл предзаписную валидацию:",
        ...validation.errors.map((error) => `- ${error}`),
      ].join("\n"),
    );
  }

  console.log("Seeding independent-control methodology and assessments...");

  const methodology = INDEPENDENT_CONTROL_OBSERVATION_FORM;
  const methodologyData = {
    title: methodology.title,
    summary: methodology.summary,
    description: methodology.rightsNote,
    legalStatusNote: methodology.legalStatusNote,
    bibliographicCitation: methodology.bibliographicDetails,
    officialMethodologyUrl: methodology.officialMethodologyUrl,
    isPublished: methodology.isPublished,
    evidenceValidatedAt: methodology.evidenceValidatedAt ?? null,
    publishedAt: methodology.publishedAt ?? null,
    seoTitle: methodology.seo.title,
    seoDescription: methodology.seo.description,
  };
  const seededMethodology = await db.independentControlMethodology.upsert({
    where: { slug: methodology.slug },
    create: { slug: methodology.slug, ...methodologyData },
    update: methodologyData,
  });

  for (const [sortOrder, item] of methodology.sources.entries()) {
    if (!item.key) throw new Error(`Independent-control source ${sortOrder} has no stable key`);
    const kind = item.kind === "LOCAL_BIBLIOGRAPHIC"
      ? "LOCAL_DOCUMENT" as const
      : "OFFICIAL_METHODOLOGY" as const;
    const sourceData = {
      kind,
      title: item.title,
      bibliographicCitation:
        item.kind === "LOCAL_BIBLIOGRAPHIC"
          ? methodology.bibliographicDetails
          : `${item.title}. ${item.url}`,
      sourceUrl: item.url ?? null,
      internalFileName: item.internalFilename ?? null,
      sha256: item.sha256,
      rightsBasis: item.rightsStatus,
      rightsVerifiedAt: item.rightsVerifiedAt ?? null,
      rightsNote: item.rightsNote,
      publicFileUrl: item.publicFileUrl ?? null,
      isPublished: true,
      evidenceValidatedAt: methodology.evidenceValidatedAt ?? null,
      publishedAt: methodology.publishedAt ?? null,
      sortOrder,
    };
    await db.independentControlSource.upsert({
      where: {
        methodologyId_key: {
          methodologyId: seededMethodology.id,
          key: item.key,
        },
      },
      create: {
        methodologyId: seededMethodology.id,
        key: item.key,
        ...sourceData,
      },
      update: sourceData,
    });
  }

  const criterionIds = new Map<string, string>();
  for (const criterion of methodology.criteria) {
    if (typeof criterion.isSourceCriterion !== "boolean") {
      throw new Error(`Independent-control criterion ${criterion.stableKey} has no source flag`);
    }
    const criterionData = {
      sourceLocator: criterion.sourceLocator,
      sectionKey: criterion.sectionKey,
      sectionTitle: criterion.sectionTitle,
      title: criterion.title,
      statement: criterion.statement,
      whatIsChecked: criterion.whatIsChecked,
      checkQuestion: criterion.checkQuestion,
      factToEstablish: criterion.factToEstablish,
      confirmingDocument: criterion.confirmingPrimaryDocument,
      evidenceRequired: criterion.evidenceRequired,
      evidenceThreshold: criterion.evidenceThreshold,
      applicabilityNote: criterion.applicabilityNote,
      sourceDivergenceNote: criterion.sourceDivergenceNote,
      basisKind: criterion.basisKind,
      allowedStatuses: [...criterion.allowedStatuses],
      isSourceCriterion: criterion.isSourceCriterion,
      effectiveFrom: null,
      effectiveTo: null,
      isPublished: criterion.isPublished,
      evidenceValidatedAt: criterion.evidenceValidatedAt ?? null,
      publishedAt: criterion.publishedAt ?? null,
      sortOrder: criterion.sortOrder,
    };
    const seededCriterion = await db.independentControlCriterion.upsert({
      where: {
        methodologyId_key: {
          methodologyId: seededMethodology.id,
          key: criterion.stableKey,
        },
      },
      create: {
        methodologyId: seededMethodology.id,
        key: criterion.stableKey,
        ...criterionData,
      },
      update: criterionData,
    });
    criterionIds.set(criterion.stableKey, seededCriterion.id);
  }

  for (const criterion of methodology.criteria) {
    const criterionId = criterionIds.get(criterion.stableKey);
    if (!criterionId) throw new Error(`Independent-control criterion was not seeded: ${criterion.stableKey}`);

    for (const link of criterion.normLinks) {
      if (!link.editionKey) {
        throw new Error(`Independent-control norm link has no edition: ${criterion.stableKey}`);
      }
      const matches = await db.regulatoryCheck.findMany({
        where: {
          key: link.checkKey,
          provision: {
            key: link.provisionKey,
            edition: {
              key: link.editionKey,
              regulation: { slug: link.regulationKey },
            },
          },
        },
        select: { id: true },
      });
      if (matches.length !== 1) {
        throw new Error(
          `Expected exactly one regulatory node ${link.regulationKey}/${link.editionKey}/${link.provisionKey}/${link.checkKey}, found ${matches.length}`,
        );
      }
      const role = link.role === "DIRECT_REQUIREMENT"
        ? "DIRECT_BASIS" as const
        : link.role === "HISTORICAL_CONTEXT"
          ? "HISTORICAL_BASIS" as const
          : "SUPPORTING_BASIS" as const;
      const normData = {
        role,
        verifiedAt: methodology.evidenceValidatedAt!,
        note:
          `Связь с точной редакцией ${link.regulationKey}/${link.editionKey}; локальный критерий не расширяет содержание проверочного вопроса.`,
        isPublished: criterion.isPublished,
        evidenceValidatedAt: criterion.evidenceValidatedAt ?? null,
        publishedAt: criterion.publishedAt ?? null,
      };
      await db.independentControlCriterionNorm.upsert({
        where: {
          criterionId_regulatoryCheckId: {
            criterionId,
            regulatoryCheckId: matches[0].id,
          },
        },
        create: {
          criterionId,
          regulatoryCheckId: matches[0].id,
          ...normData,
        },
        update: normData,
      });
    }
  }

  const investigation = await db.investigation.findUnique({
    where: { slug: GLAZCENTR_INDEPENDENT_CONTROL.investigationSlug },
    select: { id: true },
  });
  const clinic = await db.clinic.findUnique({
    where: { slug: GLAZCENTR_INDEPENDENT_CONTROL.clinicSlug },
    select: { id: true },
  });
  if (!investigation || !clinic) {
    throw new Error("Glazcentr investigation or clinic was not seeded before independent-control assessments");
  }
  const clinicRelation = await db.investigationOnClinic.findUnique({
    where: {
      investigationId_clinicId: {
        investigationId: investigation.id,
        clinicId: clinic.id,
      },
    },
    select: { investigationId: true },
  });
  if (!clinicRelation) {
    throw new Error("Glazcentr investigation-clinic relation was not seeded before independent-control assessments");
  }

  const privateAssessments = buildPrivateGlazcentrSourceAssessments(methodology.criteria);
  if (privateAssessments.length !== 80) {
    throw new Error(`Expected 80 private source assessments, found ${privateAssessments.length}`);
  }
  for (const assessment of privateAssessments) {
    const criterionId = criterionIds.get(assessment.criterionKey);
    if (!criterionId) throw new Error(`Assessment criterion was not seeded: ${assessment.criterionKey}`);
    const assessmentData = {
      criterionId,
      appliedCriterionNormId: null,
      clinicId: clinic.id,
      eventFrom: null,
      eventTo: null,
      eventDateLabel: assessment.eventDateLabel,
      status: assessment.status,
      applicabilityStatus: assessment.applicabilityStatus,
      restrictedSignals: [],
      neutralConclusion: assessment.neutralConclusion,
      alternativeVersion: assessment.alternativeVersion,
      evidenceGaps: assessment.evidenceGaps,
      supportingEvidenceSearchCompleted: assessment.supportingEvidenceSearchCompleted,
      refutingEvidenceSearchCompleted: assessment.refutingEvidenceSearchCompleted,
      isPublished: assessment.isPublished,
      evidenceValidatedAt: assessment.evidenceValidatedAt,
      publishedAt: assessment.publishedAt,
    };
    await db.investigationIndependentControlAssessment.upsert({
      where: {
        investigationId_key: {
          investigationId: investigation.id,
          key: assessment.key,
        },
      },
      create: {
        investigationId: investigation.id,
        key: assessment.key,
        ...assessmentData,
      },
      update: assessmentData,
    });
  }

  const publicScope = GLAZCENTR_FORMAL_NOC_SCOPE_ASSESSMENT;
  const scopeCriterionId = criterionIds.get(publicScope.criterionKey);
  if (!scopeCriterionId) throw new Error("formal-noc-scope criterion was not seeded");
  const scopeData = {
    criterionId: scopeCriterionId,
    appliedCriterionNormId: null,
    clinicId: clinic.id,
    eventFrom: null,
    eventTo: null,
    eventDateLabel: publicScope.eventDateLabel,
    status: publicScope.status,
    applicabilityStatus: publicScope.applicabilityStatus,
    restrictedSignals: [],
    neutralConclusion: publicScope.neutralConclusion,
    alternativeVersion: publicScope.alternativeVersion,
    evidenceGaps: publicScope.evidenceGaps,
    supportingEvidenceSearchCompleted: publicScope.supportingEvidenceSearchCompleted,
    refutingEvidenceSearchCompleted: publicScope.refutingEvidenceSearchCompleted,
    isPublished: publicScope.isPublished,
    evidenceValidatedAt: publicScope.evidenceValidatedAt,
    publishedAt: publicScope.publishedAt,
  };
  const scopeAssessment = await db.investigationIndependentControlAssessment.upsert({
    where: {
      investigationId_key: {
        investigationId: investigation.id,
        key: publicScope.key,
      },
    },
    create: {
      investigationId: investigation.id,
      key: publicScope.key,
      ...scopeData,
    },
    update: scopeData,
  });

  const contextDocument = await db.investigationDocument.findUnique({
    where: {
      investigationId_slug: {
        investigationId: investigation.id,
        slug: publicScope.contextDocumentSlug,
      },
    },
    select: { id: true },
  });
  if (!contextDocument) {
    throw new Error(`Context document was not seeded: ${publicScope.contextDocumentSlug}`);
  }
  await db.investigationIndependentControlEvidence.upsert({
    where: {
      assessmentId_documentId: {
        assessmentId: scopeAssessment.id,
        documentId: contextDocument.id,
      },
    },
    create: {
      investigationId: investigation.id,
      assessmentId: scopeAssessment.id,
      documentId: contextDocument.id,
      role: "CONTEXT",
      isPrimary: false,
      provenanceVerifiedAt: null,
      note:
        "Обращение содержит утверждение заявителя об участии организации в территориальной программе, но не является первичным доказательством включения точного юридического лица в официальный цикл НОК.",
    },
    update: {
      role: "CONTEXT",
      isPrimary: false,
      provenanceVerifiedAt: null,
      note:
        "Обращение содержит утверждение заявителя об участии организации в территориальной программе, но не является первичным доказательством включения точного юридического лица в официальный цикл НОК.",
    },
  });

  console.log(
    `✓ Independent control: ${methodology.criteria.length} criteria, ${privateAssessments.length} private assessments, 1 cautious public scope assessment`,
  );
}

async function seedSto2026Event() {
  const event = await db.event.upsert({
    where: { slug: STO_2026_EVENT_SLUG },
    create: {
      slug: STO_2026_EVENT_SLUG,
      title: STO_2026_EVENT.title,
      description: STO_2026_EVENT.description,
      organizerName: STO_2026_EVENT.organizerName,
      organizerEmail: STO_2026_EVENT.organizerEmail,
      startsAt: new Date(STO_2026_EVENT.startsAt),
      registrationStartsAt: new Date(STO_2026_EVENT.registrationStartsAt),
      venueName: STO_2026_EVENT.venueName,
      venueAddress: STO_2026_EVENT.venueAddress,
      city: STO_2026_EVENT.city,
       registrationOpen: true,
      programPublished: true,
      speakersPublished: true,
    },
    update: {
      title: STO_2026_EVENT.title,
      description: STO_2026_EVENT.description,
      organizerName: STO_2026_EVENT.organizerName,
      organizerEmail: STO_2026_EVENT.organizerEmail,
      startsAt: new Date(STO_2026_EVENT.startsAt),
      registrationStartsAt: new Date(STO_2026_EVENT.registrationStartsAt),
      venueName: STO_2026_EVENT.venueName,
      venueAddress: STO_2026_EVENT.venueAddress,
      city: STO_2026_EVENT.city,
       registrationOpen: true,
      programPublished: true,
      speakersPublished: true,
    },
  });

  const speakersByOrder = new Map<number, string>();
  for (const speaker of STO_2026_SPEAKERS) {
    const doctor = await db.doctor.findUnique({
      where: { slug: speaker.doctorSlug },
      select: { id: true },
    });
    if (!doctor) {
      throw new Error(`STO-2026 speaker Doctor not found: ${speaker.doctorSlug}`);
    }

    const eventSpeaker = await db.eventSpeaker.upsert({
      where: { eventId_doctorId: { eventId: event.id, doctorId: doctor.id } },
      create: {
        eventId: event.id,
        doctorId: doctor.id,
        order: speaker.order,
        fullNameSnapshot: speaker.fullName,
        credentialsSnapshot: speaker.credentials,
        organizationRole: speaker.organizationRole ?? null,
        photoUrlSnapshot: speaker.photoUrl,
        published: true,
      },
      update: {
        order: speaker.order,
        fullNameSnapshot: speaker.fullName,
        credentialsSnapshot: speaker.credentials,
        organizationRole: speaker.organizationRole ?? null,
        photoUrlSnapshot: speaker.photoUrl,
        published: true,
      },
    });
    speakersByOrder.set(speaker.order, eventSpeaker.id);
  }

  for (const item of STO_2026_PROGRAM) {
    const speakerId = speakersByOrder.get(item.speakerOrder);
    const speaker = STO_2026_SPEAKERS.find((candidate) => candidate.order === item.speakerOrder);
    if (!speakerId || !speaker) {
      throw new Error(`STO-2026 program speaker not found: ${item.speakerOrder}`);
    }

    await db.eventTalk.upsert({
      where: { eventId_sortOrder: { eventId: event.id, sortOrder: item.order } },
      create: {
        eventId: event.id,
        speakerId,
        kind: "TALK",
        title: item.title,
        speakerNameSnapshot: speaker.fullName,
        moderatorSnapshot: null,
        startAt: null,
        endAt: null,
        published: item.published,
        sortOrder: item.order,
      },
      update: {
        speakerId,
        kind: "TALK",
        title: item.title,
        speakerNameSnapshot: speaker.fullName,
        startAt: null,
        endAt: null,
        published: item.published,
        sortOrder: item.order,
      },
    });
  }

  await db.eventConsentTemplate.upsert({
    where: {
      eventId_version: {
        eventId: event.id,
        version: "draft-2026-08-26",
      },
    },
    create: {
      eventId: event.id,
      version: "draft-2026-08-26",
      title: "[ТРЕБУЕТ УТВЕРЖДЕНИЯ] Согласие на регистрацию",
      body: "[Текст юридического согласия должен быть утверждён до открытия регистрации.]",
      isActive: false,
      requiresApproval: true,
    },
    update: {
      title: "[ТРЕБУЕТ УТВЕРЖДЕНИЯ] Согласие на регистрацию",
      body: "[Текст юридического согласия должен быть утверждён до открытия регистрации.]",
      isActive: false,
      requiresApproval: true,
    },
  });

  await db.eventConsentTemplate.upsert({
    where: {
      eventId_version: {
        eventId: event.id,
        version: "event-2026-08-27-v1",
      },
    },
    create: {
      eventId: event.id,
      version: "event-2026-08-27-v1",
      title: "Согласие на обработку персональных данных для регистрации на конференцию",
      body: "Согласен(на) на обработку персональных данных для регистрации на конференцию. Политика обработки персональных данных сайта: https://oftalmologia.pro/privacy-policy",
      isActive: true,
      requiresApproval: false,
    },
    update: {
      title: "Согласие на обработку персональных данных для регистрации на конференцию",
      body: "Согласен(на) на обработку персональных данных для регистрации на конференцию. Политика обработки персональных данных сайта: https://oftalmologia.pro/privacy-policy",
      isActive: true,
      requiresApproval: false,
    },
  });

  console.log(`✓ Event: ${event.slug} (6 speakers, ${STO_2026_PROGRAM.length} talks, registration open)`);
}

async function main() {
  validateSeedCorpora();
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
      update: {
        title: d.title,
        categoryId: category.id,
        summary: d.summary ?? null,
        description: d.description ?? null,
        symptoms: d.symptoms ?? [],
        diagnostics: d.diagnostics ?? null,
        treatment: d.treatment ?? null,
      },
      create: {
        slug: d.slug,
        title: d.title,
        categoryId: category.id,
        summary: d.summary ?? null,
        description: d.description ?? null,
        symptoms: d.symptoms ?? [],
        diagnostics: d.diagnostics ?? null,
        treatment: d.treatment ?? null,
      },
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
      update: {
        title: p.title,
        categoryId: category.id,
        summary: p.summary ?? null,
        description: p.description ?? null,
      },
      create: {
        slug: p.slug,
        title: p.title,
        categoryId: category.id,
        summary: p.summary ?? null,
        description: p.description ?? null,
      },
    });
  }
  console.log(`✓ ${PROCEDURES.length} procedures`);

  // Прямые связи Заболевание → Процедура. Создаются только там, где связь
  // подтверждена источником заболевания, а не выводится транзитивно из врача.
  for (const d of DISEASES) {
    if (!d.procedureSlugs?.length) continue;
    const disease = await db.disease.findUnique({ where: { slug: d.slug } });
    if (!disease) {
      console.warn(`⚠ Disease not found for procedure links: ${d.slug}`);
      continue;
    }
    for (const procedureSlug of d.procedureSlugs) {
      const procedure = await db.procedure.findUnique({ where: { slug: procedureSlug } });
      if (!procedure) {
        console.warn(`⚠ Procedure not found: ${procedureSlug} for disease ${d.slug}`);
        continue;
      }
      await db.diseaseOnProcedure.upsert({
        where: {
          diseaseId_procedureId: { diseaseId: disease.id, procedureId: procedure.id },
        },
        create: { diseaseId: disease.id, procedureId: procedure.id },
        update: {},
      });
    }
  }

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
        description: c.description ?? null,
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
        description: c.description ?? null,
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
  const expectedActiveCount = CLINICS.filter((clinic) => clinic.status === "active").length;
  console.log(`✓ Clinics total: ${totalCount} (active: ${activeCount}, inactive: ${inactiveCount})`);

  if (activeCount !== expectedActiveCount) {
    console.warn(`⚠ Expected ${expectedActiveCount} active clinics, got ${activeCount}`);
  } else {
    console.log(`✓ Active clinic count = ${expectedActiveCount} ✓`);
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
        bio: d.bio ?? null,
        career: d.career ?? null,
        region: d.region ?? null,
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
        ...(d.bio !== undefined ? { bio: d.bio } : {}),
        ...(d.career !== undefined ? { career: d.career } : {}),
        ...(d.region !== undefined ? { region: d.region } : {}),
        // Preserve manually uploaded photos for every doctor except this explicit asset replacement.
        ...(d.slug === "ostroverhov-aleksandr-ivanovich" ? { photoUrl: d.photoUrl } : {}),
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
  if (doctorCount !== 10) {
    console.warn(`⚠ Expected 10 doctors, got ${doctorCount}`);
  }

  // ─── Seed approved event snapshot ─────────────────────────────────────────
  await seedSto2026Event();

  // ─── Innovations ───────────────────────────────────────────────────────────
  // Rich editorial sections and provenance live in the typed content registry.
  // The existing Innovation row only provides the stable entity, catalog data,
  // publication date and dynamic sitemap entry.
  const panOptixPro = getInnovationContent("clareon-panoptix-pro");
  if (panOptixPro) {
    await db.innovation.upsert({
      where: { slug: panOptixPro.slug },
      create: {
        slug: panOptixPro.slug,
        title: panOptixPro.title,
        summary: panOptixPro.summary,
        sourceUrl: panOptixPro.sources[0]?.url ?? null,
        publishedAt: new Date("2026-08-21T00:00:00.000Z"),
      },
      update: {
        title: panOptixPro.title,
        summary: panOptixPro.summary,
        sourceUrl: panOptixPro.sources[0]?.url ?? null,
        publishedAt: new Date("2026-08-21T00:00:00.000Z"),
      },
    });
    console.log(`✓ Innovation: ${panOptixPro.title} (/${panOptixPro.slug})`);
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

  await seedRegulatoryCorpus();

  console.log("Seeding Association investigations and news...");
  await seedGlazcentrInvestigation();
  await seedIndependentControlCorpus();

  // ─── Конфигурация формы обращений ─────────────────────────────────────────
  // Это намеренно НЕ юридический текст. До утверждения документа форма показывает
  // только явно незаполненные поля; администратор заменяет конфигурацию без кода.
  const activeConsentTemplate = await db.appealConsentTemplate.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  if (!activeConsentTemplate) {
    await db.appealConsentTemplate.upsert({
      where: { version: "draft-2026-08-07" },
      create: {
        version: "draft-2026-08-07",
        title: "Шаблон согласия на обработку персональных данных",
        body: [
          "[ТРЕБУЕТ УТВЕРЖДЕНИЯ]",
          "Оператор персональных данных: [УКАЗАТЬ ПОЛНОЕ НАИМЕНОВАНИЕ И РЕКВИЗИТЫ]",
          "Адрес оператора: [УКАЗАТЬ АДРЕС]",
          "Цели обработки: [УКАЗАТЬ УТВЕРЖДЁННЫЕ ЦЕЛИ]",
          "Перечень обрабатываемых данных: [УКАЗАТЬ УТВЕРЖДЁННЫЙ ПЕРЕЧЕНЬ]",
          "Действия с персональными данными: [УКАЗАТЬ УТВЕРЖДЁННЫЙ ПЕРЕЧЕНЬ]",
          "Срок обработки и порядок отзыва: [УКАЗАТЬ УТВЕРЖДЁННЫЕ УСЛОВИЯ]",
          "Контакт для отзыва согласия: [УКАЗАТЬ КОНТАКТ]",
        ].join("\n\n"),
        isActive: true,
        requiresApproval: true,
      },
      update: { isActive: true },
    });
  }
  console.log("✓ Appeal consent configuration is available");

  // ─── Scientific works ───────────────────────────────────────────────────────
  console.log("Seeding scientific works...");

  for (const w of SCIENTIFIC_WORKS) {
    const doctor = await db.doctor.findUnique({ where: { slug: w.doctorSlug } });
    if (!doctor) {
      console.warn(`⚠ Doctor not found: ${w.doctorSlug} for work "${w.title}"`);
      continue;
    }
    await db.$transaction(async (tx) => {
    const contentData = {
      slug: w.slug,
      type: w.type,
      authors: [...(w.authors ?? [])],
      doctorAuthorIndex: w.doctorAuthorIndex ?? null,
      bibliography: w.bibliography ?? null,
      journal: w.journal ?? null,
      volume: w.volume ?? null,
      issue: w.issue ?? null,
      pages: w.pages ?? null,
      doi: w.doi ?? null,
      sourcePageUrl: w.sourcePageUrl ?? null,
      sourcePdfUrl: w.sourcePdfUrl ?? null,
      sourceStatus: w.sourceStatus ?? "BIBLIOGRAPHIC_ONLY",
      sourceNote: w.sourceNote ?? null,
      contentKind: w.contentKind ?? "OTHER",
      topic: w.topic ?? null,
      degree: w.degree ?? null,
      speciality: w.speciality ?? null,
      year: w.year ?? null,
      organization: w.organization ?? null,
      supervisor: w.supervisor ?? null,
      summary: w.summary ?? null,
      novelty: [...(w.novelty ?? [])],
      practicalValue: [...(w.practicalValue ?? [])],
      results: [...(w.results ?? [])],
      conclusions: [...(w.conclusions ?? [])],
      publicationCount: w.publicationCount ?? null,
      publicationBlockReason: w.publicationBlockReason ?? null,
      seoTitle: w.seoTitle ?? null,
      seoDescription: w.seoDescription ?? null,
      sortOrder: w.sortOrder ?? 0,
    };
    // Старый импорт мог иметь тот же уникальный (doctorId, title), но другой
    // или пустой slug. Переносим такую запись на стабильный URL до upsert.
    const existingBySlug = await tx.scientificWork.findUnique({
      where: { slug: w.slug },
      select: { id: true },
    });
    if (!existingBySlug) {
      const existingByTitle = await tx.scientificWork.findUnique({
        where: { doctorId_title: { doctorId: doctor.id, title: w.title } },
        select: { id: true },
      });
      if (existingByTitle) {
        await tx.scientificWork.update({
          where: { id: existingByTitle.id },
          data: { slug: w.slug },
        });
      }
    }

    const existingWork = await tx.scientificWork.findUnique({
      where: { slug: w.slug },
      select: {
        id: true,
        pdfUrl: true,
        abstractUrl: true,
        rightsVerifiedAt: true,
        rightsBasis: true,
        rightsNote: true,
        isPublished: true,
        evidenceValidatedAt: true,
        publishedAt: true,
        publicationBlockReason: true,
      },
    });

    // Однократное узкое исправление прежней диссертационной карточки: детальные
    // выводы и связи были опубликованы без доступного первичного текста.
    const isLegacyDissertation =
      w.slug === "ekspress-krosslinking-pri-keratektaziyah" &&
      existingWork !== null &&
      existingWork.rightsVerifiedAt === null &&
      existingWork.rightsBasis === "UNVERIFIED" &&
      (existingWork.pdfUrl ===
        "/doctors/ostroverhov-aleksandr-ivanovich/dissertaciya.pdf" ||
        existingWork.abstractUrl ===
          "/doctors/ostroverhov-aleksandr-ivanovich/avtoreferat.pdf");
    if (isLegacyDissertation) {
      await tx.scientificWork.update({
        where: { id: existingWork.id },
        data: {
          summary: null,
          novelty: [],
          practicalValue: [],
          results: [],
          conclusions: [],
          publicationCount: null,
          pdfUrl: null,
          abstractUrl: null,
          images: [],
          isPublished: false,
          evidenceValidatedAt: null,
          publishedAt: null,
          publicationBlockReason: w.publicationBlockReason ?? null,
          rightsVerifiedAt: null,
          rightsBasis: "UNVERIFIED",
          rightsNote: w.rightsNote ?? null,
        },
      });
      await tx.scientificWorkOnDisease.deleteMany({ where: { workId: existingWork.id } });
      await tx.scientificWorkOnProcedure.deleteMany({ where: { workId: existingWork.id } });
      await tx.scientificWorkOnEquipment.deleteMany({ where: { workId: existingWork.id } });
    }

    // Прежнее наличие публичной YAG-копии не является доказательством прав.
    // Очищение срабатывает только для точной старой служебной формулировки и не
    // затронет материалы, которые редактор позднее подтвердит документально.
    if (
      w.slug === "yag-lazernaya-gialoidopunktura-retinopatiya-valsalvy" &&
      existingWork?.rightsNote ===
        "Существующая публичная локальная копия и иллюстрации сохранены при внедрении структурированного publication gate."
    ) {
      await tx.scientificWork.update({
        where: { id: existingWork.id },
        data: {
          pdfUrl: null,
          abstractUrl: null,
          images: [],
          rightsVerifiedAt: null,
          rightsBasis: "UNVERIFIED",
          rightsNote: w.rightsNote ?? null,
        },
      });
    }

    // После добавления структурированного основания прав старая строка статьи
    // о детском кератоконусе уже содержала дату и точную CC BY 4.0 пометку, но
    // получила enum-значение по умолчанию. Нормализуем только этот известный
    // legacy-маркер, не перезаписывая последующие редакторские решения.
    if (
      w.slug === "glubokaya-posloynaya-peresadka-deti" &&
      w.rightsBasis === "OPEN_LICENSE" &&
      existingWork?.rightsBasis === "UNVERIFIED" &&
      existingWork.rightsVerifiedAt?.toISOString() === "2026-08-12T00:00:00.000Z" &&
      existingWork.rightsNote === w.rightsNote
    ) {
      await tx.scientificWork.update({
        where: { id: existingWork.id },
        data: { rightsBasis: "OPEN_LICENSE" },
      });
    }

    // Первое применение пользовательского подтверждения ошибочно использовало
    // более сильную категорию AUTHOR_PERMISSION. Исправляем только точную
    // служебную пометку и дату этого решения, не приписывая разрешение автору.
    if (
      OSTROVERHOV_SCIENTIFIC_WORK_SLUGS.has(w.slug) &&
      w.rightsBasis === "USER_CONFIRMED_PERMISSION" &&
      existingWork?.rightsBasis === "AUTHOR_PERMISSION" &&
      existingWork.rightsVerifiedAt?.toISOString() === "2026-08-13T00:00:00.000Z" &&
      existingWork.rightsNote === w.rightsNote
    ) {
      await tx.scientificWork.update({
        where: { id: existingWork.id },
        data: { rightsBasis: "USER_CONFIRMED_PERMISSION" },
      });
    }

    // Пользователь 13.08.2026 подтвердил каноническое отчество «Иванович» и
    // разрешение на распространение переданных материалов. Обновление срабатывает
    // только для точного прежнего identity-блокера или старого нетронутого draft,
    // поэтому последующие редакторские решения повторный seed не перезапишет.
    if (
      OSTROVERHOV_SCIENTIFIC_WORK_SLUGS.has(w.slug) &&
      (existingWork?.publicationBlockReason ===
        OSTROVERHOV_LEGACY_IDENTITY_REVIEW_NOTE ||
        (existingWork?.publicationBlockReason === null &&
          existingWork.rightsVerifiedAt === null &&
          existingWork.rightsBasis === "UNVERIFIED" &&
          existingWork.pdfUrl === null &&
          existingWork.abstractUrl === null)) &&
      existingWork.isPublished === false &&
      existingWork.evidenceValidatedAt === null &&
      existingWork.publishedAt === null
    ) {
      await tx.scientificWork.update({
        where: { id: existingWork.id },
        data: {
          pdfUrl: w.pdfUrl ?? null,
          abstractUrl: w.abstractUrl ?? null,
          images: [...(w.images ?? [])],
          isPublished: w.isPublished ?? false,
          evidenceValidatedAt: w.evidenceValidatedAt ?? null,
          publishedAt: w.publishedAt ?? null,
          publicationBlockReason: w.publicationBlockReason ?? null,
          rightsVerifiedAt: w.rightsVerifiedAt ?? null,
          rightsBasis: w.rightsBasis ?? "UNVERIFIED",
          rightsNote: w.rightsNote ?? null,
        },
      });
    }

    const work = await tx.scientificWork.upsert({
      where: { slug: w.slug },
      create: {
        doctorId: doctor.id,
        title: w.title,
        ...contentData,
        pdfUrl: w.pdfUrl ?? null,
        abstractUrl: w.abstractUrl ?? null,
        images: [...(w.images ?? [])],
        isPublished: w.isPublished ?? false,
        evidenceValidatedAt: w.evidenceValidatedAt ?? null,
        publishedAt: w.publishedAt ?? null,
        rightsVerifiedAt: w.rightsVerifiedAt ?? null,
        rightsBasis: w.rightsBasis ?? "UNVERIFIED",
        rightsNote: w.rightsNote ?? null,
      },
      // Публикационные флаги, локальные файлы и права принадлежат редакционному
      // workflow. Повторный seed обновляет библиографию, но не откатывает решения.
      update: { doctorId: doctor.id, title: w.title, ...contentData },
    });

    // Связи по ТЕМЕ работы (прямые, не через врача). Seed добавляет только
    // подтверждённые связи и не удаляет редакторские отношения без provenance.
    const expectedDiseaseSlugs = [...(w.diseaseSlugs ?? [])];
    const diseases = await tx.disease.findMany({
      where: { slug: { in: expectedDiseaseSlugs } },
      select: { id: true, slug: true },
    });
    if (diseases.length !== expectedDiseaseSlugs.length) {
      const found = new Set(diseases.map((item) => item.slug));
      throw new Error(
        `Disease not found for work "${w.title}": ${expectedDiseaseSlugs.filter((item) => !found.has(item)).join(", ")}`,
      );
    }
    for (const disease of diseases) {
      await tx.scientificWorkOnDisease.upsert({
        where: { workId_diseaseId: { workId: work.id, diseaseId: disease.id } },
        create: { workId: work.id, diseaseId: disease.id },
        update: {},
      });
    }

    const expectedProcedureSlugs = [...(w.procedureSlugs ?? [])];
    const procedures = await tx.procedure.findMany({
      where: { slug: { in: expectedProcedureSlugs } },
      select: { id: true, slug: true },
    });
    if (procedures.length !== expectedProcedureSlugs.length) {
      const found = new Set(procedures.map((item) => item.slug));
      throw new Error(
        `Procedure not found for work "${w.title}": ${expectedProcedureSlugs.filter((item) => !found.has(item)).join(", ")}`,
      );
    }
    for (const procedure of procedures) {
      await tx.scientificWorkOnProcedure.upsert({
        where: { workId_procedureId: { workId: work.id, procedureId: procedure.id } },
        create: { workId: work.id, procedureId: procedure.id },
        update: {},
      });
    }

    const expectedEquipmentSlugs = [...(w.equipmentSlugs ?? [])];
    const equipmentItems = await tx.equipment.findMany({
      where: { slug: { in: expectedEquipmentSlugs } },
      select: { id: true, slug: true },
    });
    if (equipmentItems.length !== expectedEquipmentSlugs.length) {
      const found = new Set(equipmentItems.map((item) => item.slug));
      throw new Error(
        `Equipment not found for work "${w.title}": ${expectedEquipmentSlugs.filter((item) => !found.has(item)).join(", ")}`,
      );
    }
    for (const equipment of equipmentItems) {
      await tx.scientificWorkOnEquipment.upsert({
        where: { workId_equipmentId: { workId: work.id, equipmentId: equipment.id } },
        create: { workId: work.id, equipmentId: equipment.id },
        update: {},
      });
    }

    });

    console.log(
      `  ✓ ${w.type}: «${w.title}» → ${doctor.lastName} ${doctor.firstName} (/${w.slug}, ${w.diseaseSlugs?.length ?? 0} diseases, ${w.procedureSlugs?.length ?? 0} procedures, ${w.equipmentSlugs?.length ?? 0} equipment)`,
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

