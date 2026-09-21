"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { acceptInvitation, InvitationFlowError } from "@/lib/invitations";
import { assertSameOrigin, consumeRateLimit, hashSecret, normalizeEmail, requestFingerprint } from "@/lib/auth-security";
import { getParticipantUser, saveParticipantSession } from "@/lib/participant-auth";

function back(rawToken: string, message: string): never {
  redirect(`/invitation/${rawToken}?error=${encodeURIComponent(message)}`);
}

async function protect(rawToken: string) {
  try {
    await assertSameOrigin();
  } catch {
    back(rawToken, "Запрос отклонён");
  }
  const fingerprint = await requestFingerprint("invitation-accept", hashSecret(rawToken));
  if (!(await consumeRateLimit({ scope: "invitation-accept", fingerprint, maxAttempts: 6, windowMs: 60 * 60 * 1_000 }))) back(rawToken, "Слишком много попыток");
}

export async function acceptNewInvitationAction(rawToken: string, formData: FormData) {
  await protect(rawToken);
  const displayName = String(formData.get("displayName") ?? "").trim().slice(0, 120);
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  if (displayName.length < 2 || password.length < 12 || password !== confirmation) back(rawToken, "Проверьте имя и пароль");
  let user;
  try {
    user = await acceptInvitation({ rawToken, newUser: { displayName, password } });
  } catch (error) {
    back(rawToken, error instanceof InvitationFlowError ? error.message : "Не удалось принять приглашение");
  }
  try {
    await saveParticipantSession(user);
  } catch {
    back(rawToken, "Не удалось открыть сессию кабинета");
  }
  redirect("/cabinet");
}

export async function acceptExistingInvitationAction(rawToken: string, formData: FormData) {
  await protect(rawToken);
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const db = getPrisma();
  if (!db) back(rawToken, "Нет подключения к базе данных");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(password, user.passwordHash))) back(rawToken, "Неверный email или пароль");
  let accepted;
  try {
    accepted = await acceptInvitation({ rawToken, existingUserId: user.id });
  } catch (error) {
    back(rawToken, error instanceof InvitationFlowError ? error.message : "Не удалось принять приглашение");
  }
  try {
    await saveParticipantSession(accepted);
  } catch {
    back(rawToken, "Не удалось открыть сессию кабинета");
  }
  redirect("/cabinet");
}

export async function acceptForCurrentUserAction(rawToken: string) {
  await protect(rawToken);
  const user = await getParticipantUser();
  if (!user) back(rawToken, "Сначала войдите в личный кабинет");
  let accepted;
  try {
    accepted = await acceptInvitation({ rawToken, existingUserId: user.id });
  } catch (error) {
    back(rawToken, error instanceof InvitationFlowError ? error.message : "Не удалось принять приглашение");
  }
  try {
    await saveParticipantSession(accepted);
  } catch {
    back(rawToken, "Не удалось открыть сессию кабинета");
  }
  redirect("/cabinet");
}
