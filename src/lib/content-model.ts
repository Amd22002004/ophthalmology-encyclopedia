export type EntityKind =
  | "diseases"
  | "procedures"
  | "doctors"
  | "clinics"
  | "suppliers"
  | "equipment"
  | "guidelines"
  | "regulations"
  | "history"
  | "innovations"
  | "publications";

export type CatalogConfig = {
  kind: EntityKind;
  title: string;
  singular: string;
  path: string;
  eyebrow: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  schemaType: string;
};

export const catalogConfigs: Record<EntityKind, CatalogConfig> = {
  diseases: {
    kind: "diseases",
    title: "Заболевания органа зрения",
    singular: "Заболевание",
    path: "/diseases",
    eyebrow: "Заболевания органа зрения",
    description:
      "Центральный справочник состояний, симптомов, диагностики, процедур, врачей и клинических рекомендаций.",
    emptyTitle: "Заболевания пока не опубликованы",
    emptyDescription:
      "Структура каталога готова к наполнению проверенными медицинскими материалами и связями между сущностями.",
    schemaType: "MedicalWebPage",
  },
  procedures: {
    kind: "procedures",
    title: "Диагностика, лечение и коррекция",
    singular: "Процедура",
    path: "/procedures",
    eyebrow: "Диагностика и лечение",
    description:
      "Диагностические методы, лазерные технологии, хирургия, коррекция зрения и поддерживающие процедуры.",
    emptyTitle: "Процедуры пока не опубликованы",
    emptyDescription:
      "Каталог подготовлен для методов диагностики, лечения, коррекции и связей с заболеваниями и оборудованием.",
    schemaType: "MedicalProcedure",
  },
  doctors: {
    kind: "doctors",
    title: "Врачи и офтальмохирурги",
    singular: "Врач",
    path: "/doctors",
    eyebrow: "Специалисты",
    description:
      "Профессиональные профили, специализации, клинический опыт, публикации, школы и история отрасли.",
    emptyTitle: "Профили врачей пока не опубликованы",
    emptyDescription:
      "Будущие профили будут связаны с заболеваниями, процедурами, клиниками и научными публикациями.",
    schemaType: "MedicalBusiness",
  },
  clinics: {
    kind: "clinics",
    title: "Клиники и медицинские организации",
    singular: "Клиника",
    path: "/clinics",
    eyebrow: "Медицинские организации",
    description:
      "Информационный каталог клиник, регионов, специализаций, статусов и внешних контактов.",
    emptyTitle: "Клиники пока не опубликованы",
    emptyDescription:
      "Каталог готов к карточкам клиник без продаж, корзины и внутренней коммерческой механики.",
    schemaType: "MedicalOrganization",
  },
  suppliers: {
    kind: "suppliers",
    title: "Поставщики",
    singular: "Поставщик",
    path: "/suppliers",
    eyebrow: "Поставщики и производители",
    description:
      "Отраслевой справочник поставщиков оборудования, расходников, линз и диагностических систем.",
    emptyTitle: "Поставщики пока не опубликованы",
    emptyDescription:
      "Раздел подготовлен как информационный отраслевой каталог без marketplace-логики.",
    schemaType: "Organization",
  },
  equipment: {
    kind: "equipment",
    title: "Оборудование",
    singular: "Оборудование",
    path: "/equipment",
    eyebrow: "Медицинское оборудование",
    description:
      "Справочник офтальмологического оборудования, категорий, поставщиков, инструкций и связанных процедур.",
    emptyTitle: "Оборудование пока не опубликовано",
    emptyDescription:
      "Модель рассчитана на справочные карточки и связи с процедурами, без склада, цен и закупок.",
    schemaType: "Product",
  },
  guidelines: {
    kind: "guidelines",
    title: "Клинические рекомендации",
    singular: "Клиническая рекомендация",
    path: "/guidelines",
    eyebrow: "Нормативный раздел",
    description:
      "Индекс клинических рекомендаций, связанных с заболеваниями, процедурами и профессиональными разделами.",
    emptyTitle: "Рекомендации пока не опубликованы",
    emptyDescription:
      "Раздел готов к индексируемым документам и связям с медицинскими сущностями.",
    schemaType: "MedicalGuideline",
  },
  regulations: {
    kind: "regulations",
    title: "Законодательство и регулирование",
    singular: "Нормативный документ",
    path: "/regulations",
    eyebrow: "Нормативный раздел",
    description:
      "Нормативная база, стандарты, лицензирование и требования для медицинских организаций.",
    emptyTitle: "Нормативные материалы пока не опубликованы",
    emptyDescription:
      "Раздел подготовлен для документов, статусов, дат вступления в силу и профессиональных ссылок.",
    schemaType: "Legislation",
  },
  history: {
    kind: "history",
    title: "История офтальмологии",
    singular: "Историческая запись",
    path: "/history",
    eyebrow: "История офтальмологии",
    description:
      "Исторические личности, научные школы, технологии, публикации и вклад врачей в развитие отрасли.",
    emptyTitle: "Исторические записи пока не опубликованы",
    emptyDescription:
      "Каркас готов для хронологии, персоналий и связей с публикациями и профессиональными профилями.",
    schemaType: "Article",
  },
  innovations: {
    kind: "innovations",
    title: "Инновации",
    singular: "Инновация",
    path: "/innovations",
    eyebrow: "Инновации в офтальмологии",
    description:
      "Современные технологии, медицинские изделия, методы диагностики и лечения, которые расширяют возможности современной офтальмологии.",
    emptyTitle: "Инновации пока не опубликованы",
    emptyDescription:
      "Раздел подготовлен для профессионального описания технологий, медицинских изделий, методов диагностики и лечения.",
    schemaType: "TechArticle",
  },
  publications: {
    kind: "publications",
    title: "Научные публикации",
    singular: "Публикация",
    path: "/publications",
    eyebrow: "Научные публикации",
    description:
      "Научные статьи, диссертации, аннотации, авторы и связи с заболеваниями и процедурами.",
    emptyTitle: "Публикации пока не опубликованы",
    emptyDescription:
      "Структура готова для научного слоя: авторов, дат, аннотаций, полного текста и связей.",
    schemaType: "ScholarlyArticle",
  },
};

/** Якорь блока «Клиники-участники» на главной: им пользуются hero и шапка. */
export const homeMembersAnchorId = "members";

export type HeaderNavItem =
  | { kind: "link"; href: string; label: string }
  | { kind: "reference"; label: string };

/**
 * Единственное меню сайта (ТЗ главной v1.2, §7.1): пять пунктов в этом порядке.
 * «Справочник» раскрывает `referenceSections`; новые пункты не добавляются.
 */
export const headerNavItems: readonly HeaderNavItem[] = [
  { kind: "link", href: "/about", label: "Об Ассоциации" },
  { kind: "link", href: "/cooperation", label: "Членство" },
  { kind: "link", href: `/#${homeMembersAnchorId}`, label: "Клиники-участники" },
  { kind: "reference", label: "Справочник" },
  { kind: "link", href: "/news", label: "Новости" },
];

export const headerJoinLink = { href: "/cooperation", label: "Вступить" } as const;

/**
 * Состав «Справочника» (§7.2) — бывшее боковое меню: 4 группы и 17 ссылок.
 * Названия, порядок и адреса ссылок не меняются; «Расследования» остаются
 * последней ссылкой группы «Клиникам» (§8).
 */
export const referenceSections = [
  {
    title: "Пациентам",
    links: [
      { href: "/diseases", label: "Заболевания" },
      { href: "/procedures", label: "Лечение и коррекция" },
      { href: "/innovations", label: "Инновации" },
      { href: "/appeal", label: "Подать обращение" },
    ],
  },
  {
    title: "Врачам",
    links: [
      { href: "/doctors", label: "Врачи и специалисты" },
      { href: "/guidelines", label: "Клинические рекомендации" },
      { href: "/publications", label: "Научные работы" },
      { href: "/cooperation/doctor", label: "Регистрация врача" },
      { href: "/history", label: "История офтальмологии" },
    ],
  },
  {
    title: "Клиникам",
    links: [
      { href: "/clinics", label: "Каталог клиник" },
      { href: "/clinics/oms", label: "Клиники по ОМС" },
      { href: "/clinics/contract", label: "Договорные клиники" },
      { href: "/regulations", label: "Законодательство" },
      { href: "/independent-control", label: "Независимая оценка" },
      { href: "/investigations", label: "Расследования" },
    ],
  },
  {
    title: "Поставщикам",
    links: [
      { href: "/suppliers", label: "Каталог поставщиков" },
      { href: "/equipment", label: "Оборудование" },
    ],
  },
] as const;

/** Активен ли пункт навигации на текущем пути (якорные ссылки не подсвечиваются). */
export function isNavHrefActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Заголовки карточек «Справочные разделы» совпадают с группами «Справочника».
export const audienceHubs = [
  {
    title: referenceSections[0].title,
    href: "/diseases",
    description: "Заболевания, симптомы, диагностика, лечение, рекомендации и инновации.",
  },
  {
    title: referenceSections[1].title,
    href: "/doctors",
    description: "Профили врачей, научные публикации и история офтальмологии.",
  },
  {
    title: referenceSections[2].title,
    href: "/clinics",
    description: "Нормативная база, каталог клиник и информация по ОМС.",
  },
  {
    title: referenceSections[3].title,
    href: "/suppliers",
    description: "Поставщики и оборудование — отраслевой справочник.",
  },
];

export function getCatalogConfig(kind: EntityKind) {
  return catalogConfigs[kind];
}
