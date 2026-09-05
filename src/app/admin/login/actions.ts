"use server";

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type AdminSessionData } from "@/lib/session";
import { findAdminUserByEmail } from "@/lib/admin-auth";
import { normalizeEmail } from "@/lib/auth-security";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const user = await findAdminUserByEmail(email);
  if (!user) {
    return { error: "Неверный email или пароль" };
  }

  const db = getPrisma();
  if (!db) return { error: "Нет подключения к базе данных" };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Неверный email или пароль" };
  }

  await db.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const cookieStore = await cookies();
  const session = await getIronSession<AdminSessionData>(
    cookieStore,
    sessionOptions,
  );
  session.adminId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.sessionVersion = user.sessionVersion;
  await session.save();

  redirect("/admin/dashboard");
}
