-- Open only the approved STO-2026 registration flow and add the disabled-by-default
-- Google Sheets outbox channel. No Doctor/Clinic data is changed.

ALTER TYPE "EventRegistrationNotificationChannel" ADD VALUE IF NOT EXISTS 'GOOGLE_SHEETS';

DO $$
DECLARE
  target_event_id TEXT;
BEGIN
  SELECT "id" INTO target_event_id
  FROM "Event"
  WHERE "slug" = 'sovremennye-tehnologii-v-oftalmologii-2026';

  IF target_event_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE "EventConsentTemplate"
  SET "isActive" = false,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "eventId" = target_event_id;

  INSERT INTO "EventConsentTemplate" (
    "id", "eventId", "version", "title", "body", "isActive", "requiresApproval", "createdAt", "updatedAt"
  ) VALUES (
    'sto-2026-event-consent-20260827-v1',
    target_event_id,
    'event-2026-08-27-v1',
    'Согласие на обработку персональных данных для регистрации на конференцию',
    'Согласен(на) на обработку персональных данных для регистрации на конференцию. Политика обработки персональных данных сайта: https://oftalmologia.pro/privacy-policy',
    true,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("eventId", "version") DO UPDATE SET
    "title" = EXCLUDED."title",
    "body" = EXCLUDED."body",
    "isActive" = true,
    "requiresApproval" = false,
    "updatedAt" = CURRENT_TIMESTAMP;

  UPDATE "Event"
  SET "registrationOpen" = true,
      "programPublished" = true,
      "speakersPublished" = true,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = target_event_id;
END $$;
