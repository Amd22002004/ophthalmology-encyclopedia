const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export type EmailEnvironment = Record<string, string | undefined>;

export function parseEmailRecipients(value: string | null | undefined) {
  return [...new Set(
    String(value || "")
      .split(/[,;\n]/u)
      .map((item) => item.trim().toLowerCase())
      .filter((item) => EMAIL_PATTERN.test(item)),
  )];
}

export function getInternalNotificationRecipients(env: EmailEnvironment = process.env) {
  const configured = [
    env.AOK_NOTIFICATION_EMAILS,
    env.COOPERATION_NOTIFICATION_EMAIL,
    env.EVENT_NOTIFICATION_EMAIL,
    env.APPEAL_NOTIFICATION_EMAIL,
  ].find((value) => value?.trim());
  return parseEmailRecipients(configured);
}

export function getApplicantNotificationRecipients(email: string | null | undefined) {
  return parseEmailRecipients(email).slice(0, 1);
}

export function getInternalOrLegacyRecipients(
  storedRecipients: string[] | null | undefined,
  legacyRecipient: string | null | undefined,
) {
  const stored = parseEmailRecipients(storedRecipients?.join(","));
  if (stored.length > 0) return stored;
  return [...new Set([
    ...parseEmailRecipients(legacyRecipient),
    ...getInternalNotificationRecipients(),
  ])];
}

export function getEventAssociationNotificationRecipients(
  applicantEmail: string | null | undefined,
  storedRecipients: string[] | null | undefined,
  legacyRecipient: string | null | undefined,
) {
  const applicant = parseEmailRecipients(applicantEmail)[0];
  return getInternalOrLegacyRecipients(storedRecipients, legacyRecipient)
    .filter((recipient) => recipient !== applicant);
}

export function isValidEmail(value: string | null | undefined): value is string {
  return Boolean(value && EMAIL_PATTERN.test(value.trim().toLowerCase()));
}
