export type ClinicType = "centre" | "cabinet" | "mntk" | "clinic";

export type StaticClinic = {
  slug: string;
  title: string;
  legalName?: string;
  city: string;
  region: string;
  clinicType: ClinicType;
  networkName?: string;
  omsEnabled: boolean;
  website?: string;
  address?: string;
  logo?: string;
  relatedSlugs?: string[];
};

export const CLINIC_TYPE_LABEL: Record<ClinicType, string> = {
  centre: "Центр",
  cabinet: "Кабинет",
  mntk: "МНТК",
  clinic: "Клиника",
};

export const CLINICS: StaticClinic[] = [
  // ── Тюмень ────────────────────────────────────────────────────────────────
  {
    slug: "vizus1-tyumen",
    title: "Центр микрохирургии глаза «Визус-1»",
    city: "Тюмень",
    region: "Тюменская область",
    clinicType: "centre",
    networkName: "Визус-1",
    omsEnabled: false,
    website: "https://vizus1.ru",
  },
  {
    slug: "vizus1-tyumen-oftalmo",
    title: "Офтальмологический центр «Визус-1»",
    city: "Тюмень",
    region: "Тюменская область",
    clinicType: "centre",
    networkName: "Визус-1",
    omsEnabled: false,
    website: "https://oftalmo72.ru",
  },
  {
    slug: "vizus1-tyumen-oms",
    title: "«Визус-1» (ОМС)",
    city: "Тюмень",
    region: "Тюменская область",
    clinicType: "cabinet",
    networkName: "Визус-1",
    omsEnabled: true,
    website: "https://tmn.vizus1.tilda.ws",
  },
  // ── Курган ────────────────────────────────────────────────────────────────
  {
    slug: "vizus1-kurgan",
    title: "Центр микрохирургии глаза «Визус-1»",
    city: "Курган",
    region: "Курганская область",
    clinicType: "centre",
    networkName: "Визус-1",
    omsEnabled: false,
    website: "https://vizus-kurgan.ru",
  },
  // ── Сургут ────────────────────────────────────────────────────────────────
  {
    slug: "vizus1-surgut",
    title: "Офтальмологический центр «Визус-1»",
    city: "Сургут",
    region: "ХМАО — Югра",
    clinicType: "centre",
    networkName: "Визус-1",
    omsEnabled: false,
    website: "https://vizus1.info",
  },
  // ── Нижневартовск ─────────────────────────────────────────────────────────
  {
    slug: "vizus1-nizhnevartovsk",
    title: "Центр микрохирургии глаза «Визус-1»",
    city: "Нижневартовск",
    region: "ХМАО — Югра",
    clinicType: "centre",
    networkName: "Визус-1",
    omsEnabled: false,
    website: "https://vizus1nv.ru",
  },
  // ── Екатеринбург ──────────────────────────────────────────────────────────
  {
    slug: "mntk-fedorova-ekb",
    title: "МНТК микрохирургии глаза им. Фёдорова",
    legalName: "ООО «МНТК микрохирургии глаза имени Фёдорова»",
    city: "Екатеринбург",
    region: "Свердловская область",
    clinicType: "mntk",
    omsEnabled: false,
  },
  // ── Салехард ──────────────────────────────────────────────────────────────
  {
    slug: "sever-salekhard",
    title: "ООО «Север»",
    legalName: "ООО «Север»",
    city: "Салехард",
    region: "ЯНАО",
    clinicType: "clinic",
    omsEnabled: false,
  },
  // ── Ноябрьск ──────────────────────────────────────────────────────────────
  {
    slug: "prozrenie-noyabrsk",
    title: "Прозрение-Север",
    legalName: "ООО ЦЕНТР МИКРОХИРУРГИИ ГЛАЗА «ПРОЗРЕНИЕ-СЕВЕР»",
    city: "Ноябрьск",
    region: "ЯНАО",
    clinicType: "centre",
    omsEnabled: false,
    website: "https://prozrenie89.ru",
    address: "г. Ноябрьск, ул. Городилова, д. 8",
    relatedSlugs: ["polyarny-krug-noyabrsk"],
  },
  {
    slug: "polyarny-krug-noyabrsk",
    title: "Полярный круг",
    legalName: "ООО «ПОЛЯРНЫЙ КРУГ»",
    city: "Ноябрьск",
    region: "ЯНАО",
    clinicType: "clinic",
    omsEnabled: true,
    website: "https://polarkrug.ru",
    address: "г. Ноябрьск, ул. Городилова, д. 8",
    relatedSlugs: ["prozrenie-noyabrsk"],
  },
  // ── Кабинеты Визус-1 ──────────────────────────────────────────────────────
  {
    slug: "vizus1-shadrinsk",
    title: "Офтальмологический кабинет «Визус-1»",
    city: "Шадринск",
    region: "Курганская область",
    clinicType: "cabinet",
    networkName: "Визус-1",
    omsEnabled: false,
  },
  {
    slug: "vizus1-ishim",
    title: "Офтальмологический кабинет «Визус-1»",
    city: "Ишим",
    region: "Тюменская область",
    clinicType: "cabinet",
    networkName: "Визус-1",
    omsEnabled: false,
  },
  {
    slug: "vizus1-tobolsk",
    title: "Офтальмологический кабинет «Визус-1»",
    city: "Тобольск",
    region: "Тюменская область",
    clinicType: "cabinet",
    networkName: "Визус-1",
    omsEnabled: false,
  },
];

export function getClinicBySlug(slug: string): StaticClinic | undefined {
  return CLINICS.find((c) => c.slug === slug);
}

export function getAllClinicSlugs(): string[] {
  return CLINICS.map((c) => c.slug);
}
