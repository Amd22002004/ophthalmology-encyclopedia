-- Additive delivery state for per-recipient email retries.
ALTER TABLE "AppealNotification"
  ADD COLUMN "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "deliveredRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "lockedBy" TEXT;

ALTER TABLE "CooperationApplicationNotification"
  ADD COLUMN "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "deliveredRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "lockedBy" TEXT;

ALTER TABLE "EventRegistrationNotification"
  ADD COLUMN "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "deliveredRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "AppealNotification_status_nextAttemptAt_idx"
  ON "AppealNotification"("status", "nextAttemptAt");

CREATE INDEX "CooperationApplicationNotification_status_nextAttemptAt_idx"
  ON "CooperationApplicationNotification"("status", "nextAttemptAt");
