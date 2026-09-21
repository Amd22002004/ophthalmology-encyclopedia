import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.production.local", override: true, quiet: true });

import { getPrisma } from "@/lib/prisma";
import { getInternalNotificationRecipients, parseEmailRecipients } from "@/lib/email/recipients";
import { getPendingEmailRecipients } from "@/lib/email/delivery";

const apply = process.argv.includes("--apply");

function planRow(row: {
  status: string;
  recipient: string | null;
  recipients: string[];
  deliveredRecipients: string[];
}, internalRecipients: string[]) {
  const storedRecipients = parseEmailRecipients(row.recipients.join(","));
  const legacyRecipients = parseEmailRecipients(row.recipient);
  const recipients = [...new Set([...storedRecipients, ...legacyRecipients, ...internalRecipients])];
  const deliveredRecipients = row.status === "SENT" && row.deliveredRecipients.length === 0
    ? legacyRecipients
    : parseEmailRecipients(row.deliveredRecipients.join(","));
  const pendingRecipients = getPendingEmailRecipients(recipients, deliveredRecipients);
  return { recipients, deliveredRecipients, pendingRecipients };
}

async function main() {
  const db = getPrisma();
  if (!db) throw new Error("DATABASE_URL is not configured");
  const internalRecipients = getInternalNotificationRecipients();
  if (internalRecipients.length === 0) throw new Error("AOK_NOTIFICATION_EMAILS is not configured");

  const [appeals, cooperation, events] = await Promise.all([
    db.appealNotification.findMany({ select: { id: true, status: true, recipient: true, recipients: true, deliveredRecipients: true } }),
    db.cooperationApplicationNotification.findMany({ where: { kind: "ASSOCIATION" }, select: { id: true, status: true, recipient: true, recipients: true, deliveredRecipients: true } }),
    db.eventRegistrationNotification.findMany({ where: { channel: "EMAIL", kind: "ASSOCIATION" }, select: { id: true, status: true, recipient: true, recipients: true, deliveredRecipients: true } }),
  ]);
  const rows = [...appeals, ...cooperation, ...events];
  const plans = rows.map((row) => ({ row, plan: planRow(row, internalRecipients) }));
  const pending = plans.filter(({ plan }) => plan.pendingRecipients.length > 0);
  const pendingAppeals = appeals.map((row) => ({ row, plan: planRow(row, internalRecipients) })).filter(({ plan }) => plan.pendingRecipients.length > 0);
  const pendingCooperation = cooperation.map((row) => ({ row, plan: planRow(row, internalRecipients) })).filter(({ plan }) => plan.pendingRecipients.length > 0);
  const pendingEvents = events.map((row) => ({ row, plan: planRow(row, internalRecipients) })).filter(({ plan }) => plan.pendingRecipients.length > 0);

  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", inspected: rows.length, pending: pending.length, recipientsToQueue: pending.reduce((sum, item) => sum + item.plan.pendingRecipients.length, 0) }));
  if (!apply || pending.length === 0) return;

  const now = new Date();
  await db.$transaction(async (tx) => {
    for (const { row, plan } of pendingAppeals) {
      await tx.appealNotification.update({
        where: { id: row.id },
        data: {
          recipients: plan.recipients,
          deliveredRecipients: plan.deliveredRecipients,
          status: "PENDING",
          nextAttemptAt: now,
          lockedAt: null,
          lockedBy: null,
        },
      });
    }
    for (const { row, plan } of pendingCooperation) {
      await tx.cooperationApplicationNotification.update({
        where: { id: row.id },
        data: {
          recipients: plan.recipients,
          deliveredRecipients: plan.deliveredRecipients,
          status: "PENDING",
          nextAttemptAt: now,
          lockedAt: null,
          lockedBy: null,
        },
      });
    }
    for (const { row, plan } of pendingEvents) {
      await tx.eventRegistrationNotification.update({
        where: { id: row.id },
        data: {
          recipients: plan.recipients,
          deliveredRecipients: plan.deliveredRecipients,
          status: "PENDING",
          nextAttemptAt: now,
          lockedAt: null,
          lockedBy: null,
        },
      });
    }
  });
}

void main().catch(() => {
  console.error("Email backlog requeue failed");
  process.exitCode = 1;
});
