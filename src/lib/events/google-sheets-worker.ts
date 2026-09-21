import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { GoogleSheetsConfig, parseGoogleSheetsConfig, syncRegistrationToGoogleSheet } from "./google-sheets";

export const GOOGLE_SHEETS_MAX_ATTEMPTS = 5;

function retryAt(attempt: number, now = new Date()) {
  if (attempt >= GOOGLE_SHEETS_MAX_ATTEMPTS) return null;
  return new Date(now.getTime() + Math.min(60_000, 1_000 * 2 ** Math.max(0, Math.min(6, attempt - 1))));
}

function safeError(error: unknown) {
  if (!(error instanceof Error)) return "Ошибка синхронизации Google Sheets";
  return error.message.slice(0, 500);
}

export async function deliverGoogleSheetsNotification(
  notificationId: string,
  config: GoogleSheetsConfig = parseGoogleSheetsConfig(),
) {
  const db = getPrisma();
  if (!db) return { sent: false as const, skipped: true as const, error: "Database unavailable" };
  if (!config.enabled) return { sent: false as const, skipped: true as const, error: "Google Sheets integration disabled" };

  const notification = await db.eventRegistrationNotification.findUnique({
    where: { id: notificationId },
    include: {
      registration: {
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
      },
    },
  });
  if (!notification || notification.channel !== "GOOGLE_SHEETS") return { sent: false as const, skipped: true as const, error: "Google Sheets notification not found" };

  const now = new Date();
  const staleBefore = new Date(now.getTime() - 5 * 60_000);
  const workerId = `google-sheets:${process.pid}:${randomUUID()}`;
  const claimed = await db.eventRegistrationNotification.updateMany({
    where: {
      id: notificationId,
      channel: "GOOGLE_SHEETS",
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: GOOGLE_SHEETS_MAX_ATTEMPTS },
      OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }],
    },
    data: { lockedAt: now, lockedBy: workerId },
  });
  if (claimed.count !== 1) return { sent: false as const, skipped: true as const, error: "Google Sheets notification is already processing" };

  const attempt = notification.attempts + 1;
  try {
    const result = await syncRegistrationToGoogleSheet(config, notification.registration);
    await db.eventRegistrationNotification.update({
      where: { id: notificationId },
      data: { status: "SENT", attempts: attempt, sentAt: new Date(), lastAttemptAt: now, nextAttemptAt: null, lockedAt: null, lockedBy: null, lastError: null },
    });
    return { sent: true as const, alreadyPresent: result.alreadyPresent };
  } catch (error) {
    await db.eventRegistrationNotification.update({
      where: { id: notificationId },
      data: { status: "FAILED", attempts: attempt, lastAttemptAt: now, nextAttemptAt: retryAt(attempt, now), lockedAt: null, lockedBy: null, lastError: safeError(error) },
    });
    return { sent: false as const, skipped: false as const, error: safeError(error) };
  }
}
