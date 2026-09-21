import {
  APPEAL_CATEGORY_VALUES,
  REPORTER_ROLE_VALUES,
  REQUESTED_ACTION_VALUES,
} from "./constants";

export type ValidatedAppealInput = {
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  investigationSlug: string | null;
  reporterRoles: string[];
  categories: string[];
  requestedActions: string[];
  description: string;
  operationDate: Date | null;
  reportedClinicName: string | null;
  reportedDoctorName: string | null;
  reportedEquipmentName: string | null;
  collectiveInterest: boolean;
  consentTemplateId: string;
};

type AppealInput = Partial<Record<
  | "name"
  | "phone"
  | "email"
  | "city"
  | "investigationSlug"
  | "reporterRoles"
  | "categories"
  | "requestedActions"
  | "description"
  | "operationDate"
  | "reportedClinicName"
  | "reportedDoctorName"
  | "reportedEquipmentName"
  | "collectiveInterest"
  | "consentAccepted"
  | "consentTemplateId"
  | "website",
  string | string[] | boolean | null
>>;

export type AppealValidationResult =
  | { success: true; data: ValidatedAppealInput }
  | { success: false; fieldErrors: Record<string, string>; isSpam?: boolean };

function text(value: unknown, maxLength: number) {
  const normalized = typeof value === "string" ? value.trim().replace(/\r\n/g, "\n") : "";
  return normalized.slice(0, maxLength) || null;
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string")));
}

function containsOnly(values: string[], allowed: readonly string[]) {
  return values.length > 0 && values.every((value) => allowed.includes(value));
}

function operationDate(value: unknown) {
  const raw = text(value, 10);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function validateAppealInput(input: AppealInput): AppealValidationResult {
  if (text(input.website, 200)) {
    return { success: false, fieldErrors: {}, isSpam: true };
  }

  const fieldErrors: Record<string, string> = {};
  const name = text(input.name, 160);
  const phone = text(input.phone, 80);
  const email = text(input.email, 254)?.toLowerCase() ?? null;
  const city = text(input.city, 160);
  const investigationSlug = text(input.investigationSlug, 180);
  const reporterRoles = stringList(input.reporterRoles);
  const categories = stringList(input.categories);
  const requestedActions = stringList(input.requestedActions);
  const description = text(input.description, 20_000);
  const consentTemplateId = text(input.consentTemplateId, 80);

  if (!name || name.length < 2) fieldErrors.name = "Укажите имя";
  if (!phone && !email) fieldErrors.contact = "Укажите телефон или email";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Проверьте email";
  if (phone && phone.replace(/\D/g, "").length < 7) fieldErrors.phone = "Проверьте телефон";
  if (!containsOnly(reporterRoles, REPORTER_ROLE_VALUES)) {
    fieldErrors.reporterRoles = "Укажите вашу связь с ситуацией";
  }
  if (!containsOnly(categories, APPEAL_CATEGORY_VALUES)) {
    fieldErrors.categories = "Выберите допустимые категории обращения";
  }
  if (!containsOnly(requestedActions, REQUESTED_ACTION_VALUES)) {
    fieldErrors.requestedActions = "Выберите ожидаемый результат рассмотрения";
  }
  if (!description || description.length < 20) {
    fieldErrors.description = "Опишите ситуацию подробнее";
  }
  if (input.consentAccepted !== true) fieldErrors.consent = "Необходимо подтвердить согласие";
  if (!consentTemplateId) fieldErrors.consentTemplate = "Шаблон согласия не выбран";
  if (investigationSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(investigationSlug)) {
    fieldErrors.investigation = "Расследование указано некорректно";
  }

  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };

  return {
    success: true,
    data: {
      name: name!,
      phone,
      email,
      city,
      investigationSlug,
      reporterRoles,
      categories,
      requestedActions,
      description: description!,
      operationDate: operationDate(input.operationDate),
      reportedClinicName: text(input.reportedClinicName, 240),
      reportedDoctorName: text(input.reportedDoctorName, 240),
      reportedEquipmentName: text(input.reportedEquipmentName, 240),
      collectiveInterest: input.collectiveInterest === true,
      consentTemplateId: consentTemplateId!,
    },
  };
}

