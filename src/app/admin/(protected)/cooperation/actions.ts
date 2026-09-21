"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { deliverCooperationNotification } from "@/lib/cooperation/email";
import { COOPERATION_STATUS_VALUES, type CooperationApplicationStatus } from "@/lib/cooperation/constants";
import { getPrisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/auth-security";
import {
  confirmClinicAccess,
  confirmDoctorLink,
  createInvitation,
  InvitationFlowError,
  revokeInvitation,
  setEntityMatch,
} from "@/lib/invitations";
import { deliverInvitationEmail } from "@/lib/invitation-email";

function value(formData: FormData, key: string, maxLength = 20_000) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

export async function updateCooperationStatusAction(applicationId: string, formData: FormData) {
  const session = await requireAdminSession();
  const status = value(formData, "status", 40) as CooperationApplicationStatus;
  const comment = value(formData, "comment", 1_000) || null;
  if (!COOPERATION_STATUS_VALUES.includes(status)) throw new Error("Недопустимый статус");
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  await db.$transaction(async (transaction) => {
    const current = await transaction.cooperationApplication.findUnique({ where: { id: applicationId }, select: { status: true } });
    if (!current) throw new Error("Заявка не найдена");
    if (current.status === status) return;
    const updated = await transaction.cooperationApplication.updateMany({ where: { id: applicationId, status: current.status }, data: { status } });
    if (updated.count !== 1) throw new Error("Статус уже изменён другим сотрудником. Обновите страницу");
    await transaction.cooperationApplicationStatusHistory.create({ data: { applicationId, adminUserId: session.adminId, fromStatus: current.status, toStatus: status, comment } });
  });
  revalidatePath("/admin/cooperation");
  revalidatePath(`/admin/cooperation/${applicationId}`);
}

export async function assignCooperationResponsibleAction(applicationId: string, formData: FormData) {
  await requireAdminSession();
  const responsibleUserId = value(formData, "responsibleUserId", 100) || null;
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  if (responsibleUserId && !(await db.adminUser.findUnique({ where: { id: responsibleUserId }, select: { id: true } }))) throw new Error("Сотрудник не найден");
  await db.cooperationApplication.update({ where: { id: applicationId }, data: { responsibleUserId } });
  revalidatePath("/admin/cooperation");
  revalidatePath(`/admin/cooperation/${applicationId}`);
}

export async function addCooperationNoteAction(applicationId: string, formData: FormData) {
  const session = await requireAdminSession();
  const text = value(formData, "text", 10_000);
  if (text.length < 2) throw new Error("Комментарий слишком короткий");
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  await db.cooperationApplicationNote.create({ data: { applicationId, adminUserId: session.adminId, text } });
  revalidatePath(`/admin/cooperation/${applicationId}`);
}

export async function retryCooperationNotificationAction(notificationId: string, applicationId: string) {
  await requireAdminSession();
  await deliverCooperationNotification(notificationId);
  revalidatePath(`/admin/cooperation/${applicationId}`);
}

export async function setCooperationEntityMatchAction(applicationId: string, formData: FormData) {
  await assertSameOrigin();
  const session = await requireAdminSession();
  const entityId = value(formData, "entityId", 100);
  const status = value(formData, "status", 20) as "PENDING" | "CONFIRMED";
  if (!entityId || !["PENDING", "CONFIRMED"].includes(status)) throw new InvitationFlowError("Выберите сущность и статус соответствия");
  await setEntityMatch({ applicationId, adminUserId: session.adminId, entityId, status });
  revalidatePath(`/admin/cooperation/${applicationId}`);
}

export async function createCooperationInvitationAction(applicationId: string) {
  await assertSameOrigin();
  const session = await requireAdminSession();
  const { invitation, rawToken } = await createInvitation({ applicationId, adminUserId: session.adminId });
  await deliverInvitationEmail(invitation.id, rawToken);
  revalidatePath(`/admin/cooperation/${applicationId}`);
}

export async function reissueCooperationInvitationAction(invitationId: string, applicationId: string) {
  await assertSameOrigin();
  const session = await requireAdminSession();
  const { invitation, rawToken } = await createInvitation({ applicationId, adminUserId: session.adminId, reissueInvitationId: invitationId });
  await deliverInvitationEmail(invitation.id, rawToken);
  revalidatePath(`/admin/cooperation/${applicationId}`);
}

export async function revokeCooperationInvitationAction(invitationId: string, applicationId: string) {
  await assertSameOrigin();
  const session = await requireAdminSession();
  await revokeInvitation(invitationId, session.adminId);
  revalidatePath(`/admin/cooperation/${applicationId}`);
}

export async function confirmDoctorLinkAction(linkId: string, applicationId: string) {
  await assertSameOrigin();
  const session = await requireAdminSession();
  await confirmDoctorLink(linkId, session.adminId);
  revalidatePath(`/admin/cooperation/${applicationId}`);
}

export async function confirmClinicAccessAction(accessId: string, applicationId: string) {
  await assertSameOrigin();
  const session = await requireAdminSession();
  await confirmClinicAccess(accessId, session.adminId);
  revalidatePath(`/admin/cooperation/${applicationId}`);
}
