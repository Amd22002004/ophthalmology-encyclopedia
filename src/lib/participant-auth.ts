import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";
import {
  participantSessionOptions,
  participantSessionIsConfigured,
  type ParticipantSessionData,
} from "./session";
import { getPrisma } from "./prisma";

export async function getParticipantSession() {
  const cookieStore = await cookies();
  return getIronSession<ParticipantSessionData>(
    cookieStore,
    participantSessionOptions,
  );
}

export async function getParticipantUser() {
  const session = await getParticipantSession();
  if (!session.userId) return null;

  const db = getPrisma();
  if (!db) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      doctorLinks: {
        where: { status: "CONFIRMED" },
        include: { doctor: true },
      },
      clinicAccesses: {
        where: { status: "CONFIRMED" },
        include: { clinic: true },
      },
    },
  });

  if (!user || user.status !== "ACTIVE" || user.sessionVersion !== session.sessionVersion) return null;

  return user;
}

export async function requireParticipantUser() {
  const user = await getParticipantUser();
  if (!user) redirect("/auth/login");
  return user;
}

export async function saveParticipantSession(user: {
  id: string;
  email: string;
  sessionVersion: number;
}) {
  if (!participantSessionIsConfigured()) throw new Error("PARTICIPANT_SESSION_SECRET is not configured");
  const session = await getParticipantSession();
  session.userId = user.id;
  session.email = user.email;
  session.sessionVersion = user.sessionVersion;
  await session.save();
}

export async function destroyParticipantSession() {
  const session = await getParticipantSession();
  session.destroy();
}
