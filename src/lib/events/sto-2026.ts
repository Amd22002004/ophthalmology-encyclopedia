export const STO_2026_EVENT_SLUG = "sovremennye-tehnologii-v-oftalmologii-2026";
export const STO_2026_EVENT_PATH = `/events/${STO_2026_EVENT_SLUG}`;
export const STO_2026_REGISTER_PATH = `${STO_2026_EVENT_PATH}/register`;
export const STO_2026_QR_PATH = "/e/sto-2026";
export const STO_2026_PUBLIC_ORIGIN = "https://oftalmologia.pro";
export const STO_2026_HERO_DESCRIPTION =
  "Практический опыт, современные хирургические технологии и клинические решения — в профессиональном диалоге офтальмологов.";

export const STO_2026_EVENT = {
  slug: STO_2026_EVENT_SLUG,
  title: "Современные технологии в офтальмологии",
  shortTitle: "Современные технологии в офтальмологии",
  description:
    "Конференция объединит врачей-офтальмологов и офтальмохирургов для обсуждения современных технологий диагностики и хирургического лечения заболеваний органа зрения.",
  programDescription:
    "В программе — рефракционная хирургия, лечение кератоконуса, лазерные технологии, хирургия катаракты, глаукомы, сетчатки и стекловидного тела, а также разбор клинических случаев.",
  audienceDescription:
    "Участники смогут познакомиться с практическим опытом коллег, обсудить современные подходы и установить новые профессиональные контакты.",
  dateLabel: "15 октября 2026 года",
  registrationStartsAt: "2026-10-15T14:00:00+05:00",
  startsAt: "2026-10-15T15:00:00+05:00",
  registrationLabel: "Регистрация гостей и кофе-брейк — с 14:00",
  startLabel: "Начало конференции — 15:00",
  timezone: "Asia/Yekaterinburg",
  venueName: "DoubleTree by Hilton Tyumen",
  venueAddress: "г. Тюмень, ул. Орджоникидзе, 46",
  venueHall: "Сильвер Холл",
  venueFloor: "2 этаж",
  city: "Тюмень",
  isFree: true,
  registrationOpen: false,
  programPublished: true,
  speakersPublished: true,
  organizerName: "Ассоциация офтальмологических клиник",
  organizerEmail: "aok@oftalmologia.pro",
  mapUrl: "https://yandex.ru/maps/?text=DoubleTree%20by%20Hilton%20Tyumen%2C%20%D0%A2%D1%8E%D0%BC%D0%B5%D0%BD%D1%8C%2C%20%D1%83%D0%BB.%20%D0%9E%D1%80%D0%B4%D0%B6%D0%BE%D0%BD%D0%B8%D0%BA%D0%B8%D0%B4%D0%B7%D0%B5%2C%2046",
} as const;

export type STO2026ProgramKind =
  | "registration"
  | "opening"
  | "section"
  | "talk"
  | "discussion"
  | "closing"
  | "reception";

export type STO2026ProgramItem = {
  order: number;
  kind: STO2026ProgramKind;
  title: string;
  detail?: string;
  speakerOrder: number | null;
  startTime: string;
  endTime: string | null;
  published: true;
};

const TAKHTAEV_OPENING_CREDENTIALS =
  "д.м.н., профессор, врач-офтальмолог высшей категории, член правления Российского офтальмологического общества, член Европейского общества катарактальной и рефракционной хирургии, Американского общества катарактальных и рефракционных хирургов, Американской Академии Офтальмологии";

function programItem(
  order: number,
  kind: STO2026ProgramKind,
  title: string,
  startTime: string,
  endTime: string | null,
  speakerOrder: number | null = null,
  detail?: string,
): STO2026ProgramItem {
  return {
    order,
    kind,
    title,
    ...(detail ? { detail } : {}),
    speakerOrder,
    startTime,
    endTime,
    published: true,
  };
}

/**
 * Утверждённая программа из официального docx. Время — местное, Asia/Yekaterinburg.
 * У секций и фуршета в документе нет времени окончания, поэтому endTime остаётся null.
 */
export const STO_2026_PROGRAM: readonly STO2026ProgramItem[] = [
  programItem(1, "registration", "Регистрация участников, кофе-брейк", "14:00", "15:00"),
  programItem(
    2,
    "opening",
    "Официальное открытие конференции",
    "15:00",
    "15:15",
    null,
    `Приветственные слова Президента Ассоциации офтальмологических клиник Черных Аллы Сергеевны и Тахтаева Юрия Викторовича — ${TAKHTAEV_OPENING_CREDENTIALS}.`,
  ),
  programItem(3, "section", "Секция 1.", "15:15", null),
  programItem(
    4,
    "talk",
    "Клинический случай YAG лазерной гиалоидопунктуры с консервативным лечением ретинопатии Вальсальвы",
    "15:15",
    "15:30",
    1,
  ),
  programItem(
    5,
    "talk",
    "Лазерное лечение сетчатки в навигационном режиме (система Navilas)",
    "15:30",
    "15:45",
    2,
  ),
  programItem(
    6,
    "talk",
    "Лечение кератоконуса, преимущества имплантации роговичных сегментов",
    "15:45",
    "16:00",
    3,
  ),
  programItem(7, "talk", "Кератотопография Pentacam в диагностике кератоконуса", "16:00", "16:15", 4),
  programItem(8, "discussion", "Обсуждение, ответы на вопросы", "16:15", "16:30"),
  programItem(9, "section", "Секция 2.", "16:30", null),
  programItem(
    10,
    "talk",
    "Преимущества метода Smile Pro, первый год использования VisuMax800 компании ZEISS",
    "16:30",
    "16:45",
    3,
  ),
  programItem(
    11,
    "talk",
    "Лазерная коррекция зрения после кросслинкинга роговичного коллагена при кератоконусе",
    "16:45",
    "17:00",
    4,
  ),
  programItem(
    12,
    "talk",
    "Результаты комплексного лечения содружественного косоглазия у взрослых в амбулаторных условиях",
    "17:00",
    "17:10",
    1,
  ),
  programItem(13, "talk", "Фемто лазерная коррекция зрения", "17:10", "17:25", 5),
  programItem(14, "discussion", "Обсуждение, ответы на вопросы", "17:25", "17:40"),
  programItem(15, "section", "Секция 3.", "17:40", null),
  programItem(
    16,
    "talk",
    "Важность диагностики синдрома сухого глаза на приеме офтальмолога",
    "17:40",
    "17:55",
    6,
  ),
  programItem(
    17,
    "talk",
    "Лазерная экстракция катаракты. Преимущество системы «Ракот»",
    "17:55",
    "18:05",
    7,
  ),
  programItem(
    18,
    "talk",
    "Клинический случай имплантации клапана Ahmed при оперированной рефрактерной глаукоме",
    "18:05",
    "18:20",
    1,
  ),
  programItem(19, "talk", "Кросслинкинг в лечении кератоконуса у детей", "18:20", "18:35", 4),
  programItem(20, "discussion", "Обсуждение, ответы на вопросы", "18:35", "18:45"),
  programItem(
    21,
    "closing",
    "Подведение итогов, подарки от партнеров, завершение конференции",
    "18:45",
    "19:00",
  ),
  programItem(22, "reception", "Легкий фуршет, неформальное общение", "19:00", null),
];

export type STO2026Speaker = {
  order: number;
  doctorSlug: string | null;
  fullName: string;
  credentials: string;
  organizationRole?: string;
  photoUrl: string | null;
  topics: readonly string[];
};

const STO_2026_SPEAKER_SOURCES = [
  {
    order: 1,
    doctorSlug: "ostroverhov-aleksandr-ivanovich",
    fullName: "Островерхов Александр Иванович",
    credentials: "к.м.н., врач-офтальмолог, офтальмохирург",
    photoUrl: "/doctors/ostroverkhov.png",
  },
  {
    order: 2,
    doctorSlug: "chichenkova-anna-vasilevna",
    fullName: "Чиченкова Анна Васильевна",
    credentials: "врач-офтальмолог, офтальмохирург",
    photoUrl: "/doctors/chichenkova.png",
  },
  {
    order: 3,
    doctorSlug: "kunitskiy-konstantin-vladislavovich",
    fullName: "Куницкий Константин Владиславович",
    credentials: "врач-офтальмолог, офтальмохирург",
    photoUrl: "/doctors/kunitskiy.png",
  },
  {
    order: 4,
    doctorSlug: "churakov-timur-kasimovich",
    fullName: "Чураков Тимур Касимович",
    credentials: "к.м.н., врач-офтальмолог, офтальмохирург, рефракционный хирург, г. Санкт-Петербург",
    photoUrl: "/doctors/churakov-timur-kasimovich.webp",
  },
  {
    order: 5,
    doctorSlug: null,
    fullName: "Дубровина Анна Валерьевна",
    credentials: "врач-офтальмолог, офтальмохирург, лазерный хирург",
    photoUrl: null,
  },
  {
    order: 6,
    doctorSlug: null,
    fullName: "Степанова Ольга Павловна",
    credentials: "специалист по клинической поддержке компании Alcon",
    photoUrl: null,
  },
  {
    order: 7,
    doctorSlug: "hubonov-murid-hubonovich",
    fullName: "Хубонов Мурид Хубонович",
    credentials: "врач-офтальмолог, офтальмохирург",
    photoUrl: "/doctors/khubonov.jpg",
  },
] as const;

export const STO_2026_SPEAKERS: readonly STO2026Speaker[] = STO_2026_SPEAKER_SOURCES.map((speaker) => ({
  ...speaker,
  topics: STO_2026_PROGRAM.filter((item) => item.kind === "talk" && item.speakerOrder === speaker.order).map(
    (item) => item.title,
  ),
}));

/** Местное время пункта программы как момент 15 октября 2026 года, Asia/Yekaterinburg. */
export function sto2026ClockInstant(clock: string) {
  return new Date(`2026-10-15T${clock}:00+05:00`);
}

export function formatSto2026Interval(item: Pick<STO2026ProgramItem, "startTime" | "endTime">) {
  return item.endTime ? `${item.startTime}–${item.endTime}` : item.startTime;
}

export const STO_2026_AUDIENCE = [
  "Врачи-офтальмологи",
  "Офтальмохирурги",
  "Лазерные хирурги",
  "Рефракционные хирурги",
  "Специалисты по хирургии катаракты и сетчатки",
  "Руководители офтальмологических клиник",
  "Ординаторы и молодые специалисты",
  "Представители профессионального офтальмологического сообщества",
] as const;

export type EventAnalyticsEvent =
  | "event_page_view"
  | "event_program_opened"
  | "event_speaker_opened"
  | "event_registration_started"
  | "event_registration_error"
  | "event_registration_completed";

type EventAnalyticsInput = {
  eventSlug?: string | null;
  speakerOrder?: number | null;
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  [key: string]: unknown;
};

export function eventAnalyticsPayload(event: EventAnalyticsEvent, input: EventAnalyticsInput = {}) {
  return {
    event,
    ...(input.eventSlug ? { eventSlug: input.eventSlug } : {}),
    ...(typeof input.speakerOrder === "number" ? { speakerOrder: input.speakerOrder } : {}),
    ...(input.source ? { source: input.source } : {}),
    ...(input.utmSource ? { utmSource: input.utmSource } : {}),
    ...(input.utmMedium ? { utmMedium: input.utmMedium } : {}),
    ...(input.utmCampaign ? { utmCampaign: input.utmCampaign } : {}),
    ...(input.utmContent ? { utmContent: input.utmContent } : {}),
    ...(input.utmTerm ? { utmTerm: input.utmTerm } : {}),
  };
}
