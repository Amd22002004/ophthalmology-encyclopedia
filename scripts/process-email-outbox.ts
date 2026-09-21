import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.production.local", override: true, quiet: true });

import { getPrisma } from "@/lib/prisma";
import { EMAIL_MAX_ATTEMPTS, EMAIL_POLL_INTERVAL_MS, createEmailWorkerId } from "@/lib/email/delivery";
import { deliverAppealNotification } from "@/lib/appeals/email";
import { deliverCooperationNotification } from "@/lib/cooperation/email";
import { deliverEventRegistrationNotification } from "@/lib/events/registration-email";

const BATCH_SIZE = 10;
let running = true;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processBatch() {
  const db = getPrisma();
  if (!db) throw new Error("DATABASE_URL is not configured");
  const now = new Date();
  const [appeals, cooperation, events] = await Promise.all([
    db.appealNotification.findMany({
      where: {
        status: { in: ["PENDING", "FAILED"] },
        attempts: { lt: EMAIL_MAX_ATTEMPTS },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      select: { id: true },
    }),
    db.cooperationApplicationNotification.findMany({
      where: {
        status: { in: ["PENDING", "FAILED"] },
        attempts: { lt: EMAIL_MAX_ATTEMPTS },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      select: { id: true },
    }),
    db.eventRegistrationNotification.findMany({
      where: {
        channel: "EMAIL",
        status: { in: ["PENDING", "FAILED"] },
        attempts: { lt: EMAIL_MAX_ATTEMPTS },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      select: { id: true },
    }),
  ]);

  const workerId = createEmailWorkerId();
  let processed = 0;
  for (const item of appeals) {
    await deliverAppealNotification(item.id, workerId);
    processed += 1;
  }
  for (const item of cooperation) {
    await deliverCooperationNotification(item.id, workerId);
    processed += 1;
  }
  for (const item of events) {
    await deliverEventRegistrationNotification(item.id, workerId);
    processed += 1;
  }
  return processed;
}

async function main() {
  process.once("SIGTERM", () => { running = false; });
  process.once("SIGINT", () => { running = false; });
  while (running) {
    try {
      await processBatch();
    } catch {
      console.error("Email outbox worker cycle failed");
    }
    if (running) await sleep(EMAIL_POLL_INTERVAL_MS);
  }
}

void main();
