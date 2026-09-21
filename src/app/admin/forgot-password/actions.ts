"use server";

import { assertSameOrigin, consumeRateLimit, normalizeEmail, requestFingerprint } from "@/lib/auth-security";
import { requestAdminPasswordReset } from "@/lib/admin-password-reset";

export type AdminPasswordResetRequestState = { submitted?: boolean; error?: string };

export async function requestAdminPasswordResetAction(
  _previous: AdminPasswordResetRequestState,
  formData: FormData,
): Promise<AdminPasswordResetRequestState> {
  try {
    await assertSameOrigin();
  } catch {
    return { error: "Запрос отклонён" };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return { error: "Введите email" };

  const fingerprint = await requestFingerprint("admin-password-reset", email);
  if (!(await consumeRateLimit({ scope: "admin-password-reset", fingerprint, maxAttempts: 4, windowMs: 60 * 60 * 1_000 }))) {
    return { error: "Слишком много запросов. Повторите позднее" };
  }

  await requestAdminPasswordReset(email);
  return { submitted: true };
}
