import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type AdminSessionData } from "./session";
import { redirect } from "next/navigation";

export async function getAdminSession() {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, sessionOptions);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session.adminId) {
    redirect("/admin/login");
  }
  return session;
}
