-- Additive admin auth recovery. Existing AdminUser rows and roles are preserved.

ALTER TABLE "AdminUser" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TYPE "AuthAuditEventType" ADD VALUE 'ADMIN_PASSWORD_RESET_REQUESTED';
ALTER TYPE "AuthAuditEventType" ADD VALUE 'ADMIN_PASSWORD_RESET_SENT';
ALTER TYPE "AuthAuditEventType" ADD VALUE 'ADMIN_PASSWORD_RESET_SEND_FAILED';
ALTER TYPE "AuthAuditEventType" ADD VALUE 'ADMIN_PASSWORD_RESET_COMPLETED';

CREATE TABLE "AdminPasswordResetToken" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminPasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminPasswordResetToken_tokenHash_key"
  ON "AdminPasswordResetToken"("tokenHash");
CREATE INDEX "AdminPasswordResetToken_adminUserId_createdAt_idx"
  ON "AdminPasswordResetToken"("adminUserId", "createdAt");
CREATE INDEX "AdminPasswordResetToken_revokedAt_usedAt_expiresAt_idx"
  ON "AdminPasswordResetToken"("revokedAt", "usedAt", "expiresAt");

ALTER TABLE "AdminPasswordResetToken"
  ADD CONSTRAINT "AdminPasswordResetToken_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
