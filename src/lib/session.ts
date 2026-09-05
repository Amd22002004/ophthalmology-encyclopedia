import type { SessionOptions } from "iron-session";

export interface AdminSessionData {
  adminId: string;
  email: string;
  name: string;
  sessionVersion: number;
}

export interface ParticipantSessionData {
  userId: string;
  email: string;
  sessionVersion: number;
}

export const adminSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 дней
  },
};

const participantSecret =
  process.env.PARTICIPANT_SESSION_SECRET ||
  process.env.SESSION_SECRET ||
  "local-participant-session-secret";

export function participantSessionIsConfigured() {
  return process.env.NODE_ENV !== "production" || Boolean(process.env.PARTICIPANT_SESSION_SECRET?.trim());
}

export const participantSessionOptions: SessionOptions = {
  password: participantSecret,
  cookieName: "participant_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

// Backward-compatible name for the existing admin flow.
export const sessionOptions = adminSessionOptions;
