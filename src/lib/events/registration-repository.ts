import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { getInternalNotificationRecipients } from "@/lib/email/recipients";
import type { ValidatedEventRegistration } from "./registration-validation";
import { formatEventRegistrationNumber } from "./registration-reference";
import { parseTelegramBotConfig } from "./telegram";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

export class EventSubmissionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "EventSubmissionError";
  }
}

export function createEventRequestFingerprint(ip: string, userAgent: string) {
  const secret =
    process.env.EVENT_RATE_LIMIT_SECRET?.trim() ||
    process.env.COOPERATION_RATE_LIMIT_SECRET?.trim() ||
    process.env.APPEAL_RATE_LIMIT_SECRET?.trim() ||
    (process.env.NODE_ENV === "production"
      ? ""
      : process.env.SESSION_SECRET?.trim() || "local-development-event-rate-limit");
  if (!secret) throw new EventSubmissionError("Сервис временно не настроен", 503);
  return createHmac("sha256", secret).update(`${ip}\n${userAgent}`).digest("hex");
}

export async function getEventRegistrationGate(eventSlug: string) {
  const db = getPrisma();
  if (!db) throw new EventSubmissionError("Сервис временно недоступен", 503);
  const event = await db.event.findUnique({
    where: { slug: eventSlug },
    select: {
      registrationOpen: true,
      consentTemplates: {
        where: { isActive: true, requiresApproval: false },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!event) throw new EventSubmissionError("Мероприятие не найдено", 404);
  return { open: event.registrationOpen && event.consentTemplates.length > 0 };
}

function isPrismaUniqueError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

export async function createEventRegistration(params: {
  eventSlug: string;
  input: ValidatedEventRegistration;
  requestFingerprint: string;
  idempotencyKey: string;
}) {
  const db = getPrisma();
  if (!db) throw new EventSubmissionError("Сервис временно недоступен", 503);

  const event = await db.event.findUnique({
    where: { slug: params.eventSlug },
    include: {
      consentTemplates: {
        where: { isActive: true, requiresApproval: false },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!event) throw new EventSubmissionError("Мероприятие не найдено", 404);
  if (!event.registrationOpen || event.consentTemplates.length === 0) {
    throw new EventSubmissionError("Регистрация скоро откроется", 409);
  }

  const existingByIdempotency = await db.eventRegistration.findUnique({
    where: { eventId_idempotencyKey: { eventId: event.id, idempotencyKey: params.idempotencyKey } },
    select: { status: true },
  });
  if (existingByIdempotency) {
    return { duplicate: true as const, status: existingByIdempotency.status, notifications: [] };
  }

  const recentCount = await db.eventRegistration.count({
    where: {
      eventId: event.id,
      requestFingerprint: params.requestFingerprint,
      createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
    },
  });
  if (recentCount >= RATE_LIMIT_MAX) {
    throw new EventSubmissionError("Слишком много заявок. Повторите попытку позднее", 429);
  }

  const consentTemplate = event.consentTemplates[0];
  const associationRecipients = getInternalNotificationRecipients();

  try {
    const created = await db.$transaction(async (tx) => {
      const duplicate = await tx.eventRegistration.findFirst({
        where: {
          eventId: event.id,
          OR: [{ email: params.input.email }, { phone: params.input.phone }],
        },
        select: { status: true },
      });
      if (duplicate) {
        return { duplicate: true as const, status: duplicate.status, notifications: [] };
      }

      const sequence = await tx.event.update({
        where: { id: event.id },
        data: { registrationSequence: { increment: 1 } },
        select: { registrationSequence: true },
      });
      const publicNumber = formatEventRegistrationNumber(sequence.registrationSequence);
      const registrationId = randomUUID();
      const telegramEnabled = parseTelegramBotConfig().enabled;
      const registration = await tx.eventRegistration.create({
        data: {
          id: registrationId,
          eventId: event.id,
          publicNumber,
          consentTemplateId: consentTemplate.id,
          fullName: params.input.fullName,
          phone: params.input.phone,
          email: params.input.email,
          city: params.input.city,
          specialty: params.input.specialty,
          customSpecialty: params.input.customSpecialty,
          organization: params.input.organization,
          position: params.input.position,
          comment: params.input.comment,
          consentAcceptedAt: new Date(),
          source: params.input.source,
          landingUrl: params.input.landingUrl,
          pageTitle: params.input.pageTitle,
          referrer: params.input.referrer,
          utmSource: params.input.utmSource,
          utmMedium: params.input.utmMedium,
          utmCampaign: params.input.utmCampaign,
          utmContent: params.input.utmContent,
          requestFingerprint: params.requestFingerprint,
          idempotencyKey: params.idempotencyKey,
          statusHistory: { create: { fromStatus: null, toStatus: "NEW", comment: "Регистрация получена" } },
            notifications: {
              create: [
                { kind: "APPLICANT", channel: "EMAIL", type: "EVENT_REGISTRATION_CREATED", status: "PENDING", recipient: params.input.email, recipients: [params.input.email] },
                { kind: "ASSOCIATION", channel: "EMAIL", type: "EVENT_REGISTRATION_CREATED", status: "PENDING", recipient: associationRecipients.join(",") || null, recipients: associationRecipients },
                { kind: "ASSOCIATION", channel: "GOOGLE_SHEETS", type: "EVENT_REGISTRATION_CREATED", status: "PENDING", recipient: null, idempotencyKey: `event-registration:${publicNumber}:google-sheets` },
                ...(telegramEnabled
                ? [{
                    kind: "ASSOCIATION" as const,
                    channel: "TELEGRAM" as const,
                    type: "EVENT_REGISTRATION_CREATED" as const,
                    status: "PENDING" as const,
                    recipient: null,
                    idempotencyKey: `event-registration:${registrationId}:telegram:created`,
                  }]
                : []),
            ],
          },
        },
        select: {
          id: true,
          publicNumber: true,
          status: true,
          notifications: { select: { id: true, kind: true, channel: true, type: true } },
        },
      });
      return { duplicate: false as const, ...registration };
    });

    return created;
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      const duplicate = await db.eventRegistration.findFirst({
        where: {
          eventId: event.id,
          OR: [
            { email: params.input.email },
            { phone: params.input.phone },
            { idempotencyKey: params.idempotencyKey },
          ],
        },
        select: { status: true },
      });
      if (duplicate) return { duplicate: true as const, status: duplicate.status, notifications: [] };
      throw new EventSubmissionError("Заявка уже регистрируется. Повторите попытку", 409);
    }
    throw error;
  }
}
