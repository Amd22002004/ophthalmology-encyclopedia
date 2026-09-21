import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type AdminSessionData } from "./session";
import { redirect } from "next/navigation";
import { getPrisma } from "./prisma";
import { normalizeEmail } from "./auth-security";

export async function getAdminSession() {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, sessionOptions);
}

export async function findAdminUserByEmail(emailInput: string) {
  const db = getPrisma();
  const email = normalizeEmail(emailInput);
  if (!db || !email) return null;

  const users = await db.adminUser.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    take: 2,
  });

  return users.length === 1 ? users[0] : null;
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session.adminId) {
    redirect("/admin/login");
  }

  const db = getPrisma();
  const user = db
    ? await db.adminUser.findUnique({
        where: { id: session.adminId },
        select: { id: true, role: true, sessionVersion: true },
      })
    : null;

  if (!user || user.role !== "OWNER" || user.sessionVersion !== (session.sessionVersion ?? 0)) {
    redirect("/admin/login");
  }

  return session;
}
