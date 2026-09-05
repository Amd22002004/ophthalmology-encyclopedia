"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin } from "@/lib/auth-security";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { deliverEventRegistrationNotification } from "@/lib/events/registration-email";
import { deliverGoogleSheetsNotification } from "@/lib/events/google-sheets-worker";
import { EVENT_REGISTRATION_STATUS_VALUES, type EventRegistrationStatusValue } from "@/lib/events/admin-filters";
import { STO_2026_EVENT_PATH, STO_2026_REGISTER_PATH } from "@/lib/events/sto-2026";

function value(formData: FormData, key: string, maxLength = 20_000) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

function nullableDate(formData: FormData, key: string) {
  const raw = value(formData, key, 80);
  if (!raw) return null;
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) throw new Error("Укажите корректное время");
  return date;
}

function bool(formData: FormData, key: string) {
  return ["true", "on", "1"].includes(value(formData, key, 10));
}

export async function updateEventRegistrationAction(eventId: string, formData: FormData) {
  await assertSameOrigin();
  await requireAdminSession();
  const registrationOpen = bool(formData, "registrationOpen");
  const programPublished = bool(formData, "programPublished");
  const speakersPublished = bool(formData, "speakersPublished");
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  if (registrationOpen) {
    const approvedConsent = await db.eventConsentTemplate.findFirst({ where: { eventId, isActive: true, requiresApproval: false }, select: { id: true } });
    if (!approvedConsent) throw new Error("Открытие регистрации невозможно до утверждения юридического согласия");
  }
  await db.event.update({ where: { id: eventId }, data: { registrationOpen, programPublished, speakersPublished } });
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(STO_2026_EVENT_PATH);
  revalidatePath(STO_2026_REGISTER_PATH);
}

export async function updateEventTalkAction(eventId: string, talkId: string, formData: FormData) {
  await assertSameOrigin();
  await requireAdminSession();
  const title = value(formData, "title", 500);
  const kind = value(formData, "kind", 20);
  const sortOrder = Number.parseInt(value(formData, "sortOrder", 20), 10);
  if (!title || !["TALK", "BREAK"].includes(kind) || !Number.isInteger(sortOrder) || sortOrder < 1) throw new Error("Проверьте поля программы");
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  await db.eventTalk.update({
    where: { id: talkId },
    data: {
      title,
      kind: kind as "TALK" | "BREAK",
      sortOrder,
      description: value(formData, "description", 2_000) || null,
      moderatorSnapshot: value(formData, "moderatorSnapshot", 240) || null,
      startAt: nullableDate(formData, "startAt"),
      endAt: nullableDate(formData, "endAt"),
      published: bool(formData, "published"),
    },
  });
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(STO_2026_EVENT_PATH);
}

export async function updateEventRegistrationStatusAction(registrationId: string, eventId: string, formData: FormData) {
  await assertSameOrigin();
  const session = await requireAdminSession();
  const status = value(formData, "status", 40) as EventRegistrationStatusValue;
  const comment = value(formData, "comment", 1_000) || null;
  if (!EVENT_REGISTRATION_STATUS_VALUES.includes(status)) throw new Error("Недопустимый статус");
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  await db.$transaction(async (transaction) => {
    const current = await transaction.eventRegistration.findUnique({ where: { id: registrationId, eventId }, select: { status: true } });
    if (!current) throw new Error("Регистрация не найдена");
    if (current.status === status) return;
    const updated = await transaction.eventRegistration.updateMany({ where: { id: registrationId, eventId, status: current.status }, data: { status } });
    if (updated.count !== 1) throw new Error("Статус уже изменён другим сотрудником. Обновите страницу");
    await transaction.eventRegistrationStatusHistory.create({ data: { registrationId, adminUserId: session.adminId, fromStatus: current.status, toStatus: status, comment } });
  });
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
}

export async function addEventRegistrationNoteAction(registrationId: string, eventId: string, formData: FormData) {
  await assertSameOrigin();
  const session = await requireAdminSession();
  const text = value(formData, "text", 10_000);
  if (text.length < 2) throw new Error("Заметка слишком короткая");
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  await db.eventRegistrationNote.create({ data: { registrationId, adminUserId: session.adminId, text } });
  revalidatePath(`/admin/events/${eventId}`);
}

export async function retryEventRegistrationNotificationAction(notificationId: string, eventId: string) {
  await assertSameOrigin();
  await requireAdminSession();
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  const notification = await db.eventRegistrationNotification.findUnique({ where: { id: notificationId }, select: { channel: true } });
   if (!notification || !["EMAIL", "GOOGLE_SHEETS"].includes(notification.channel)) throw new Error("Повторить можно только email- или Google Sheets-уведомление");
   if (notification.channel === "EMAIL") await deliverEventRegistrationNotification(notificationId);
   else await deliverGoogleSheetsNotification(notificationId);
  revalidatePath(`/admin/events/${eventId}`);
}
