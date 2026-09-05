import bcrypt from "bcryptjs";
import { absoluteUrl } from "@/lib/seo";
import { getPrisma } from "@/lib/prisma";
import { getCooperationMailer, safeCooperationError } from "@/lib/cooperation/email";
import { createRawSecret, hashSecret, normalizeEmail } from "./auth-security";
import { PASSWORD_RESET_TTL_MS } from "./invitations";
import { recordAuthAuditInTransaction } from "./auth-audit";

function scrubError(error: unknown, rawToken: string) {
  return safeCooperationError(error).replaceAll(rawToken, "[TOKEN]").slice(0, 1_000);
}

export async function requestPasswordReset(emailInput: string) {
  const db = getPrisma();
  if (!db) return;
  const email = normalizeEmail(emailInput);
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return;

  const rawToken = createRawSecret();
  const tokenHash = hashSecret(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  const token = await db.$transaction(async (transaction) => {
    await transaction.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
    const created = await transaction.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
    await recordAuthAuditInTransaction(transaction, { eventType: "PASSWORD_RESET_REQUESTED", userId: user.id });
    return created;
  });

  const from = process.env.COOPERATION_SMTP_FROM?.trim() || process.env.APPEAL_SMTP_FROM?.trim();
  let errorMessage: string | null = null;
  try {
    const mailer = getCooperationMailer();
    if (!from || !mailer) {
      errorMessage = "Не заполнены SMTP или адрес отправителя";
    } else {
      await mailer.sendMail({
        from,
        to: email,
        subject: "Сброс пароля личного кабинета",
        text: [
          "Для сброса пароля откройте ссылку:",
          absoluteUrl(`/auth/reset-password/${rawToken}`),
          "",
          "Ссылка одноразовая и действует ограниченное время.",
          "Если вы не запрашивали сброс, просто проигнорируйте это письмо.",
        ].join("\n"),
        disableFileAccess: true,
        disableUrlAccess: true,
      });
    }
  } catch (error) {
    errorMessage = scrubError(error, rawToken);
  }

  await db.passwordResetToken.update({
    where: { id: token.id },
    data: {
      attempts: { increment: 1 },
      ...(errorMessage ? { lastError: errorMessage } : { sentAt: new Date(), lastError: null }),
    },
  });
}

export async function completePasswordReset(rawToken: string, password: string) {
  const db = getPrisma();
  if (!db) throw new Error("Нет подключения к базе данных");
  const tokenHash = hashSecret(rawToken);
  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction(async (transaction) => {
    const token = await transaction.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!token || token.usedAt || token.revokedAt || token.expiresAt <= new Date()) {
      throw new Error("Ссылка сброса недействительна или уже использована");
    }
    const consumed = await transaction.passwordResetToken.updateMany({ where: { id: token.id, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
    if (consumed.count !== 1) throw new Error("Ссылка сброса уже использована");
    await transaction.user.update({ where: { id: token.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });
    await recordAuthAuditInTransaction(transaction, { eventType: "PASSWORD_RESET_COMPLETED", userId: token.userId });
  });
}
