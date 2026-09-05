import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { TELEGRAM_MAX_ATTEMPTS } from "./telegram";
import { STO_2026_EVENT_SLUG } from "./sto-2026";

const TELEGRAM_RETRYABLE_STATUSES = ["PENDING", "FAILED"] as const;
const TELEGRAM_EXPORT_STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "CANCELLED", "ATTENDED", "NO_SHOW"] as const;

function isUniqueError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

function telegramUpdateId(value: string) {
  return BigInt(value);
}

export async function claimTelegramUpdate(updateId: string) {
  const db = getPrisma();
  if (!db) return false;
  try {
    await db.eventTelegramUpdate.create({ data: { id: randomUUID(), updateId: telegramUpdateId(updateId) } });
    return true;
  } catch (error) {
    if (isUniqueError(error)) return false;
    throw error;
  }
}

export async function markTelegramUpdateProcessed(updateId: string) {
  const db = getPrisma();
  if (!db) return;
  await db.eventTelegramUpdate.update({ where: { updateId: telegramUpdateId(updateId) }, data: { processedAt: new Date() } });
}

export async function recordTelegramAudit(params: {
  action: string;
  telegramUserId?: string | null;
  telegramChatId?: string | null;
  updateId?: string | null;
  eventId?: string | null;
  registrationId?: string | null;
  deliveryStatus?: string | null;
}) {
  const db = getPrisma();
  if (!db) return;
  await db.eventTelegramAuditEvent.create({
    data: {
      id: randomUUID(),
      action: params.action,
      telegramUserId: params.telegramUserId || null,
      telegramChatId: params.telegramChatId || null,
      updateId: params.updateId ? telegramUpdateId(params.updateId) : null,
      eventId: params.eventId || null,
      registrationId: params.registrationId || null,
      deliveryStatus: params.deliveryStatus || null,
    },
  });
}

export async function getStoEventId() {
  const db = getPrisma();
  if (!db) return null;
  const event = await db.event.findUnique({ where: { slug: STO_2026_EVENT_SLUG }, select: { id: true } });
  return event?.id ?? null;
}

export async function getTelegramRegistrationNotification(notificationId: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.eventRegistrationNotification.findUnique({
    where: { id: notificationId },
    include: {
      registration: { include: { event: true } },
    },
  });
}

export async function claimTelegramNotification(notificationId: string, workerId: string) {
  const db = getPrisma();
  if (!db) return false;
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 5 * 60_000);
  const result = await db.eventRegistrationNotification.updateMany({
    where: {
      id: notificationId,
      channel: "TELEGRAM",
      status: { in: [...TELEGRAM_RETRYABLE_STATUSES] },
      attempts: { lt: TELEGRAM_MAX_ATTEMPTS },
      OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }],
    },
    data: { lockedAt: now, lockedBy: workerId },
  });
  return result.count === 1;
}

export async function updateTelegramNotificationDelivery(notificationId: string, params: {
  status: "SENT" | "FAILED";
  attempts: number;
  nextAttemptAt?: Date | null;
  error?: string | null;
}) {
  const db = getPrisma();
  if (!db) return;
  await db.eventRegistrationNotification.update({
    where: { id: notificationId },
    data: {
      status: params.status,
      attempts: params.attempts,
      lastAttemptAt: new Date(),
      ...(params.status === "SENT" ? { sentAt: new Date(), lastError: null } : { lastError: params.error || "Ошибка доставки" }),
      nextAttemptAt: params.nextAttemptAt || null,
      lockedAt: null,
      lockedBy: null,
    },
  });
}

export async function findTelegramOutbox(limit = 20) {
  const db = getPrisma();
  if (!db) return [];
  return db.eventRegistrationNotification.findMany({
    where: {
      channel: "TELEGRAM",
      status: { in: [...TELEGRAM_RETRYABLE_STATUSES] },
      attempts: { lt: TELEGRAM_MAX_ATTEMPTS },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
    },
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(limit, 100)),
    select: { id: true },
  });
}

export async function listLatestTelegramRegistrations(eventId: string, page: number, pageSize = 10) {
  const db = getPrisma();
  if (!db) return { rows: [], total: 0, pages: 1 };
  const safePage = Math.max(0, Math.min(50, Math.floor(page)));
  const where = { eventId, status: { not: "SPAM" as const } };
  const [rows, total] = await Promise.all([
    db.eventRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: safePage * pageSize,
      take: pageSize,
      select: { publicNumber: true, fullName: true, organization: true, city: true, status: true, createdAt: true },
    }),
    db.eventRegistration.count({ where }),
  ]);
  return { rows, total, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

function startOfYekaterinburgDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yekaterinburg", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day) - 5 * 60 * 60_000);
}

export async function getTelegramRegistrationStats(eventId: string) {
  const db = getPrisma();
  if (!db) return null;
  const where = { eventId, status: { not: "SPAM" as const } };
  const [total, statusGroups, today, qr, cities, specialties, customSpecialties] = await Promise.all([
    db.eventRegistration.count({ where }),
    db.eventRegistration.groupBy({ by: ["status"], where, _count: { _all: true } }),
    db.eventRegistration.count({ where: { ...where, createdAt: { gte: startOfYekaterinburgDay() } } }),
    db.eventRegistration.count({ where: { ...where, utmSource: "print", utmMedium: "qr", utmCampaign: "conference_invitation_2026" } }),
    db.eventRegistration.groupBy({ by: ["city"], where, _count: { _all: true }, orderBy: { _count: { city: "desc" } }, take: 5 }),
    db.eventRegistration.groupBy({ by: ["specialty"], where, _count: { _all: true }, orderBy: { _count: { specialty: "desc" } }, take: 5 }),
    db.eventRegistration.groupBy({ by: ["customSpecialty"], where: { ...where, customSpecialty: { not: null } }, _count: { _all: true }, orderBy: { _count: { customSpecialty: "desc" } }, take: 5 }),
  ]);
  const statuses = Object.fromEntries(statusGroups.map((group) => [group.status, group._count._all]));
  const specialtyRows = [...specialties.map((row) => ({ name: row.specialty, count: row._count._all })), ...customSpecialties.map((row) => ({ name: row.customSpecialty, count: row._count._all }))]
    .filter((row): row is { name: string; count: number } => Boolean(row.name))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return {
    total,
    statuses,
    today,
    qr,
    cities: cities.filter((row) => row.city).map((row) => ({ name: row.city as string, count: row._count._all })),
    specialties: specialtyRows,
  };
}

export async function listTelegramExportRegistrations(eventId: string) {
  const db = getPrisma();
  if (!db) return [];
  return db.eventRegistration.findMany({
    where: { eventId, status: { in: [...TELEGRAM_EXPORT_STATUSES] } },
    orderBy: { createdAt: "asc" },
    select: {
      publicNumber: true,
      createdAt: true,
      status: true,
      fullName: true,
      phone: true,
      email: true,
      specialty: true,
      customSpecialty: true,
      organization: true,
      position: true,
      city: true,
      comment: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmContent: true,
      source: true,
      updatedAt: true,
    },
  });
}

export async function enqueueTelegramExportJob(eventId: string, chatId: string, userId: string) {
  const db = getPrisma();
  if (!db) return null;
  const dedupeKey = `${eventId}:FULL_EXPORT:${Math.floor(Date.now() / 20_000)}`;
  try {
    return await db.eventTelegramJob.create({
      data: {
        id: randomUUID(),
        eventId,
        kind: "FULL_EXPORT",
        status: "PENDING",
        dedupeKey,
        telegramChatId: chatId,
        telegramUserId: userId,
      },
    });
  } catch (error) {
    if (isUniqueError(error)) return null;
    throw error;
  }
}

export async function claimTelegramJob(jobId: string, workerId: string) {
  const db = getPrisma();
  if (!db) return false;
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 5 * 60_000);
  const result = await db.eventTelegramJob.updateMany({
    where: {
      id: jobId,
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: TELEGRAM_MAX_ATTEMPTS },
      OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }],
    },
    data: { status: "PROCESSING", lockedAt: now, lockedBy: workerId },
  });
  return result.count === 1;
}

export async function getTelegramJob(jobId: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.eventTelegramJob.findUnique({ where: { id: jobId } });
}

export async function finishTelegramJob(jobId: string, params: { status: "SENT" | "FAILED"; attempts: number; error?: string | null; nextAttemptAt?: Date | null }) {
  const db = getPrisma();
  if (!db) return;
  await db.eventTelegramJob.update({
    where: { id: jobId },
    data: {
      status: params.status,
      attempts: params.attempts,
      sentAt: params.status === "SENT" ? new Date() : null,
      lastError: params.error || null,
      nextAttemptAt: params.nextAttemptAt || null,
      lockedAt: null,
      lockedBy: null,
    },
  });
}

export async function findTelegramJobs(limit = 10) {
  const db = getPrisma();
  if (!db) return [];
  return db.eventTelegramJob.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: TELEGRAM_MAX_ATTEMPTS },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      event: { slug: STO_2026_EVENT_SLUG },
    },
    orderBy: { requestedAt: "asc" },
    take: Math.max(1, Math.min(limit, 50)),
    select: { id: true },
  });
}
