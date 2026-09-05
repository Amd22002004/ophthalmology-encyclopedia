-- Additive Event domain. No existing table, column or row is deleted or rewritten.

CREATE TYPE "EventTalkKind" AS ENUM ('TALK', 'BREAK');
CREATE TYPE "EventRegistrationStatus" AS ENUM (
  'NEW', 'CONTACTED', 'CONFIRMED', 'ATTENDED', 'CANCELLED', 'NO_SHOW', 'SPAM'
);
CREATE TYPE "EventRegistrationNotificationKind" AS ENUM ('APPLICANT', 'ASSOCIATION');
CREATE TYPE "EventRegistrationNotificationChannel" AS ENUM ('EMAIL', 'TELEGRAM');
CREATE TYPE "EventRegistrationNotificationType" AS ENUM ('EVENT_REGISTRATION_CREATED');
CREATE TYPE "EventRegistrationNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE "EventTelegramJobKind" AS ENUM ('FULL_EXPORT');
CREATE TYPE "EventTelegramJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

CREATE TABLE "Event" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "organizerName" TEXT NOT NULL,
  "organizerEmail" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "registrationStartsAt" TIMESTAMP(3) NOT NULL,
  "venueName" TEXT NOT NULL,
  "venueAddress" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "registrationOpen" BOOLEAN NOT NULL DEFAULT false,
  "programPublished" BOOLEAN NOT NULL DEFAULT true,
  "speakersPublished" BOOLEAN NOT NULL DEFAULT true,
  "registrationSequence" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventSpeaker" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "doctorId" TEXT,
  "order" INTEGER NOT NULL,
  "fullNameSnapshot" TEXT NOT NULL,
  "credentialsSnapshot" TEXT NOT NULL,
  "organizationRole" TEXT,
  "photoUrlSnapshot" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventSpeaker_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventTalk" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "speakerId" TEXT,
  "kind" "EventTalkKind" NOT NULL DEFAULT 'TALK',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "speakerNameSnapshot" TEXT,
  "moderatorSnapshot" TEXT,
  "startAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "published" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventTalk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventConsentTemplate" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventConsentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventRegistration" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "publicNumber" TEXT NOT NULL,
  "consentTemplateId" TEXT NOT NULL,
  "status" "EventRegistrationStatus" NOT NULL DEFAULT 'NEW',
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "city" TEXT,
  "specialty" TEXT,
  "customSpecialty" TEXT,
  "organization" TEXT,
  "position" TEXT,
  "comment" TEXT,
  "consentAcceptedAt" TIMESTAMP(3) NOT NULL,
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
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventRegistrationStatusHistory" (
  "id" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "adminUserId" TEXT,
  "fromStatus" "EventRegistrationStatus",
  "toStatus" "EventRegistrationStatus" NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventRegistrationStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventRegistrationNote" (
  "id" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventRegistrationNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventRegistrationNotification" (
  "id" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "kind" "EventRegistrationNotificationKind" NOT NULL,
  "channel" "EventRegistrationNotificationChannel" NOT NULL DEFAULT 'EMAIL',
  "type" "EventRegistrationNotificationType" NOT NULL DEFAULT 'EVENT_REGISTRATION_CREATED',
  "idempotencyKey" TEXT,
  "status" "EventRegistrationNotificationStatus" NOT NULL DEFAULT 'PENDING',
  "recipient" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3),
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "sentAt" TIMESTAMP(3),
  "messageId" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventRegistrationNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventTelegramUpdate" (
  "id" TEXT NOT NULL,
  "updateId" BIGINT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "EventTelegramUpdate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventTelegramAuditEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT,
  "registrationId" TEXT,
  "telegramUserId" TEXT,
  "telegramChatId" TEXT,
  "updateId" BIGINT,
  "action" TEXT NOT NULL,
  "deliveryStatus" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventTelegramAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventTelegramJob" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "kind" "EventTelegramJobKind" NOT NULL,
  "status" "EventTelegramJobStatus" NOT NULL DEFAULT 'PENDING',
  "dedupeKey" TEXT NOT NULL,
  "telegramChatId" TEXT NOT NULL,
  "telegramUserId" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventTelegramJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE INDEX "Event_registrationOpen_startsAt_idx" ON "Event"("registrationOpen", "startsAt");
CREATE INDEX "Event_programPublished_speakersPublished_idx" ON "Event"("programPublished", "speakersPublished");
CREATE UNIQUE INDEX "EventSpeaker_eventId_order_key" ON "EventSpeaker"("eventId", "order");
CREATE UNIQUE INDEX "EventSpeaker_eventId_doctorId_key" ON "EventSpeaker"("eventId", "doctorId");
CREATE INDEX "EventSpeaker_eventId_published_order_idx" ON "EventSpeaker"("eventId", "published", "order");
CREATE UNIQUE INDEX "EventTalk_eventId_sortOrder_key" ON "EventTalk"("eventId", "sortOrder");
CREATE INDEX "EventTalk_eventId_published_sortOrder_idx" ON "EventTalk"("eventId", "published", "sortOrder");
CREATE INDEX "EventTalk_speakerId_idx" ON "EventTalk"("speakerId");
CREATE UNIQUE INDEX "EventConsentTemplate_eventId_version_key" ON "EventConsentTemplate"("eventId", "version");
CREATE INDEX "EventConsentTemplate_eventId_isActive_requiresApproval_idx" ON "EventConsentTemplate"("eventId", "isActive", "requiresApproval");
CREATE UNIQUE INDEX "EventRegistration_publicNumber_key" ON "EventRegistration"("publicNumber");
CREATE UNIQUE INDEX "EventRegistration_eventId_email_key" ON "EventRegistration"("eventId", "email");
CREATE UNIQUE INDEX "EventRegistration_eventId_phone_key" ON "EventRegistration"("eventId", "phone");
CREATE UNIQUE INDEX "EventRegistration_eventId_idempotencyKey_key" ON "EventRegistration"("eventId", "idempotencyKey");
CREATE INDEX "EventRegistration_eventId_status_createdAt_idx" ON "EventRegistration"("eventId", "status", "createdAt");
CREATE INDEX "EventRegistration_eventId_city_idx" ON "EventRegistration"("eventId", "city");
CREATE INDEX "EventRegistration_eventId_specialty_idx" ON "EventRegistration"("eventId", "specialty");
CREATE INDEX "EventRegistration_eventId_source_utmCampaign_idx" ON "EventRegistration"("eventId", "source", "utmCampaign");
CREATE INDEX "EventRegistration_requestFingerprint_createdAt_idx" ON "EventRegistration"("requestFingerprint", "createdAt");
CREATE INDEX "EventRegistration_fullName_idx" ON "EventRegistration"("fullName");
CREATE INDEX "EventRegistrationStatusHistory_registrationId_createdAt_idx" ON "EventRegistrationStatusHistory"("registrationId", "createdAt");
CREATE INDEX "EventRegistrationStatusHistory_adminUserId_idx" ON "EventRegistrationStatusHistory"("adminUserId");
CREATE INDEX "EventRegistrationNote_registrationId_createdAt_idx" ON "EventRegistrationNote"("registrationId", "createdAt");
CREATE INDEX "EventRegistrationNote_adminUserId_idx" ON "EventRegistrationNote"("adminUserId");
CREATE UNIQUE INDEX "EventRegistrationNotification_idempotencyKey_key" ON "EventRegistrationNotification"("idempotencyKey");
CREATE UNIQUE INDEX "EventRegistrationNotification_registrationId_channel_kind_type_key" ON "EventRegistrationNotification"("registrationId", "channel", "kind", "type");
CREATE INDEX "EventRegistrationNotification_status_createdAt_idx" ON "EventRegistrationNotification"("status", "createdAt");
CREATE INDEX "EventRegistrationNotification_registrationId_createdAt_idx" ON "EventRegistrationNotification"("registrationId", "createdAt");
CREATE INDEX "EventRegistrationNotification_channel_status_nextAttemptAt_idx" ON "EventRegistrationNotification"("channel", "status", "nextAttemptAt");
CREATE UNIQUE INDEX "EventTelegramUpdate_updateId_key" ON "EventTelegramUpdate"("updateId");
CREATE INDEX "EventTelegramAuditEvent_eventId_createdAt_idx" ON "EventTelegramAuditEvent"("eventId", "createdAt");
CREATE INDEX "EventTelegramAuditEvent_registrationId_createdAt_idx" ON "EventTelegramAuditEvent"("registrationId", "createdAt");
CREATE INDEX "EventTelegramAuditEvent_telegramUserId_createdAt_idx" ON "EventTelegramAuditEvent"("telegramUserId", "createdAt");
CREATE INDEX "EventTelegramAuditEvent_telegramChatId_createdAt_idx" ON "EventTelegramAuditEvent"("telegramChatId", "createdAt");
CREATE INDEX "EventTelegramAuditEvent_action_createdAt_idx" ON "EventTelegramAuditEvent"("action", "createdAt");
CREATE INDEX "EventTelegramJob_eventId_kind_status_requestedAt_idx" ON "EventTelegramJob"("eventId", "kind", "status", "requestedAt");
CREATE INDEX "EventTelegramJob_status_nextAttemptAt_idx" ON "EventTelegramJob"("status", "nextAttemptAt");
CREATE UNIQUE INDEX "EventTelegramJob_dedupeKey_key" ON "EventTelegramJob"("dedupeKey");

ALTER TABLE "EventSpeaker" ADD CONSTRAINT "EventSpeaker_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventSpeaker" ADD CONSTRAINT "EventSpeaker_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventTalk" ADD CONSTRAINT "EventTalk_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventTalk" ADD CONSTRAINT "EventTalk_speakerId_fkey"
  FOREIGN KEY ("speakerId") REFERENCES "EventSpeaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventConsentTemplate" ADD CONSTRAINT "EventConsentTemplate_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_consentTemplateId_fkey"
  FOREIGN KEY ("consentTemplateId") REFERENCES "EventConsentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventRegistrationStatusHistory" ADD CONSTRAINT "EventRegistrationStatusHistory_registrationId_fkey"
  FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRegistrationStatusHistory" ADD CONSTRAINT "EventRegistrationStatusHistory_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventRegistrationNote" ADD CONSTRAINT "EventRegistrationNote_registrationId_fkey"
  FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRegistrationNote" ADD CONSTRAINT "EventRegistrationNote_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventRegistrationNotification" ADD CONSTRAINT "EventRegistrationNotification_registrationId_fkey"
  FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventTelegramAuditEvent" ADD CONSTRAINT "EventTelegramAuditEvent_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventTelegramAuditEvent" ADD CONSTRAINT "EventTelegramAuditEvent_registrationId_fkey"
  FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventTelegramJob" ADD CONSTRAINT "EventTelegramJob_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
