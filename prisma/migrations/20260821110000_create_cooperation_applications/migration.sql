-- CreateEnum
CREATE TYPE "CooperationParticipantType" AS ENUM ('CLINIC', 'DOCTOR', 'PARTNER');

-- CreateEnum
CREATE TYPE "CooperationApplicationStatus" AS ENUM ('NEW', 'IN_REVIEW', 'NEED_INFO', 'APPROVED', 'INVITED', 'PROFILE_REVIEW', 'ACTIVE', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CooperationNotificationKind" AS ENUM ('APPLICANT', 'ASSOCIATION');

-- CreateEnum
CREATE TYPE "CooperationNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "CooperationApplication" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "participantType" "CooperationParticipantType" NOT NULL,
    "applicationType" TEXT,
    "status" "CooperationApplicationStatus" NOT NULL DEFAULT 'NEW',
    "organizationName" TEXT,
    "inn" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "middleName" TEXT,
    "contactName" TEXT,
    "contactPosition" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "city" TEXT,
    "region" TEXT,
    "website" TEXT,
    "workplace" TEXT,
    "customWorkplace" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "academicDegree" TEXT,
    "professionalUrl" TEXT,
    "partnerType" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "message" TEXT,
    "consentPersonalData" BOOLEAN NOT NULL,
    "consentMarketing" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "landingUrl" TEXT,
    "pageTitle" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "requestFingerprint" TEXT,
    "idempotencyKey" TEXT,
    "responsibleUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperationApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "CooperationApplicationStatus",
    "toStatus" "CooperationApplicationStatus" NOT NULL,
    "adminUserId" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CooperationApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperationApplicationNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperationApplicationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperationApplicationNotification" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" "CooperationNotificationKind" NOT NULL,
    "status" "CooperationNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "recipient" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "messageId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperationApplicationNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperationApplicationAttachment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CooperationApplicationAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CooperationApplication_applicationNumber_key" ON "CooperationApplication"("applicationNumber");
CREATE UNIQUE INDEX "CooperationApplication_idempotencyKey_key" ON "CooperationApplication"("idempotencyKey");
CREATE INDEX "CooperationApplication_status_createdAt_idx" ON "CooperationApplication"("status", "createdAt");
CREATE INDEX "CooperationApplication_participantType_createdAt_idx" ON "CooperationApplication"("participantType", "createdAt");
CREATE INDEX "CooperationApplication_city_region_idx" ON "CooperationApplication"("city", "region");
CREATE INDEX "CooperationApplication_source_utmCampaign_idx" ON "CooperationApplication"("source", "utmCampaign");
CREATE INDEX "CooperationApplication_requestFingerprint_createdAt_idx" ON "CooperationApplication"("requestFingerprint", "createdAt");
CREATE INDEX "CooperationApplication_email_idx" ON "CooperationApplication"("email");
CREATE INDEX "CooperationApplication_phone_idx" ON "CooperationApplication"("phone");
CREATE INDEX "CooperationApplication_inn_idx" ON "CooperationApplication"("inn");
CREATE INDEX "CooperationApplication_lastName_firstName_idx" ON "CooperationApplication"("lastName", "firstName");
CREATE INDEX "CooperationApplication_organizationName_idx" ON "CooperationApplication"("organizationName");
CREATE INDEX "CooperationApplicationStatusHistory_applicationId_createdAt_idx" ON "CooperationApplicationStatusHistory"("applicationId", "createdAt");
CREATE INDEX "CooperationApplicationStatusHistory_adminUserId_idx" ON "CooperationApplicationStatusHistory"("adminUserId");
CREATE INDEX "CooperationApplicationNote_applicationId_createdAt_idx" ON "CooperationApplicationNote"("applicationId", "createdAt");
CREATE INDEX "CooperationApplicationNote_adminUserId_idx" ON "CooperationApplicationNote"("adminUserId");
CREATE INDEX "CooperationApplicationNotification_status_createdAt_idx" ON "CooperationApplicationNotification"("status", "createdAt");
CREATE INDEX "CooperationApplicationNotification_applicationId_createdAt_idx" ON "CooperationApplicationNotification"("applicationId", "createdAt");
CREATE UNIQUE INDEX "CooperationApplicationNotification_applicationId_kind_key" ON "CooperationApplicationNotification"("applicationId", "kind");
CREATE UNIQUE INDEX "CooperationApplicationAttachment_applicationId_key" ON "CooperationApplicationAttachment"("applicationId");
CREATE UNIQUE INDEX "CooperationApplicationAttachment_storageKey_key" ON "CooperationApplicationAttachment"("storageKey");

-- AddForeignKey
ALTER TABLE "CooperationApplication" ADD CONSTRAINT "CooperationApplication_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooperationApplicationStatusHistory" ADD CONSTRAINT "CooperationApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CooperationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CooperationApplicationStatusHistory" ADD CONSTRAINT "CooperationApplicationStatusHistory_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooperationApplicationNote" ADD CONSTRAINT "CooperationApplicationNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CooperationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CooperationApplicationNote" ADD CONSTRAINT "CooperationApplicationNote_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CooperationApplicationNotification" ADD CONSTRAINT "CooperationApplicationNotification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CooperationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CooperationApplicationAttachment" ADD CONSTRAINT "CooperationApplicationAttachment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CooperationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
