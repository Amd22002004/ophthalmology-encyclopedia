import type { Prisma } from "@/generated/prisma/client";

export type EventRegistrationFilters = {
  query?: string;
  status?: string;
  city?: string;
  specialty?: string;
  organization?: string;
  source?: string;
  utmCampaign?: string;
  from?: string;
  to?: string;
};

export const EVENT_REGISTRATION_STATUS_VALUES = [
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "ATTENDED",
  "CANCELLED",
  "NO_SHOW",
  "SPAM",
] as const;

export type EventRegistrationStatusValue = (typeof EVENT_REGISTRATION_STATUS_VALUES)[number];

export const EVENT_REGISTRATION_STATUS_LABELS: Record<EventRegistrationStatusValue, string> = {
  NEW: "Новая",
  CONTACTED: "Связались",
  CONFIRMED: "Подтверждена",
  ATTENDED: "Участник был",
  CANCELLED: "Отменена",
  NO_SHOW: "Не явился",
  SPAM: "Спам",
};

export function buildEventRegistrationSearch(query: string) {
  const value = query.trim();
  if (!value) return [];
  return [
    { publicNumber: { contains: value, mode: "insensitive" as const } },
    { fullName: { contains: value, mode: "insensitive" as const } },
    { phone: { contains: value, mode: "insensitive" as const } },
    { email: { contains: value, mode: "insensitive" as const } },
    { organization: { contains: value, mode: "insensitive" as const } },
    { city: { contains: value, mode: "insensitive" as const } },
    { position: { contains: value, mode: "insensitive" as const } },
  ];
}

export function buildEventRegistrationWhere(filters: EventRegistrationFilters): Prisma.EventRegistrationWhereInput {
  const where: Prisma.EventRegistrationWhereInput = {};
  const query = buildEventRegistrationSearch(filters.query ?? "");
  if (query.length) where.OR = query;
  if (EVENT_REGISTRATION_STATUS_VALUES.includes(filters.status as EventRegistrationStatusValue)) {
    where.status = filters.status as EventRegistrationStatusValue;
  }
  if (filters.city?.trim()) where.city = { contains: filters.city.trim(), mode: "insensitive" };
  if (filters.specialty?.trim()) where.specialty = { contains: filters.specialty.trim(), mode: "insensitive" };
  if (filters.organization?.trim()) where.organization = { contains: filters.organization.trim(), mode: "insensitive" };
  if (filters.source?.trim()) where.source = filters.source.trim();
  if (filters.utmCampaign?.trim()) where.utmCampaign = { contains: filters.utmCampaign.trim(), mode: "insensitive" };
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
    };
  }
  return where;
}
