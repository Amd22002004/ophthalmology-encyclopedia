"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { assertSameOrigin, consumeRateLimit, normalizeEmail, requestFingerprint } from "@/lib/auth-security";
import { saveParticipantSession } from "@/lib/participant-auth";

export type ParticipantLoginState = { error?: string };

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/auth/login") ? next : "/cabinet";
}

export async function participantLoginAction(
  _previous: ParticipantLoginState,
  formData: FormData,
): Promise<ParticipantLoginState> {
  try {
    await assertSameOrigin();
  } catch {
    return { error: "Запрос отклонён" };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Введите email и пароль" };

  const db = getPrisma();
  if (!db) return { error: "Нет подключения к базе данных" };
  const fingerprint = await requestFingerprint("participant-login", email);
  if (!(await consumeRateLimit({ scope: "participant-login", fingerprint, maxAttempts: 8, windowMs: 15 * 60 * 1_000 }))) {
    return { error: "Слишком много попыток. Повторите позднее" };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Неверный email или пароль" };
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await saveParticipantSession(user);
  redirect(safeNext(formData.get("next")));
}

export async function participantLogoutAction() {
  try {
    await assertSameOrigin();
  } catch {
    return;
  }
  const { destroyParticipantSession } = await import("@/lib/participant-auth");
  await destroyParticipantSession();
  redirect("/auth/login");
}
