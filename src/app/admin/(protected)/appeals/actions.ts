"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { deliverAppealNotification } from "@/lib/appeals/email";
import { APPEAL_STATUS_VALUES, type AppealStatusValue } from "@/lib/appeals/constants";
import { getPrisma } from "@/lib/prisma";

function value(formData: FormData, key: string, maxLength = 20_000) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

export async function updateAppealStatusAction(appealId: string, formData: FormData) {
  const session = await requireAdminSession();
  const status = value(formData, "status", 40) as AppealStatusValue;
  const comment = value(formData, "comment", 1_000) || null;
  if (!APPEAL_STATUS_VALUES.includes(status)) throw new Error("Недопустимый статус");

  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  await db.$transaction(async (transaction) => {
    const current = await transaction.appeal.findUnique({ where: { id: appealId }, select: { status: true } });
    if (!current) throw new Error("Обращение не найдено");
    if (current.status === status) return;

    const updated = await transaction.appeal.updateMany({
      where: { id: appealId, status: current.status },
      data: { status, statusChangedAt: new Date() },
    });
    if (updated.count !== 1) {
      throw new Error("Статус уже изменён другим сотрудником. Обновите страницу");
    }
    await transaction.appealStatusHistory.create({
      data: {
        appealId,
        adminUserId: session.adminId,
        fromStatus: current.status,
        toStatus: status,
        comment,
      },
    });
  });
  revalidatePath("/admin/appeals");
  revalidatePath(`/admin/appeals/${appealId}`);
}

export async function addAppealNoteAction(appealId: string, formData: FormData) {
  const session = await requireAdminSession();
  const text = value(formData, "text", 10_000);
  if (text.length < 2) throw new Error("Комментарий слишком короткий");
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  await db.appealNote.create({ data: { appealId, adminUserId: session.adminId, text } });
  revalidatePath(`/admin/appeals/${appealId}`);
}

export async function updateAppealClassificationAction(appealId: string, formData: FormData) {
  await requireAdminSession();
  const investigationId = value(formData, "investigationId", 100) || null;
  const clinicId = value(formData, "clinicId", 100) || null;
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");

  const [investigation, clinic] = await Promise.all([
    investigationId
      ? db.investigation.findUnique({ where: { id: investigationId }, select: { id: true } })
      : Promise.resolve(null),
    clinicId ? db.clinic.findUnique({ where: { id: clinicId }, select: { id: true } }) : Promise.resolve(null),
  ]);
  if (investigationId && !investigation) throw new Error("Расследование не найдено");
  if (clinicId && !clinic) throw new Error("Клиника не найдена");

  await db.appeal.update({ where: { id: appealId }, data: { investigationId, clinicId } });
  revalidatePath("/admin/appeals");
  revalidatePath(`/admin/appeals/${appealId}`);
}

export async function retryAppealNotificationAction(notificationId: string, appealId: string) {
  await requireAdminSession();
  await deliverAppealNotification(notificationId);
  revalidatePath(`/admin/appeals/${appealId}`);
}

export async function activateConsentTemplateAction(formData: FormData) {
  await requireAdminSession();
  const version = value(formData, "version", 80);
  const title = value(formData, "title", 240);
  const body = value(formData, "body", 30_000);
  const requiresApproval = formData.get("requiresApproval") === "on";
  if (!version || !/^[a-zA-Z0-9._-]+$/.test(version)) throw new Error("Проверьте версию шаблона");
  if (title.length < 3 || body.length < 20) throw new Error("Заполните название и текст шаблона");

  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  const existing = await db.appealConsentTemplate.findUnique({ where: { version }, select: { id: true } });
  if (existing) throw new Error("Версия уже существует. Создайте новую версию, чтобы сохранить историю согласий");

  await db.$transaction([
    db.appealConsentTemplate.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    db.appealConsentTemplate.create({ data: { version, title, body, requiresApproval, isActive: true } }),
  ]);
  revalidatePath("/appeal");
  revalidatePath("/admin/appeals/settings");
}
