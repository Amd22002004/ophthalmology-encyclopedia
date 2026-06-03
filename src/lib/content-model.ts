import {
  Activity,
  BookOpen,
  Building2,
  ClipboardList,
  FileCheck,
  FileText,
  FlaskConical,
  Handshake,
  History,
  Microscope,
  ShieldCheck,
  Stethoscope,
  Store,
  Syringe,
  UserPlus,
  Users,
} from "lucide-react";

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
      "Современные технологии, новые методы диагностики, лечения, хирургии и коррекции зрения.",
    emptyTitle: "Инновации пока не опубликованы",
    emptyDescription:
      "Раздел подготовлен для описания технологий и связей с процедурами, оборудованием и публикациями.",
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

export const topNavItems = [
  { href: "/about", label: "О нас" },
  { href: "/doctors", label: "Врачи" },
  { href: "/cooperation", label: "Сотрудничество" },
  { href: "/register/clinic", label: "Регистрация клиники" },
  { href: "/news", label: "Новости" },
  { href: "/questions", label: "Вопросы" },
  { href: "/contact", label: "Оставить сообщение" },
];

export const sidebarSections = [
  {
    title: "Для пациентов",
    icon: Stethoscope,
    links: [
      { href: "/diseases", label: "Заболевания", icon: Activity },
      { href: "/procedures", label: "Лечение и коррекция", icon: Syringe },
      { href: "/innovations", label: "Инновации", icon: FlaskConical },
    ],
  },
  {
    title: "Для врачей",
    icon: Users,
    links: [
      { href: "/doctors", label: "Врачи и специалисты", icon: Stethoscope },
      { href: "/guidelines", label: "Клинические рекомендации", icon: ClipboardList },
      { href: "/publications", label: "Научные работы", icon: BookOpen },
      { href: "/cooperation", label: "Сотрудничество с врачами", icon: Handshake },
      { href: "/register/doctor", label: "Регистрация врача", icon: UserPlus },
      { href: "/history", label: "История офтальмологии", icon: History },
    ],
  },
  {
    title: "Для клиник",
    icon: Building2,
    links: [
      { href: "/clinics", label: "Каталог клиник", icon: Building2 },
      { href: "/clinics/oms", label: "Клиники по ОМС", icon: ShieldCheck },
      { href: "/clinics/contract", label: "Договорные клиники", icon: FileCheck },
      { href: "/regulations", label: "Законодательство", icon: FileText },
    ],
  },
  {
    title: "Для поставщиков",
    icon: Store,
    links: [
      { href: "/suppliers", label: "Каталог поставщиков", icon: Store },
      { href: "/equipment", label: "Оборудование", icon: Microscope },
      { href: "/register/supplier", label: "Регистрация поставщика", icon: UserPlus },
    ],
  },
];

export const audienceHubs = [
  {
    title: "Пациентам",
    href: "/diseases",
    description: "Заболевания, симптомы, диагностика, лечение, рекомендации и инновации.",
  },
  {
    title: "Врачам",
    href: "/doctors",
    description: "Профили врачей, научные публикации и история офтальмологии.",
  },
  {
    title: "Клиникам",
    href: "/clinics",
    description: "Нормативная база, каталог клиник и информация по ОМС.",
  },
  {
    title: "Поставщикам",
    href: "/suppliers",
    description: "Поставщики и оборудование — отраслевой справочник.",
  },
];

export function getCatalogConfig(kind: EntityKind) {
  return catalogConfigs[kind];
}
