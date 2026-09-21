"use server";

import { redirect } from "next/navigation";
import { assertSameOrigin, consumeRateLimit, hashSecret, requestFingerprint } from "@/lib/auth-security";
import { completePasswordReset } from "@/lib/password-reset";

export async function completePasswordResetAction(rawToken: string, formData: FormData) {
  try {
    await assertSameOrigin();
  } catch {
    redirect(`/auth/reset-password/${rawToken}?error=Запрос+отклонён`);
  }
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  if (password.length < 12 || password !== confirmation) redirect(`/auth/reset-password/${rawToken}?error=Проверьте+пароль`);
  const fingerprint = await requestFingerprint("password-reset-complete", hashSecret(rawToken));
  if (!(await consumeRateLimit({ scope: "password-reset-complete", fingerprint, maxAttempts: 5, windowMs: 60 * 60 * 1_000 }))) redirect(`/auth/reset-password/${rawToken}?error=Слишком+много+попыток`);
  try {
    await completePasswordReset(rawToken, password);
  } catch {
    redirect(`/auth/reset-password/${rawToken}?error=Ссылка+недействительна+или+уже+использована`);
  }
  redirect("/auth/login?reset=1");
}
