"use server";

import { redirect } from "next/navigation";
import { assertSameOrigin, consumeRateLimit, hashSecret, requestFingerprint } from "@/lib/auth-security";
import { completeAdminPasswordReset } from "@/lib/admin-password-reset";
import { buildAdminResetErrorPath } from "@/lib/admin-reset-flow";

export async function completeAdminPasswordResetAction(rawToken: string, formData: FormData) {
  try {
    await assertSameOrigin();
  } catch {
    redirect(buildAdminResetErrorPath(rawToken, "Запрос отклонён"));
  }

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  if (password.length < 12 || password.length > 128 || password !== confirmation) {
    redirect(buildAdminResetErrorPath(rawToken, "Проверьте пароль"));
  }

  const fingerprint = await requestFingerprint("admin-password-reset-complete", hashSecret(rawToken));
  if (!(await consumeRateLimit({ scope: "admin-password-reset-complete", fingerprint, maxAttempts: 5, windowMs: 60 * 60 * 1_000 }))) {
    redirect(buildAdminResetErrorPath(rawToken, "Слишком много попыток"));
  }

  try {
    await completeAdminPasswordReset(rawToken, password);
  } catch {
    redirect(buildAdminResetErrorPath(rawToken, "Ссылка недействительна или уже использована"));
  }

  redirect("/admin/login?reset=1");
}
