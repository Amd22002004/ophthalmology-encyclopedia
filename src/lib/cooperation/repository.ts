import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { getInternalNotificationRecipients } from "@/lib/email/recipients";
import { createCooperationApplicationNumber } from "./reference";
import { stageCooperationAttachment } from "./files";
import type { ValidatedCooperationApplication } from "./validation";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

export class CooperationSubmissionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "CooperationSubmissionError";
  }
}

export function createCooperationRequestFingerprint(ip: string, userAgent: string) {
  const secret =
    process.env.COOPERATION_RATE_LIMIT_SECRET?.trim() ||
    process.env.APPEAL_RATE_LIMIT_SECRET?.trim() ||
    (process.env.NODE_ENV === "production"
      ? ""
      : process.env.SESSION_SECRET?.trim() || "local-development-cooperation-rate-limit");
  if (!secret) throw new CooperationSubmissionError("Сервис временно не настроен", 503);
  return createHmac("sha256", secret).update(`${ip}\n${userAgent}`).digest("hex");
}

async function nextApplicationNumber(db: Awaited<ReturnType<typeof getPrisma>>, date: Date) {
  if (!db) throw new CooperationSubmissionError("Сервис временно недоступен", 503);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const nextYear = new Date(Date.UTC(date.getUTCFullYear() + 1, 0, 1));
  const count = await db.cooperationApplication.count({ where: { createdAt: { gte: yearStart, lt: nextYear } } });
  let sequence = count + 1;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = createCooperationApplicationNumber(date, sequence);
    const exists = await db.cooperationApplication.findUnique({ where: { applicationNumber: candidate }, select: { id: true } });
    if (!exists) return candidate;
    sequence += 1;
  }
  throw new CooperationSubmissionError("Не удалось выделить номер заявки. Повторите попытку", 503);
}

export async function createCooperationApplication(params: {
  input: ValidatedCooperationApplication;
  requestFingerprint: string;
  idempotencyKey: string;
  attachment: File | null;
}) {
  const db = getPrisma();
  if (!db) throw new CooperationSubmissionError("Сервис временно недоступен", 503);

  const existing = await db.cooperationApplication.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
    select: { id: true, applicationNumber: true, status: true },
  });
  if (existing) return { ...existing, duplicate: true as const };

  const recentCount = await db.cooperationApplication.count({
    where: {
      requestFingerprint: params.requestFingerprint,
      createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
    },
  });
  if (recentCount >= RATE_LIMIT_MAX) {
    throw new CooperationSubmissionError("Слишком много заявок. Повторите попытку позднее", 429);
  }

  const applicationId = randomUUID();
  let staged: Awaited<ReturnType<typeof stageCooperationAttachment>> = null;
  if (params.attachment) {
    if (params.input.participantType !== "PARTNER") {
      throw new CooperationSubmissionError("Вложение доступно только для заявки партнёра", 400, "attachment");
    }
    staged = await stageCooperationAttachment(applicationId, params.attachment);
  }

  const createdAt = new Date();
  const applicationNumber = await nextApplicationNumber(db, createdAt);
  const associationRecipients = getInternalNotificationRecipients();

  try {
    const application = await db.cooperationApplication.create({
      data: {
        id: applicationId,
        applicationNumber,
        participantType: params.input.participantType,
        applicationType: params.input.participantType.toLowerCase(),
        organizationName: params.input.organizationName,
        inn: params.input.inn,
        firstName: params.input.firstName,
        lastName: params.input.lastName,
        middleName: params.input.middleName,
        contactName: params.input.contactName,
        contactPosition: params.input.contactPosition,
        phone: params.input.phone,
        email: params.input.email,
        city: params.input.city,
        region: params.input.region,
        website: params.input.website,
        workplace: params.input.workplace,
        customWorkplace: params.input.customWorkplace,
        specialties: params.input.specialties,
        academicDegree: params.input.academicDegree,
        professionalUrl: params.input.professionalUrl,
        partnerType: params.input.partnerType,
        interests: params.input.interests,
        message: params.input.message,
        consentPersonalData: params.input.consentPersonalData,
        consentMarketing: params.input.consentMarketing,
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
        statusHistory: { create: { fromStatus: null, toStatus: "NEW", comment: "Заявка зарегистрирована" } },
        notifications: {
          create: [
            { kind: "APPLICANT", status: "PENDING", recipient: params.input.email, recipients: [params.input.email] },
            { kind: "ASSOCIATION", status: "PENDING", recipient: associationRecipients.join(",") || null, recipients: associationRecipients },
          ],
        },
        ...(staged ? { attachment: { create: staged.attachment } } : {}),
      },
      select: {
        id: true,
        applicationNumber: true,
        status: true,
        notifications: { select: { id: true, kind: true } },
      },
    });
    if (staged) await staged.commit();
    return { ...application, duplicate: false as const };
  } catch (error) {
    if (staged) await staged.rollback();
    await db.cooperationApplication.deleteMany({ where: { id: applicationId } });
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "P2002") {
      const duplicate = await db.cooperationApplication.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
        select: { id: true, applicationNumber: true, status: true },
      });
      if (duplicate) return { ...duplicate, duplicate: true as const };
      throw new CooperationSubmissionError("Заявка уже регистрируется. Повторите попытку", 409);
    }
    throw error;
  }
}
