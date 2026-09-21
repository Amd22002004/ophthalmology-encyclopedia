"use server";

import { assertSameOrigin, consumeRateLimit, normalizeEmail, requestFingerprint } from "@/lib/auth-security";
import { requestPasswordReset } from "@/lib/password-reset";

export type PasswordResetRequestState = { submitted?: boolean; error?: string };

export async function requestPasswordResetAction(
  _previous: PasswordResetRequestState,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  try {
    await assertSameOrigin();
  } catch {
    return { error: "Запрос отклонён" };
  }
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return { error: "Введите email" };
  const fingerprint = await requestFingerprint("password-reset", email);
  if (!(await consumeRateLimit({ scope: "password-reset", fingerprint, maxAttempts: 4, windowMs: 60 * 60 * 1_000 }))) return { error: "Слишком много запросов. Повторите позднее" };
  await requestPasswordReset(email);
  return { submitted: true };
}
