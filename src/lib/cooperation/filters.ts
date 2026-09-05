import type { Prisma } from "@/generated/prisma/client";
import { COOPERATION_PARTICIPANT_TYPES, COOPERATION_STATUS_VALUES, type CooperationApplicationStatus, type CooperationParticipantType } from "./constants";

export type CooperationApplicationFilters = {
  query?: string;
  participantType?: string;
  status?: string;
  city?: string;
  region?: string;
  source?: string;
  utmCampaign?: string;
  responsibleUserId?: string;
  from?: string;
  to?: string;
};

export function buildCooperationApplicationSearch(query: string) {
  const value = query.trim();
  if (!value) return [];
  return [
    { applicationNumber: { contains: value, mode: "insensitive" as const } },
    { organizationName: { contains: value, mode: "insensitive" as const } },
    { firstName: { contains: value, mode: "insensitive" as const } },
    { lastName: { contains: value, mode: "insensitive" as const } },
    { inn: { contains: value, mode: "insensitive" as const } },
    { phone: { contains: value, mode: "insensitive" as const } },
    { email: { contains: value, mode: "insensitive" as const } },
  ];
}

export function buildCooperationApplicationWhere(filters: CooperationApplicationFilters): Prisma.CooperationApplicationWhereInput {
  const where: Prisma.CooperationApplicationWhereInput = {};
  const query = buildCooperationApplicationSearch(filters.query ?? "");
  if (query.length) where.OR = query;
  if (COOPERATION_PARTICIPANT_TYPES.includes(filters.participantType as CooperationParticipantType)) {
    where.participantType = filters.participantType as CooperationParticipantType;
  }
  if (COOPERATION_STATUS_VALUES.includes(filters.status as CooperationApplicationStatus)) {
    where.status = filters.status as CooperationApplicationStatus;
  }
  if (filters.city?.trim()) where.city = { contains: filters.city.trim(), mode: "insensitive" };
  if (filters.region?.trim()) where.region = { contains: filters.region.trim(), mode: "insensitive" };
  if (filters.source?.trim()) where.source = filters.source.trim();
  if (filters.utmCampaign?.trim()) where.utmCampaign = { contains: filters.utmCampaign.trim(), mode: "insensitive" };
  if (filters.responsibleUserId?.trim()) where.responsibleUserId = filters.responsibleUserId.trim();
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
    };
  }
  return where;
}
