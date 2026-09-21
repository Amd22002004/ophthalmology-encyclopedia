import "server-only";

import bcrypt from "bcryptjs";
import { absoluteUrl } from "@/lib/seo";
import { getPrisma } from "@/lib/prisma";
import { getEmailHeaders } from "@/lib/email/delivery";
import { createRawSecret, hashSecret, normalizeEmail } from "@/lib/auth-security";
import { recordAuthAudit, recordAuthAuditInTransaction } from "@/lib/auth-audit";
import { getCooperationMailer, safeCooperationError } from "@/lib/cooperation/email";
import { ADMIN_PASSWORD_RESET_TTL_MS } from "@/lib/admin-password-reset-constants";

export { ADMIN_PASSWORD_RESET_TTL_MS } from "@/lib/admin-password-reset-constants";

function scrubError(error: unknown, rawToken: string) {
  return safeCooperationError(error).replaceAll(rawToken, "[TOKEN]").slice(0, 1_000);
}

async function findSingleAdmin(emailInput: string) {
  const db = getPrisma();
  const email = normalizeEmail(emailInput);
  if (!db || !email) return { db, email, admin: null };

  const admins = await db.adminUser.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    take: 2,
  });
  return { db, email, admin: admins.length === 1 ? admins[0] : null };
}

export async function requestAdminPasswordReset(emailInput: string) {
  const { db, email, admin } = await findSingleAdmin(emailInput);
  if (!db || !admin || admin.role !== "OWNER") return { sent: false as const };

  const rawToken = createRawSecret();
  const tokenHash = hashSecret(rawToken);
  const expiresAt = new Date(Date.now() + ADMIN_PASSWORD_RESET_TTL_MS);
  const token = await db.$transaction(async (transaction) => {
    const now = new Date();
    await transaction.adminPasswordResetToken.updateMany({
      where: { adminUserId: admin.id, usedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    const created = await transaction.adminPasswordResetToken.create({
      data: { adminUserId: admin.id, tokenHash, expiresAt },
    });
    await recordAuthAuditInTransaction(transaction, {
      eventType: "ADMIN_PASSWORD_RESET_REQUESTED",
      adminUserId: admin.id,
    });
    return created;
  });

  const from = process.env.COOPERATION_SMTP_FROM?.trim() || process.env.APPEAL_SMTP_FROM?.trim();
  let errorMessage: string | null = null;
  let sent = false;
  try {
    const mailer = getCooperationMailer();
    if (!from || !mailer) {
      errorMessage = "Не заполнены SMTP или адрес отправителя";
    } else {
      await mailer.sendMail({
        ...getEmailHeaders(from, from, email),
        to: email,
        subject: "Восстановление доступа в административную панель",
        text: [
          "Для задания нового пароля административной панели откройте ссылку:",
          absoluteUrl(`/admin/reset-password/${rawToken}`),
          "",
          "Ссылка одноразовая и действует 45 минут.",
          "Если вы не запрашивали восстановление, проигнорируйте это письмо.",
        ].join("\n"),
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      sent = true;
    }
  } catch (error) {
    errorMessage = scrubError(error, rawToken);
  }

  await db.adminPasswordResetToken.update({
    where: { id: token.id },
    data: {
      attempts: { increment: 1 },
      ...(sent
        ? { sentAt: new Date(), lastError: null }
        : { lastError: errorMessage || "Не удалось отправить письмо" }),
    },
  });

  await recordAuthAudit({
    eventType: sent ? "ADMIN_PASSWORD_RESET_SENT" : "ADMIN_PASSWORD_RESET_SEND_FAILED",
    adminUserId: admin.id,
    details: sent ? undefined : { error: errorMessage || "Не удалось отправить письмо" },
  });

  return { sent };
}

export async function completeAdminPasswordReset(rawToken: string, password: string) {
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");

  const tokenHash = hashSecret(rawToken);
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  await db.$transaction(async (transaction) => {
    const token = await transaction.adminPasswordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!token || token.usedAt || token.revokedAt || token.expiresAt <= now) {
      throw new Error("Ссылка сброса недействительна или уже использована");
    }

    const consumed = await transaction.adminPasswordResetToken.updateMany({
      where: {
        id: token.id,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) throw new Error("Ссылка сброса уже использована");

    await transaction.adminUser.update({
      where: { id: token.adminUserId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    await transaction.adminPasswordResetToken.updateMany({
      where: {
        adminUserId: token.adminUserId,
        id: { not: token.id },
        usedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });
    await recordAuthAuditInTransaction(transaction, {
      eventType: "ADMIN_PASSWORD_RESET_COMPLETED",
      adminUserId: token.adminUserId,
    });
  });
}
