import { absoluteUrl } from "@/lib/seo";
import { getPrisma } from "@/lib/prisma";
import { getCooperationMailer, safeCooperationError } from "@/lib/cooperation/email";

function scrubError(error: unknown, rawToken: string) {
  return safeCooperationError(error).replaceAll(rawToken, "[TOKEN]").slice(0, 1_000);
}

export async function deliverInvitationEmail(invitationId: string, rawToken: string) {
  const db = getPrisma();
  if (!db) return { sent: false as const, error: "Database unavailable" };

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: { application: true, delivery: true },
  });
  if (!invitation || !invitation.delivery) return { sent: false as const, error: "Invitation not found" };

  const attemptedAt = new Date();
  const from = process.env.COOPERATION_SMTP_FROM?.trim() || process.env.APPEAL_SMTP_FROM?.trim();
  const recipient = invitation.invitedEmail;
  const invitationUrl = absoluteUrl(`/invitation/${rawToken}`);
  let mailer: ReturnType<typeof getCooperationMailer>;
  try {
    mailer = getCooperationMailer();
  } catch (error) {
    const message = scrubError(error, rawToken);
    await db.invitationDelivery.update({ where: { invitationId }, data: { status: "FAILED", attempts: { increment: 1 }, lastAttemptAt: attemptedAt, lastError: message } });
    await db.authAuditEvent.create({ data: { eventType: "INVITATION_SEND_FAILED", applicationId: invitation.applicationId, invitationId, details: { error: message } } });
    return { sent: false as const, error: message };
  }

  if (!from || !mailer) {
    const message = "Не заполнены SMTP или адрес отправителя";
    await db.invitationDelivery.update({ where: { invitationId }, data: { status: "FAILED", attempts: { increment: 1 }, lastAttemptAt: attemptedAt, lastError: message } });
    await db.authAuditEvent.create({ data: { eventType: "INVITATION_SEND_FAILED", applicationId: invitation.applicationId, invitationId, details: { error: message } } });
    return { sent: false as const, error: message };
  }

  try {
    const info = await mailer.sendMail({
      from,
      to: recipient,
      subject: "Приглашение в личный кабинет Ассоциации",
      text: [
        "Ассоциация офтальмологических клиник подготовила для вас приглашение в личный кабинет.",
        "",
        `Открыть приглашение: ${invitationUrl}`,
        "",
        "Ссылка одноразовая и действует ограниченное время.",
        "Если вы не ожидали это письмо, обратитесь в Ассоциацию и не передавайте ссылку третьим лицам.",
      ].join("\n"),
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    await db.invitationDelivery.update({ where: { invitationId }, data: { status: "SENT", attempts: { increment: 1 }, lastAttemptAt: attemptedAt, sentAt: new Date(), messageId: info.messageId, lastError: null } });
    await db.authAuditEvent.create({ data: { eventType: "INVITATION_SENT", applicationId: invitation.applicationId, invitationId } });
    return { sent: true as const };
  } catch (error) {
    const message = scrubError(error, rawToken);
    await db.invitationDelivery.update({ where: { invitationId }, data: { status: "FAILED", attempts: { increment: 1 }, lastAttemptAt: attemptedAt, lastError: message } });
    await db.authAuditEvent.create({ data: { eventType: "INVITATION_SEND_FAILED", applicationId: invitation.applicationId, invitationId, details: { error: message } } });
    return { sent: false as const, error: message };
  }
}
