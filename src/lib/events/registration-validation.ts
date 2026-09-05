export const EVENT_SPECIALTY_OPTIONS = [
  { value: "ophthalmologist", label: "Врач-офтальмолог" },
  { value: "ophthalmosurgeon", label: "Офтальмохирург" },
  { value: "laser-surgeon", label: "Лазерный хирург" },
  { value: "clinic-leader", label: "Руководитель офтальмологической клиники" },
  { value: "resident", label: "Ординатор или молодой специалист" },
  { value: "other", label: "Другая специализация" },
] as const;

export type EventRegistrationInput = {
  fullName?: unknown;
  phone?: unknown;
  email?: unknown;
  city?: unknown;
  specialty?: unknown;
  customSpecialty?: unknown;
  organization?: unknown;
  position?: unknown;
  comment?: unknown;
  consentPersonalData?: unknown;
  startedAt?: unknown;
  websiteHoney?: unknown;
  source?: unknown;
  landingUrl?: unknown;
  pageTitle?: unknown;
  referrer?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmContent?: unknown;
};

export type ValidatedEventRegistration = {
  fullName: string;
  phone: string;
  email: string;
  city: string | null;
  specialty: string;
  customSpecialty: string | null;
  organization: string;
  position: string | null;
  comment: string | null;
  consentPersonalData: true;
  source: string | null;
  landingUrl: string | null;
  pageTitle: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
};

export type EventRegistrationValidationResult =
  | { success: true; data: ValidatedEventRegistration }
  | { success: false; fieldErrors: Record<string, string>; isSpam?: boolean };

function text(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength)
    : "";
}

function optional(value: unknown, maxLength: number) {
  return text(value, maxLength) || null;
}

export function normalizeEventPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("9")) return `+7${digits}`;
  return `+${digits}`;
}

export function normalizeEventEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateEventRegistrationInput(input: EventRegistrationInput): EventRegistrationValidationResult {
  if (text(input.websiteHoney, 200)) return { success: false, fieldErrors: {}, isSpam: true };

  const startedAt = typeof input.startedAt === "number" ? input.startedAt : Number(input.startedAt);
  if (Number.isFinite(startedAt) && Date.now() - startedAt < 1_500) {
    return { success: false, fieldErrors: {}, isSpam: true };
  }

  const fullName = text(input.fullName, 180);
  const phone = normalizeEventPhone(text(input.phone, 80));
  const email = normalizeEventEmail(text(input.email, 254));
  const city = optional(input.city, 160);
  const specialty = text(input.specialty, 60);
  const customSpecialty = optional(input.customSpecialty, 160);
  const organization = text(input.organization, 240);
  const position = optional(input.position, 180);
  const comment = optional(input.comment, 4_000);
  const fieldErrors: Record<string, string> = {};
  const specialtyValues: Set<string> = new Set(EVENT_SPECIALTY_OPTIONS.map((option) => option.value));

  if (fullName.length < 3) fieldErrors.fullName = "Укажите имя и фамилию";
  if (!/^\+\d{10,15}$/.test(phone)) fieldErrors.phone = "Проверьте номер телефона";
  if (!isValidEmail(email)) fieldErrors.email = "Проверьте email";
  if (!specialtyValues.has(specialty)) fieldErrors.specialty = "Выберите специализацию";
  if (specialty === "other" && !customSpecialty) fieldErrors.customSpecialty = "Укажите специализацию";
  if (!organization) fieldErrors.organization = "Укажите название организации";
  if (input.consentPersonalData !== true) fieldErrors.consentPersonalData = "Подтвердите согласие на обработку данных";

  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };

  return {
    success: true,
    data: {
      fullName,
      phone,
      email,
      city,
      specialty,
      customSpecialty,
      organization,
      position,
      comment,
      consentPersonalData: true,
      source: optional(input.source, 100),
      landingUrl: optional(input.landingUrl, 2_000),
      pageTitle: optional(input.pageTitle, 300),
      referrer: optional(input.referrer, 2_000),
      utmSource: optional(input.utmSource, 200),
      utmMedium: optional(input.utmMedium, 200),
      utmCampaign: optional(input.utmCampaign, 200),
      utmContent: optional(input.utmContent, 200),
    },
  };
}
