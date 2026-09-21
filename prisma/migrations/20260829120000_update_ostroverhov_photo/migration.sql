-- Scoped, idempotent asset replacement for one Doctor and the approved STO-2026 snapshot.
-- No entities, relationships or unrelated doctor photos are changed.

UPDATE "Doctor"
SET "photoUrl" = '/doctors/ostroverkhov.png',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'ostroverhov-aleksandr-ivanovich'
  AND "photoUrl" IS DISTINCT FROM '/doctors/ostroverkhov.png';

UPDATE "EventSpeaker" AS speaker
SET "photoUrlSnapshot" = '/doctors/ostroverkhov.png',
    "updatedAt" = CURRENT_TIMESTAMP
FROM "Doctor" AS doctor, "Event" AS event
WHERE speaker."doctorId" = doctor."id"
  AND doctor."slug" = 'ostroverhov-aleksandr-ivanovich'
  AND event."slug" = 'sovremennye-tehnologii-v-oftalmologii-2026'
  AND speaker."photoUrlSnapshot" IS DISTINCT FROM '/doctors/ostroverkhov.png';
