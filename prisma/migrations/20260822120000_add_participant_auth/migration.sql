-- Additive P1.1 participant auth and confirmed catalog access.
-- No existing P0 row is deleted or rewritten.

CREATE TYPE "ParticipantUserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "EntityMatchStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
CREATE TYPE "UserEntityLinkStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
CREATE TYPE "InvitationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE "AuthAuditEventType" AS ENUM (
  'INVITATION_CREATED', 'INVITATION_SENT', 'INVITATION_SEND_FAILED',
  'INVITATION_REISSUED', 'INVITATION_REVOKED', 'INVITATION_ACCEPTED',
  'USER_CREATED', 'EXISTING_USER_LINKED', 'DOCTOR_LINK_PENDING',
  'DOCTOR_LINK_CONFIRMED', 'CLINIC_ACCESS_PENDING', 'CLINIC_ACCESS_CONFIRMED',
  'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED'
);

ALTER TABLE "CooperationApplication" ADD COLUMN "userId" TEXT;

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" "ParticipantUserStatus" NOT NULL DEFAULT 'ACTIVE',
  "emailVerifiedAt" TIMESTAMP(3),
  "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CooperationEntityMatch" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "doctorId" TEXT,
  "clinicId" TEXT,
  "status" "EntityMatchStatus" NOT NULL,
  "confirmedById" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CooperationEntityMatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invitation" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "invitedEmail" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvitationDelivery" (
  "id" TEXT NOT NULL,
  "invitationId" TEXT NOT NULL,
  "status" "InvitationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "recipient" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "messageId" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvitationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserDoctorLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "applicationId" TEXT,
  "status" "UserEntityLinkStatus" NOT NULL DEFAULT 'PENDING',
  "confirmedById" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserDoctorLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserClinicAccess" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "applicationId" TEXT,
  "role" TEXT NOT NULL DEFAULT 'REPRESENTATIVE',
  "status" "UserEntityLinkStatus" NOT NULL DEFAULT 'PENDING',
  "confirmedById" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserClinicAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthRateLimitBucket" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthRateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthAuditEvent" (
  "id" TEXT NOT NULL,
  "eventType" "AuthAuditEventType" NOT NULL,
  "userId" TEXT,
  "adminUserId" TEXT,
  "applicationId" TEXT,
  "invitationId" TEXT,
  "doctorId" TEXT,
  "clinicId" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");
CREATE UNIQUE INDEX "CooperationEntityMatch_applicationId_key" ON "CooperationEntityMatch"("applicationId");
CREATE INDEX "CooperationEntityMatch_doctorId_status_idx" ON "CooperationEntityMatch"("doctorId", "status");
CREATE INDEX "CooperationEntityMatch_clinicId_status_idx" ON "CooperationEntityMatch"("clinicId", "status");
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX "Invitation_applicationId_createdAt_idx" ON "Invitation"("applicationId", "createdAt");
CREATE INDEX "Invitation_invitedEmail_expiresAt_idx" ON "Invitation"("invitedEmail", "expiresAt");
CREATE INDEX "Invitation_revokedAt_usedAt_expiresAt_idx" ON "Invitation"("revokedAt", "usedAt", "expiresAt");
CREATE UNIQUE INDEX "InvitationDelivery_invitationId_key" ON "InvitationDelivery"("invitationId");
CREATE INDEX "InvitationDelivery_status_createdAt_idx" ON "InvitationDelivery"("status", "createdAt");
CREATE UNIQUE INDEX "UserDoctorLink_userId_doctorId_key" ON "UserDoctorLink"("userId", "doctorId");
CREATE INDEX "UserDoctorLink_doctorId_status_idx" ON "UserDoctorLink"("doctorId", "status");
CREATE INDEX "UserDoctorLink_applicationId_idx" ON "UserDoctorLink"("applicationId");
CREATE UNIQUE INDEX "UserClinicAccess_userId_clinicId_key" ON "UserClinicAccess"("userId", "clinicId");
CREATE INDEX "UserClinicAccess_clinicId_status_idx" ON "UserClinicAccess"("clinicId", "status");
CREATE INDEX "UserClinicAccess_applicationId_idx" ON "UserClinicAccess"("applicationId");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_createdAt_idx" ON "PasswordResetToken"("userId", "createdAt");
CREATE INDEX "PasswordResetToken_revokedAt_usedAt_expiresAt_idx" ON "PasswordResetToken"("revokedAt", "usedAt", "expiresAt");
CREATE UNIQUE INDEX "AuthRateLimitBucket_scope_fingerprint_key" ON "AuthRateLimitBucket"("scope", "fingerprint");
CREATE INDEX "AuthRateLimitBucket_expiresAt_idx" ON "AuthRateLimitBucket"("expiresAt");
CREATE INDEX "AuthAuditEvent_eventType_createdAt_idx" ON "AuthAuditEvent"("eventType", "createdAt");
CREATE INDEX "AuthAuditEvent_userId_createdAt_idx" ON "AuthAuditEvent"("userId", "createdAt");
CREATE INDEX "AuthAuditEvent_applicationId_createdAt_idx" ON "AuthAuditEvent"("applicationId", "createdAt");
CREATE INDEX "AuthAuditEvent_invitationId_createdAt_idx" ON "AuthAuditEvent"("invitationId", "createdAt");

ALTER TABLE "CooperationApplication" ADD CONSTRAINT "CooperationApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooperationEntityMatch" ADD CONSTRAINT "CooperationEntityMatch_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CooperationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CooperationEntityMatch" ADD CONSTRAINT "CooperationEntityMatch_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooperationEntityMatch" ADD CONSTRAINT "CooperationEntityMatch_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooperationEntityMatch" ADD CONSTRAINT "CooperationEntityMatch_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CooperationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvitationDelivery" ADD CONSTRAINT "InvitationDelivery_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDoctorLink" ADD CONSTRAINT "UserDoctorLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDoctorLink" ADD CONSTRAINT "UserDoctorLink_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDoctorLink" ADD CONSTRAINT "UserDoctorLink_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CooperationApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserDoctorLink" ADD CONSTRAINT "UserDoctorLink_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserClinicAccess" ADD CONSTRAINT "UserClinicAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserClinicAccess" ADD CONSTRAINT "UserClinicAccess_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserClinicAccess" ADD CONSTRAINT "UserClinicAccess_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CooperationApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserClinicAccess" ADD CONSTRAINT "UserClinicAccess_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthAuditEvent" ADD CONSTRAINT "AuthAuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuthAuditEvent" ADD CONSTRAINT "AuthAuditEvent_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuthAuditEvent" ADD CONSTRAINT "AuthAuditEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CooperationApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuthAuditEvent" ADD CONSTRAINT "AuthAuditEvent_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuthAuditEvent" ADD CONSTRAINT "AuthAuditEvent_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuthAuditEvent" ADD CONSTRAINT "AuthAuditEvent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
