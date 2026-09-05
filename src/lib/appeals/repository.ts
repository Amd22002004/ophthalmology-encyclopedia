import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { evidenceValidatedContentWhere } from "@/lib/publication-gate";
import { publicInvestigationRelationWhere } from "@/lib/regulations/public-filters";
import { createAppealPublicNumber } from "./reference";
import { stageAppealFiles } from "./storage";
import type { ValidatedAppealInput } from "./validation";
import { getInternalNotificationRecipients } from "@/lib/email/recipients";

const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

export class AppealSubmissionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "AppealSubmissionError";
  }
}

export function createRequestFingerprint(ip: string, userAgent: string) {
  const secret =
    process.env.APPEAL_RATE_LIMIT_SECRET?.trim() ||
    (process.env.NODE_ENV === "production"
      ? ""
      : process.env.SESSION_SECRET?.trim() || "local-development-appeal-rate-limit");
  if (!secret) throw new AppealSubmissionError("Сервис временно не настроен", 503);
  return createHmac("sha256", secret).update(`${ip}\n${userAgent}`).digest("hex");
}

export async function createAppeal(params: {
  input: ValidatedAppealInput;
  files: File[];
  requestFingerprint: string;
}) {
  const db = getPrisma();
  if (!db) throw new AppealSubmissionError("Сервис временно недоступен", 503);

  const [consent, investigation, recentCount] = await Promise.all([
    db.appealConsentTemplate.findFirst({
      where: { id: params.input.consentTemplateId, isActive: true },
      select: { id: true, version: true },
    }),
    params.input.investigationSlug
      ? db.investigation.findFirst({
          where: {
            slug: params.input.investigationSlug,
            ...evidenceValidatedContentWhere(),
          },
          select: {
            id: true,
            clinics: {
              where: publicInvestigationRelationWhere(),
              select: { clinicId: true },
              take: 2,
            },
          },
        })
      : Promise.resolve(null),
    db.appeal.count({
      where: {
        requestFingerprint: params.requestFingerprint,
        createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
      },
    }),
  ]);

  if (!consent) throw new AppealSubmissionError("Шаблон согласия изменился. Обновите страницу", 409, "consent");
  if (params.input.investigationSlug && !investigation) {
    throw new AppealSubmissionError("Указанное расследование не найдено", 400, "investigation");
  }
  if (recentCount >= RATE_LIMIT_MAX) {
    throw new AppealSubmissionError("Слишком много обращений. Повторите попытку позднее", 429);
  }

  const appealId = randomUUID();
  const staged = await stageAppealFiles(appealId, params.files);
  const publicNumber = createAppealPublicNumber();
  const clinicId = investigation?.clinics.length === 1 ? investigation.clinics[0].clinicId : null;
  const associationRecipients = getInternalNotificationRecipients();

  try {
    await db.appeal.create({
      data: {
        id: appealId,
        publicNumber,
        investigationId: investigation?.id ?? null,
        clinicId,
        consentTemplateId: consent.id,
        name: params.input.name,
        phone: params.input.phone,
        email: params.input.email,
        city: params.input.city,
        reporterRoles: params.input.reporterRoles,
        categories: params.input.categories,
        requestedActions: params.input.requestedActions,
        description: params.input.description,
        operationDate: params.input.operationDate,
        reportedClinicName: params.input.reportedClinicName,
        reportedDoctorName: params.input.reportedDoctorName,
        reportedEquipmentName: params.input.reportedEquipmentName,
        collectiveInterest: params.input.collectiveInterest,
        consentAcceptedAt: new Date(),
        requestFingerprint: params.requestFingerprint,
        attachments: { create: staged.attachments },
        statusHistory: { create: { fromStatus: null, toStatus: "NEW", comment: "Обращение зарегистрировано" } },
        notifications: {
          create: {
            status: "PENDING",
            recipient: associationRecipients.join(",") || null,
            recipients: associationRecipients,
          },
        },
      },
      select: { id: true, publicNumber: true, notifications: { select: { id: true }, take: 1 } },
    });
    await staged.commit();
  } catch (error) {
    await staged.rollback();
    await db.appeal.deleteMany({ where: { id: appealId } });
    throw error;
  }

  // Outbox сохраняется в той же операции, а доставку выполняет отдельный worker.
  // Поэтому недоступность SMTP не превращает успешную отправку формы в ошибку.
  return { id: appealId, publicNumber };
}
