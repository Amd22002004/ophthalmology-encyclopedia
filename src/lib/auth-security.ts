import { createHash, createHmac, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { getPrisma } from "@/lib/prisma";

const LOCAL_RATE_LIMIT_SECRET = "local-development-auth-rate-limit";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function createRawSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashSecret(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function getRateLimitSecret() {
  const secret =
    process.env.AUTH_RATE_LIMIT_SECRET?.trim() ||
    process.env.COOPERATION_RATE_LIMIT_SECRET?.trim() ||
    process.env.APPEAL_RATE_LIMIT_SECRET?.trim() ||
    (process.env.NODE_ENV === "production"
      ? ""
      : process.env.SESSION_SECRET?.trim() || LOCAL_RATE_LIMIT_SECRET);
  if (!secret) throw new Error("AUTH_RATE_LIMIT_SECRET is not configured");
  return secret;
}

export async function assertSameOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost || requestHeaders.get("host");
  const referer = requestHeaders.get("referer");

  let sourceOrigin = origin;
  if (!sourceOrigin && referer) {
    try {
      sourceOrigin = new URL(referer).origin;
    } catch {
      sourceOrigin = null;
    }
  }

  if (!sourceOrigin || !host) throw new Error("Запрос отклонён");
  try {
    if (new URL(sourceOrigin).host.toLowerCase() !== host.toLowerCase()) {
      throw new Error("Запрос отклонён");
    }
  } catch {
    throw new Error("Запрос отклонён");
  }
}

export async function requestFingerprint(scope: string, extra = "") {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip") || "unknown";
  const userAgent = requestHeaders.get("user-agent") || "unknown";
  return createHmac("sha256", getRateLimitSecret())
    .update(`${scope}\n${ip}\n${userAgent}\n${extra}`)
    .digest("hex");
}

export async function consumeRateLimit(params: {
  scope: string;
  fingerprint: string;
  maxAttempts: number;
  windowMs: number;
}) {
  const db = getPrisma();
  if (!db) return false;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + params.windowMs);
  const result = await db.$transaction(async (transaction) => {
    const bucket = await transaction.authRateLimitBucket.findUnique({
      where: {
        scope_fingerprint: {
          scope: params.scope,
          fingerprint: params.fingerprint,
        },
      },
    });

    if (!bucket || bucket.expiresAt <= now) {
      await transaction.authRateLimitBucket.upsert({
        where: {
          scope_fingerprint: {
            scope: params.scope,
            fingerprint: params.fingerprint,
          },
        },
        create: {
          scope: params.scope,
          fingerprint: params.fingerprint,
          windowStartedAt: now,
          expiresAt,
          attempts: 1,
        },
        update: {
          windowStartedAt: now,
          expiresAt,
          attempts: 1,
        },
      });
      return true;
    }

    const updated = await transaction.authRateLimitBucket.updateMany({
      where: {
        id: bucket.id,
        expiresAt: { gt: now },
        attempts: { lt: params.maxAttempts },
      },
      data: { attempts: { increment: 1 } },
    });
    return updated.count === 1;
  });

  return result;
}
