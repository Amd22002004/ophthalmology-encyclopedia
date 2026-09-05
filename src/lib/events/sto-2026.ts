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
  registrationOpen: true,
  programPublished: true,
  speakersPublished: true,
  organizerName: "Ассоциация офтальмологических клиник",
  organizerEmail: "aok@oftalmologia.pro",
  mapUrl: "https://yandex.ru/maps/?text=DoubleTree%20by%20Hilton%20Tyumen%2C%20%D0%A2%D1%8E%D0%BC%D0%B5%D0%BD%D1%8C%2C%20%D1%83%D0%BB.%20%D0%9E%D1%80%D0%B4%D0%B6%D0%BE%D0%BD%D0%B8%D0%BA%D0%B8%D0%B4%D0%B7%D0%B5%2C%2046",
} as const;

const STO_2026_PUBLIC_TOPIC_OVERRIDES: Readonly<Record<string, string>> = {
  "Макулярный разрыв. Катаракта":
    "Возможности коррекции зрения с помощью современных интраокулярных линз компании Alcon",
};

/**
 * The public programme follows the approved DOCX editorial source. This small
 * override deliberately affects presentation only; it does not mutate EventTalk.
 */
export function getSTO2026PublicTopicTitle(title: string) {
  return STO_2026_PUBLIC_TOPIC_OVERRIDES[title] ?? title;
}

export type STO2026Speaker = {
  order: number;
  doctorSlug: string;
  fullName: string;
  credentials: string;
  organizationRole?: string;
  photoUrl: string;
  topics: readonly string[];
};

export const STO_2026_SPEAKERS: readonly STO2026Speaker[] = [
  {
    order: 1,
    doctorSlug: "kunitskiy-konstantin-vladislavovich",
    fullName: "Куницкий Константин Владиславович",
    credentials: "Заведующий рефракционным отделением, врач-офтальмолог, офтальмохирург",
    photoUrl: "/doctors/kunitskiy.png",
    topics: [
      "Лечение кератоконуса: преимущества имплантации роговичных сегментов",
      "Лазерное лечение сетчатки в навигационном режиме — система NAVILAS",
      "Преимущества метода SMILE Pro: первый год использования ZEISS VisuMax 800",
    ],
  },
  {
    order: 2,
    doctorSlug: "churakov-timur-kasimovich",
    fullName: "Чураков Тимур Касимович",
    credentials: "Кандидат медицинских наук, врач-офтальмолог, офтальмохирург, рефракционный хирург",
    photoUrl: "/doctors/churakov-timur-kasimovich.webp",
    topics: [
      "Лазерная коррекция зрения после кросслинкинга роговичного коллагена при кератоконусе",
      "Кератотопография Pentacam в диагностике кератоконуса",
      "Кросслинкинг в лечении кератоконуса у детей",
    ],
  },
  {
    order: 3,
    doctorSlug: "ostroverhov-aleksandr-ivanovich",
    fullName: "Островерхов Александр Иванович",
    credentials: "Кандидат медицинских наук, врач-офтальмолог, офтальмохирург",
    organizationRole: "Главный специалист Ассоциации офтальмологических клиник",
    photoUrl: "/doctors/ostroverkhov.png",
    topics: [
      "Клинический случай YAG-лазерной гиалоидопунктуры с консервативным лечением ретинопатии Вальсальвы",
      "Результаты комплексного лечения содружественного косоглазия у взрослых в амбулаторных условиях",
      "Клинический случай имплантации клапана Ahmed при оперированной рефрактерной глаукоме",
    ],
  },
  {
    order: 4,
    doctorSlug: "evdokimov-georgiy-vyacheslavovich",
    fullName: "Евдокимов Георгий Вячеславович",
    credentials: "Заведующий микрохирургическим отделением, врач-офтальмолог, офтальмохирург",
    photoUrl: "/doctors/evdokimov.png",
    topics: [
      "Возможности коррекции зрения с помощью современных интраокулярных линз компании Alcon",
    ],
  },
  {
    order: 5,
    doctorSlug: "chichenkova-anna-vasilevna",
    fullName: "Чиченкова Анна Васильевна",
    credentials: "Врач-офтальмолог первой категории, офтальмохирург, лазерный хирург",
    photoUrl: "/doctors/chichenkova.png",
    topics: ["Деструкция стекловидного тела. Витреолизис"],
  },
  {
    order: 6,
    doctorSlug: "hubonov-murid-hubonovich",
    fullName: "Хубонов Мурид Хубонович",
    credentials: "Врач-офтальмолог, офтальмохирург",
    photoUrl: "/doctors/khubonov.jpg",
    topics: ["Лазерная экстракция катаракты. Преимущества системы «Ракот»"],
  },
] as const;

export type STO2026ProgramItem = {
  order: number;
  speakerOrder: number;
  title: string;
  startTime: string | null;
  endTime: string | null;
  published: true;
};

export const STO_2026_PROGRAM: readonly STO2026ProgramItem[] = STO_2026_SPEAKERS.flatMap(
  (speaker) =>
    speaker.topics.map((title, topicIndex) => ({
      order: STO_2026_SPEAKERS.slice(0, speaker.order - 1).reduce((sum, item) => sum + item.topics.length, 0) + topicIndex + 1,
      speakerOrder: speaker.order,
      title,
      startTime: null,
      endTime: null,
      published: true as const,
    })),
);

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
