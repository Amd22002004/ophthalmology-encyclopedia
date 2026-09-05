import {
  CLINIC_INTEREST_OPTIONS,
  COOPERATION_PARTICIPANT_TYPES,
  DOCTOR_INTEREST_OPTIONS,
  DOCTOR_SPECIALTY_OPTIONS,
  PARTNER_TYPE_OPTIONS,
  type CooperationParticipantType,
} from "./constants";

export type CooperationApplicationInput = {
  participantType: CooperationParticipantType | string;
  organizationName?: string;
  inn?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  contactName?: string;
  contactPosition?: string;
  phone?: string;
  email?: string;
  city?: string;
  region?: string;
  website?: string;
  workplace?: string;
  customWorkplace?: string;
  specialties?: string[];
  academicDegree?: string;
  professionalUrl?: string;
  partnerType?: string;
  interests?: string[];
  message?: string;
  consentPersonalData?: boolean;
  consentMarketing?: boolean;
  startedAt?: string | number;
  websiteHoney?: string;
  source?: string;
  landingUrl?: string;
  pageTitle?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
};

export type ValidatedCooperationApplication = {
  participantType: CooperationParticipantType;
  organizationName: string | null;
  inn: string | null;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  contactName: string | null;
  contactPosition: string | null;
  phone: string;
  email: string;
  city: string | null;
  region: string | null;
  website: string | null;
  workplace: string | null;
  customWorkplace: string | null;
  specialties: string[];
  academicDegree: string | null;
  professionalUrl: string | null;
  partnerType: string | null;
  interests: string[];
  message: string | null;
  consentPersonalData: true;
  consentMarketing: boolean;
  source: string | null;
  landingUrl: string | null;
  pageTitle: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
};

export type CooperationValidationResult =
  | { success: true; data: ValidatedCooperationApplication }
  | { success: false; fieldErrors: Record<string, string>; isSpam?: boolean };

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/\r\n/g, "\n").slice(0, maxLength) : "";
}

function optional(value: unknown, maxLength: number) {
  return text(value, maxLength) || null;
}

function stringList(value: unknown) {
  return Array.from(new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : []));
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return `+${digits}`;
}

function normalizeEmail(value: string) {
  return value.toLowerCase();
}

function normalizeUrl(value: string) {
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function allowed(values: string[], options: readonly { value: string }[]) {
  const allowedValues = new Set(options.map((option) => option.value));
  return values.length > 0 && values.every((value) => allowedValues.has(value));
}

export function validateCooperationApplicationInput(input: CooperationApplicationInput): CooperationValidationResult {
  if (text(input.websiteHoney, 200)) return { success: false, fieldErrors: {}, isSpam: true };

  const startedAt = typeof input.startedAt === "number" ? input.startedAt : Number(input.startedAt);
  if (Number.isFinite(startedAt) && Date.now() - startedAt < 1_500) {
    return { success: false, fieldErrors: {}, isSpam: true };
  }

  const participantType = text(input.participantType, 20) as CooperationParticipantType;
  const organizationName = optional(input.organizationName, 240);
  const innRaw = text(input.inn, 20);
  const inn = innRaw || null;
  const firstName = optional(input.firstName, 120);
  const lastName = optional(input.lastName, 120);
  const middleName = optional(input.middleName, 120);
  const contactName = optional(input.contactName, 180);
  const contactPosition = optional(input.contactPosition, 180);
  const phone = normalizePhone(text(input.phone, 80));
  const email = normalizeEmail(text(input.email, 254));
  const city = optional(input.city, 160);
  const region = optional(input.region, 160);
  const websiteRaw = text(input.website, 500);
  const website = normalizeUrl(websiteRaw);
  const workplace = optional(input.workplace, 240);
  const customWorkplace = optional(input.customWorkplace, 240);
  const specialties = stringList(input.specialties);
  const academicDegree = optional(input.academicDegree, 80);
  const professionalUrlRaw = text(input.professionalUrl, 500);
  const professionalUrl = normalizeUrl(professionalUrlRaw);
  const partnerType = optional(input.partnerType, 80);
  const interests = stringList(input.interests);
  const message = optional(input.message, 10_000);
  const fieldErrors: Record<string, string> = {};

  if (!COOPERATION_PARTICIPANT_TYPES.includes(participantType)) fieldErrors.participantType = "Выберите формат участия";
  if (participantType === "CLINIC" && !organizationName) fieldErrors.organizationName = "Укажите название организации";
  if ((participantType === "CLINIC" || participantType === "PARTNER") && inn && !/^\d{10}(\d{2})?$/.test(inn)) {
    fieldErrors.inn = "ИНН должен содержать 10 или 12 цифр";
  }
  if ((participantType === "CLINIC" || participantType === "PARTNER") && !city) fieldErrors.city = "Укажите город";
  if (participantType === "DOCTOR" && !lastName) fieldErrors.lastName = "Укажите фамилию";
  if (participantType === "DOCTOR" && !firstName) fieldErrors.firstName = "Укажите имя";
  if ((participantType === "CLINIC" || participantType === "DOCTOR") && !city) fieldErrors.city = "Укажите город";
  if ((participantType === "CLINIC" || participantType === "PARTNER") && !contactName) fieldErrors.contactName = "Укажите контактное лицо";
  if ((participantType === "CLINIC" || participantType === "PARTNER") && !contactPosition) fieldErrors.contactPosition = "Укажите должность";
  if (!/^\d{10,15}$/.test(phone.replace(/^\+/, ""))) fieldErrors.phone = "Проверьте номер телефона";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Проверьте email";
  if (websiteRaw && !website) fieldErrors.website = "Укажите корректный адрес сайта";
  if (professionalUrlRaw && !professionalUrl) fieldErrors.professionalUrl = "Укажите корректную профессиональную ссылку";
  if (participantType === "DOCTOR" && !allowed(specialties, DOCTOR_SPECIALTY_OPTIONS)) fieldErrors.specialties = "Выберите специализацию";
  if (participantType === "DOCTOR" && !workplace && !customWorkplace) fieldErrors.workplace = "Укажите место работы или заполните поле «Моей клиники нет в списке»";
  if (participantType === "DOCTOR" && !allowed(interests, DOCTOR_INTEREST_OPTIONS)) fieldErrors.interests = "Выберите цель участия";
  if (participantType === "CLINIC" && !allowed(interests, CLINIC_INTEREST_OPTIONS)) fieldErrors.interests = "Выберите цель обращения";
  if (participantType === "PARTNER" && !allowed([partnerType ?? ""], PARTNER_TYPE_OPTIONS)) fieldErrors.partnerType = "Выберите тип партнёра";
  if (participantType === "PARTNER" && !message) fieldErrors.message = "Опишите предполагаемый формат сотрудничества";
  if (input.consentPersonalData !== true) fieldErrors.consentPersonalData = "Подтвердите согласие на обработку данных";

  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };

  return {
    success: true,
    data: {
      participantType,
      organizationName,
      inn,
      firstName,
      lastName,
      middleName,
      contactName,
      contactPosition,
      phone,
      email,
      city,
      region,
      website,
      workplace,
      customWorkplace,
      specialties,
      academicDegree,
      professionalUrl,
      partnerType,
      interests,
      message,
      consentPersonalData: true,
      consentMarketing: input.consentMarketing === true,
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
