import bcrypt from "bcryptjs";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "./prisma";
import {
  createRawSecret,
  hashSecret,
  normalizeEmail,
} from "./auth-security";
import { recordAuthAuditInTransaction } from "./auth-audit";

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export class InvitationFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationFlowError";
  }
}

type InvitationRecord = Prisma.InvitationGetPayload<{
  include: {
    application: { include: { entityMatch: { include: { doctor: true; clinic: true } } } };
  };
}>;

export function invitationIsUsable(
  invitation: Pick<InvitationRecord, "expiresAt" | "usedAt" | "revokedAt">,
  now = new Date(),
) {
  return !invitation.usedAt && !invitation.revokedAt && invitation.expiresAt > now;
}

export async function getInvitationByToken(rawToken: string) {
  const db = getPrisma();
  if (!db || !rawToken) return null;
  const invitation = await db.invitation.findUnique({
    where: { tokenHash: hashSecret(rawToken) },
    include: {
      application: {
        include: {
          entityMatch: {
            include: {
              doctor: { select: { id: true, slug: true, firstName: true, lastName: true, middleName: true } },
              clinic: { select: { id: true, slug: true, title: true } },
            },
          },
        },
      },
    },
  });
  return invitation;
}

export async function createInvitation(params: {
  applicationId: string;
  adminUserId: string;
  reissueInvitationId?: string;
}) {
  const db = getPrisma();
  if (!db) throw new InvitationFlowError("Нет подключения к базе данных");

  const rawToken = createRawSecret();
  const tokenHash = hashSecret(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);

  const invitation = await db.$transaction(async (transaction) => {
    const application = await transaction.cooperationApplication.findUnique({
      where: { id: params.applicationId },
      include: { entityMatch: true },
    });
    if (!application) throw new InvitationFlowError("Заявка не найдена");
    if (!["APPROVED", "INVITED", "PROFILE_REVIEW"].includes(application.status)) {
      throw new InvitationFlowError("Сначала переведите заявку в статус «Одобрена»");
    }
    if (application.userId) {
      throw new InvitationFlowError("У заявки уже есть связанный пользователь");
    }

    const activeInvitations = await transaction.invitation.findMany({
      where: { applicationId: application.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
      select: { id: true },
    });
    if (activeInvitations.length) {
      await transaction.invitation.updateMany({
        where: { id: { in: activeInvitations.map((item) => item.id) } },
        data: { revokedAt: now },
      });
      for (const previous of activeInvitations) {
        await recordAuthAuditInTransaction(transaction, {
          eventType: "INVITATION_REVOKED",
          adminUserId: params.adminUserId,
          applicationId: application.id,
          invitationId: previous.id,
          details: { reason: "reissue" },
        });
      }
    }

    const created = await transaction.invitation.create({
      data: {
        applicationId: application.id,
        invitedEmail: normalizeEmail(application.email),
        tokenHash,
        expiresAt,
        createdById: params.adminUserId,
        delivery: { create: { recipient: normalizeEmail(application.email) } },
      },
    });

    await recordAuthAuditInTransaction(transaction, {
      eventType: params.reissueInvitationId ? "INVITATION_REISSUED" : "INVITATION_CREATED",
      adminUserId: params.adminUserId,
      applicationId: application.id,
      invitationId: created.id,
      details: { expiresAt: expiresAt.toISOString() },
    });

    if (application.status === "APPROVED") {
      await transaction.cooperationApplication.update({
        where: { id: application.id },
        data: {
          status: "INVITED",
          statusHistory: {
            create: {
              fromStatus: "APPROVED",
              toStatus: "INVITED",
              adminUserId: params.adminUserId,
              comment: "Приглашение создано",
            },
          },
        },
      });
    }

    return created;
  });

  return { invitation, rawToken };
}

export async function revokeInvitation(invitationId: string, adminUserId: string) {
  const db = getPrisma();
  if (!db) throw new InvitationFlowError("Нет подключения к базе данных");
  const now = new Date();
  const updated = await db.invitation.updateMany({
    where: { id: invitationId, usedAt: null, revokedAt: null },
    data: { revokedAt: now },
  });
  if (updated.count !== 1) return false;
  const invitation = await db.invitation.findUnique({ where: { id: invitationId }, select: { applicationId: true } });
  await db.authAuditEvent.create({
    data: {
      eventType: "INVITATION_REVOKED",
      adminUserId,
      applicationId: invitation?.applicationId,
      invitationId,
    },
  });
  return true;
}

async function createOrKeepDoctorLink(
  transaction: Prisma.TransactionClient,
  params: { userId: string; doctorId: string; applicationId: string; confirmedById: string | null; status: "PENDING" | "CONFIRMED" },
) {
  const existing = await transaction.userDoctorLink.findUnique({ where: { userId_doctorId: { userId: params.userId, doctorId: params.doctorId } } });
  if (existing?.status === "CONFIRMED") return existing;
  const link = existing
    ? await transaction.userDoctorLink.update({ where: { id: existing.id }, data: { applicationId: params.applicationId, status: params.status, confirmedById: params.confirmedById, confirmedAt: params.status === "CONFIRMED" ? new Date() : null } })
    : await transaction.userDoctorLink.create({ data: { userId: params.userId, doctorId: params.doctorId, applicationId: params.applicationId, status: params.status, confirmedById: params.confirmedById, confirmedAt: params.status === "CONFIRMED" ? new Date() : null } });
  await recordAuthAuditInTransaction(transaction, {
    eventType: params.status === "CONFIRMED" ? "DOCTOR_LINK_CONFIRMED" : "DOCTOR_LINK_PENDING",
    userId: params.userId,
    applicationId: params.applicationId,
    doctorId: params.doctorId,
    details: { status: params.status },
  });
  return link;
}

async function createOrKeepClinicAccess(
  transaction: Prisma.TransactionClient,
  params: { userId: string; clinicId: string; applicationId: string; confirmedById: string | null; status: "PENDING" | "CONFIRMED" },
) {
  const existing = await transaction.userClinicAccess.findUnique({ where: { userId_clinicId: { userId: params.userId, clinicId: params.clinicId } } });
  if (existing?.status === "CONFIRMED") return existing;
  const access = existing
    ? await transaction.userClinicAccess.update({ where: { id: existing.id }, data: { applicationId: params.applicationId, status: params.status, confirmedById: params.confirmedById, confirmedAt: params.status === "CONFIRMED" ? new Date() : null } })
    : await transaction.userClinicAccess.create({ data: { userId: params.userId, clinicId: params.clinicId, applicationId: params.applicationId, status: params.status, confirmedById: params.confirmedById, confirmedAt: params.status === "CONFIRMED" ? new Date() : null } });
  await recordAuthAuditInTransaction(transaction, {
    eventType: params.status === "CONFIRMED" ? "CLINIC_ACCESS_CONFIRMED" : "CLINIC_ACCESS_PENDING",
    userId: params.userId,
    applicationId: params.applicationId,
    clinicId: params.clinicId,
    details: { status: params.status },
  });
  return access;
}

export async function acceptInvitation(params: {
  rawToken: string;
  existingUserId?: string;
  newUser?: { displayName: string; password: string };
}) {
  const db = getPrisma();
  if (!db) throw new InvitationFlowError("Нет подключения к базе данных");
  const tokenHash = hashSecret(params.rawToken);
  const passwordHash = params.newUser ? await bcrypt.hash(params.newUser.password, 12) : null;

  const user = await db.$transaction(async (transaction) => {
    const invitation = await transaction.invitation.findUnique({
      where: { tokenHash },
      include: { application: { include: { entityMatch: true } } },
    });
    if (!invitation || !invitationIsUsable(invitation)) throw new InvitationFlowError("Приглашение недействительно или уже использовано");

    let account = params.existingUserId
      ? await transaction.user.findUnique({ where: { id: params.existingUserId } })
      : null;
    if (params.existingUserId && (!account || account.email !== normalizeEmail(invitation.invitedEmail))) {
      throw new InvitationFlowError("Войти по этому приглашению можно только аккаунтом с указанным email");
    }

    if (!account) {
      if (!params.newUser || !passwordHash) throw new InvitationFlowError("Для нового пользователя нужны имя и пароль");
      const existingByEmail = await transaction.user.findUnique({ where: { email: normalizeEmail(invitation.invitedEmail) } });
      if (existingByEmail) throw new InvitationFlowError("Для этого email уже есть аккаунт. Войдите в него и повторите принятие приглашения");
      account = await transaction.user.create({
        data: {
          email: normalizeEmail(invitation.invitedEmail),
          passwordHash,
          displayName: params.newUser.displayName,
          emailVerifiedAt: new Date(),
        },
      });
      await recordAuthAuditInTransaction(transaction, { eventType: "USER_CREATED", userId: account.id, applicationId: invitation.applicationId });
    } else {
      if (account.status !== "ACTIVE") throw new InvitationFlowError("Аккаунт временно заблокирован");
      await recordAuthAuditInTransaction(transaction, { eventType: "EXISTING_USER_LINKED", userId: account.id, applicationId: invitation.applicationId });
    }

    const consumed = await transaction.invitation.updateMany({
      where: { id: invitation.id, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) throw new InvitationFlowError("Приглашение уже принято другим запросом");

    const applicationUpdate = await transaction.cooperationApplication.updateMany({
      where: { id: invitation.applicationId, userId: null },
      data: { userId: account.id },
    });
    if (applicationUpdate.count !== 1) throw new InvitationFlowError("Заявка уже связана с другим пользователем");

    const match = invitation.application.entityMatch;
    if (match?.status === "CONFIRMED" || match?.status === "PENDING") {
      if (invitation.application.participantType === "DOCTOR" && match.doctorId) {
        await createOrKeepDoctorLink(transaction, {
          userId: account.id,
          doctorId: match.doctorId,
          applicationId: invitation.applicationId,
          confirmedById: match.status === "CONFIRMED" ? match.confirmedById : null,
          status: match.status,
        });
      }
      if (invitation.application.participantType === "CLINIC" && match.clinicId) {
        await createOrKeepClinicAccess(transaction, {
          userId: account.id,
          clinicId: match.clinicId,
          applicationId: invitation.applicationId,
          confirmedById: match.status === "CONFIRMED" ? match.confirmedById : null,
          status: match.status,
        });
      }
    }

    await recordAuthAuditInTransaction(transaction, {
      eventType: "INVITATION_ACCEPTED",
      userId: account.id,
      applicationId: invitation.applicationId,
      invitationId: invitation.id,
    });
    return account;
  });

  return user;
}

export async function confirmDoctorLink(linkId: string, adminUserId: string) {
  const db = getPrisma();
  if (!db) throw new InvitationFlowError("Нет подключения к базе данных");
  const link = await db.userDoctorLink.updateMany({ where: { id: linkId, status: "PENDING" }, data: { status: "CONFIRMED", confirmedById: adminUserId, confirmedAt: new Date() } });
  if (link.count !== 1) return false;
  const current = await db.userDoctorLink.findUnique({ where: { id: linkId }, select: { userId: true, doctorId: true, applicationId: true } });
  if (current) await db.authAuditEvent.create({ data: { eventType: "DOCTOR_LINK_CONFIRMED", adminUserId, userId: current.userId, doctorId: current.doctorId, applicationId: current.applicationId, details: { status: "CONFIRMED" } } });
  return true;
}

export async function confirmClinicAccess(accessId: string, adminUserId: string) {
  const db = getPrisma();
  if (!db) throw new InvitationFlowError("Нет подключения к базе данных");
  const access = await db.userClinicAccess.updateMany({ where: { id: accessId, status: "PENDING" }, data: { status: "CONFIRMED", confirmedById: adminUserId, confirmedAt: new Date() } });
  if (access.count !== 1) return false;
  const current = await db.userClinicAccess.findUnique({ where: { id: accessId }, select: { userId: true, clinicId: true, applicationId: true } });
  if (current) await db.authAuditEvent.create({ data: { eventType: "CLINIC_ACCESS_CONFIRMED", adminUserId, userId: current.userId, clinicId: current.clinicId, applicationId: current.applicationId, details: { status: "CONFIRMED" } } });
  return true;
}

export async function setEntityMatch(params: {
  applicationId: string;
  adminUserId: string;
  entityId: string;
  status: "PENDING" | "CONFIRMED";
}) {
  const db = getPrisma();
  if (!db) throw new InvitationFlowError("Нет подключения к базе данных");
  await db.$transaction(async (transaction) => {
    const application = await transaction.cooperationApplication.findUnique({ where: { id: params.applicationId }, select: { participantType: true, userId: true } });
    if (!application) throw new InvitationFlowError("Заявка не найдена");
    if (application.userId) throw new InvitationFlowError("После принятия приглашения соответствие меняется через access review");
    const data: Prisma.CooperationEntityMatchUncheckedCreateInput = {
      applicationId: params.applicationId,
      status: params.status,
      confirmedById: params.status === "CONFIRMED" ? params.adminUserId : null,
      confirmedAt: params.status === "CONFIRMED" ? new Date() : null,
      doctorId: application.participantType === "DOCTOR" ? params.entityId : null,
      clinicId: application.participantType === "CLINIC" ? params.entityId : null,
    };
    if (application.participantType === "DOCTOR") {
      if (!(await transaction.doctor.findUnique({ where: { id: params.entityId }, select: { id: true } }))) throw new InvitationFlowError("Врач не найден");
    } else if (application.participantType === "CLINIC") {
      if (!(await transaction.clinic.findUnique({ where: { id: params.entityId }, select: { id: true } }))) throw new InvitationFlowError("Клиника не найдена");
    } else {
      throw new InvitationFlowError("Для партнёра связь с Doctor или Clinic не применяется");
    }
    await transaction.cooperationEntityMatch.upsert({ where: { applicationId: params.applicationId }, create: data, update: { ...data, applicationId: undefined } });
  });
}
