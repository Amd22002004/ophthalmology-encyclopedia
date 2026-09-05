-- Publish the approved STO-2026 event dataset without running the global seed.
-- This migration is additive/idempotent and does not change Doctor or Clinic.

DO $$
DECLARE
  target_event_id TEXT;
  kunitskiy_id TEXT;
  churakov_id TEXT;
  ostroverhov_id TEXT;
  evdokimov_id TEXT;
  chichenkova_id TEXT;
  hubonov_id TEXT;
  kunitskiy_speaker_id TEXT;
  churakov_speaker_id TEXT;
  ostroverhov_speaker_id TEXT;
  evdokimov_speaker_id TEXT;
  chichenkova_speaker_id TEXT;
  hubonov_speaker_id TEXT;
BEGIN
  SELECT "id" INTO kunitskiy_id FROM "Doctor" WHERE "slug" = 'kunitskiy-konstantin-vladislavovich';
  SELECT "id" INTO churakov_id FROM "Doctor" WHERE "slug" = 'churakov-timur-kasimovich';
  SELECT "id" INTO ostroverhov_id FROM "Doctor" WHERE "slug" = 'ostroverhov-aleksandr-ivanovich';
  SELECT "id" INTO evdokimov_id FROM "Doctor" WHERE "slug" = 'evdokimov-georgiy-vyacheslavovich';
  SELECT "id" INTO chichenkova_id FROM "Doctor" WHERE "slug" = 'chichenkova-anna-vasilevna';
  SELECT "id" INTO hubonov_id FROM "Doctor" WHERE "slug" = 'hubonov-murid-hubonovich';

  IF kunitskiy_id IS NULL OR churakov_id IS NULL OR ostroverhov_id IS NULL
    OR evdokimov_id IS NULL OR chichenkova_id IS NULL OR hubonov_id IS NULL THEN
    RAISE EXCEPTION 'STO-2026 requires all six approved Doctor records';
  END IF;

  INSERT INTO "Event" (
    "id", "slug", "title", "description", "organizerName", "organizerEmail",
    "startsAt", "registrationStartsAt", "venueName", "venueAddress", "city",
    "registrationOpen", "programPublished", "speakersPublished", "createdAt", "updatedAt"
  ) VALUES (
    'sto-2026-event',
    'sovremennye-tehnologii-v-oftalmologii-2026',
    'Современные технологии в офтальмологии',
    'Конференция объединит врачей-офтальмологов и офтальмохирургов для обсуждения современных технологий диагностики и хирургического лечения заболеваний органа зрения.',
    'Ассоциация офтальмологических клиник',
    'aok@oftalmologia.pro',
    TIMESTAMPTZ '2026-10-15 10:00:00+00',
    TIMESTAMPTZ '2026-10-15 09:00:00+00',
    'DoubleTree by Hilton Tyumen',
    'г. Тюмень, ул. Орджоникидзе, 46',
    'Тюмень',
    true,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("slug") DO UPDATE SET
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "organizerName" = EXCLUDED."organizerName",
    "organizerEmail" = EXCLUDED."organizerEmail",
    "startsAt" = EXCLUDED."startsAt",
    "registrationStartsAt" = EXCLUDED."registrationStartsAt",
    "venueName" = EXCLUDED."venueName",
    "venueAddress" = EXCLUDED."venueAddress",
    "city" = EXCLUDED."city",
    "registrationOpen" = EXCLUDED."registrationOpen",
    "programPublished" = EXCLUDED."programPublished",
    "speakersPublished" = EXCLUDED."speakersPublished",
    "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO target_event_id;

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

  INSERT INTO "EventSpeaker" (
    "id", "eventId", "doctorId", "order", "fullNameSnapshot", "credentialsSnapshot", "organizationRole", "photoUrlSnapshot", "published", "createdAt", "updatedAt"
  ) VALUES (
    'sto-2026-event-speaker-1', target_event_id, kunitskiy_id, 1, 'Куницкий Константин Владиславович', 'Заведующий рефракционным отделением, врач-офтальмолог, офтальмохирург', NULL, '/doctors/kunitskiy.png', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) ON CONFLICT ("eventId", "order") DO UPDATE SET
    "doctorId" = EXCLUDED."doctorId", "fullNameSnapshot" = EXCLUDED."fullNameSnapshot", "credentialsSnapshot" = EXCLUDED."credentialsSnapshot", "organizationRole" = EXCLUDED."organizationRole", "photoUrlSnapshot" = EXCLUDED."photoUrlSnapshot", "published" = EXCLUDED."published", "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO kunitskiy_speaker_id;

  INSERT INTO "EventSpeaker" (
    "id", "eventId", "doctorId", "order", "fullNameSnapshot", "credentialsSnapshot", "organizationRole", "photoUrlSnapshot", "published", "createdAt", "updatedAt"
  ) VALUES (
    'sto-2026-event-speaker-2', target_event_id, churakov_id, 2, 'Чураков Тимур Касимович', 'Кандидат медицинских наук, врач-офтальмолог, офтальмохирург, рефракционный хирург', NULL, '/doctors/churakov-timur-kasimovich.webp', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) ON CONFLICT ("eventId", "order") DO UPDATE SET
    "doctorId" = EXCLUDED."doctorId", "fullNameSnapshot" = EXCLUDED."fullNameSnapshot", "credentialsSnapshot" = EXCLUDED."credentialsSnapshot", "organizationRole" = EXCLUDED."organizationRole", "photoUrlSnapshot" = EXCLUDED."photoUrlSnapshot", "published" = EXCLUDED."published", "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO churakov_speaker_id;

  INSERT INTO "EventSpeaker" (
    "id", "eventId", "doctorId", "order", "fullNameSnapshot", "credentialsSnapshot", "organizationRole", "photoUrlSnapshot", "published", "createdAt", "updatedAt"
  ) VALUES (
    'sto-2026-event-speaker-3', target_event_id, ostroverhov_id, 3, 'Островерхов Александр Иванович', 'Кандидат медицинских наук, врач-офтальмолог, офтальмохирург', 'Главный специалист Ассоциации офтальмологических клиник', '/doctors/ostroverkhov.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) ON CONFLICT ("eventId", "order") DO UPDATE SET
    "doctorId" = EXCLUDED."doctorId", "fullNameSnapshot" = EXCLUDED."fullNameSnapshot", "credentialsSnapshot" = EXCLUDED."credentialsSnapshot", "organizationRole" = EXCLUDED."organizationRole", "photoUrlSnapshot" = EXCLUDED."photoUrlSnapshot", "published" = EXCLUDED."published", "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO ostroverhov_speaker_id;

  INSERT INTO "EventSpeaker" (
    "id", "eventId", "doctorId", "order", "fullNameSnapshot", "credentialsSnapshot", "organizationRole", "photoUrlSnapshot", "published", "createdAt", "updatedAt"
  ) VALUES (
    'sto-2026-event-speaker-4', target_event_id, evdokimov_id, 4, 'Евдокимов Георгий Вячеславович', 'Заведующий микрохирургическим отделением, врач-офтальмолог, офтальмохирург', NULL, '/doctors/evdokimov.png', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) ON CONFLICT ("eventId", "order") DO UPDATE SET
    "doctorId" = EXCLUDED."doctorId", "fullNameSnapshot" = EXCLUDED."fullNameSnapshot", "credentialsSnapshot" = EXCLUDED."credentialsSnapshot", "organizationRole" = EXCLUDED."organizationRole", "photoUrlSnapshot" = EXCLUDED."photoUrlSnapshot", "published" = EXCLUDED."published", "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO evdokimov_speaker_id;

  INSERT INTO "EventSpeaker" (
    "id", "eventId", "doctorId", "order", "fullNameSnapshot", "credentialsSnapshot", "organizationRole", "photoUrlSnapshot", "published", "createdAt", "updatedAt"
  ) VALUES (
    'sto-2026-event-speaker-5', target_event_id, chichenkova_id, 5, 'Чиченкова Анна Васильевна', 'Врач-офтальмолог первой категории, офтальмохирург, лазерный хирург', NULL, '/doctors/chichenkova.png', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) ON CONFLICT ("eventId", "order") DO UPDATE SET
    "doctorId" = EXCLUDED."doctorId", "fullNameSnapshot" = EXCLUDED."fullNameSnapshot", "credentialsSnapshot" = EXCLUDED."credentialsSnapshot", "organizationRole" = EXCLUDED."organizationRole", "photoUrlSnapshot" = EXCLUDED."photoUrlSnapshot", "published" = EXCLUDED."published", "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO chichenkova_speaker_id;

  INSERT INTO "EventSpeaker" (
    "id", "eventId", "doctorId", "order", "fullNameSnapshot", "credentialsSnapshot", "organizationRole", "photoUrlSnapshot", "published", "createdAt", "updatedAt"
  ) VALUES (
    'sto-2026-event-speaker-6', target_event_id, hubonov_id, 6, 'Хубонов Мурид Хубонович', 'Врач-офтальмолог, офтальмохирург', NULL, '/doctors/khubonov.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) ON CONFLICT ("eventId", "order") DO UPDATE SET
    "doctorId" = EXCLUDED."doctorId", "fullNameSnapshot" = EXCLUDED."fullNameSnapshot", "credentialsSnapshot" = EXCLUDED."credentialsSnapshot", "organizationRole" = EXCLUDED."organizationRole", "photoUrlSnapshot" = EXCLUDED."photoUrlSnapshot", "published" = EXCLUDED."published", "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO hubonov_speaker_id;

  INSERT INTO "EventTalk" ("id", "eventId", "speakerId", "kind", "title", "speakerNameSnapshot", "startAt", "endAt", "published", "sortOrder", "createdAt", "updatedAt") VALUES
    ('sto-2026-event-talk-1', target_event_id, kunitskiy_speaker_id, 'TALK', 'Лечение кератоконуса: преимущества имплантации роговичных сегментов', 'Куницкий Константин Владиславович', NULL, NULL, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('sto-2026-event-talk-2', target_event_id, kunitskiy_speaker_id, 'TALK', 'Лазерное лечение сетчатки в навигационном режиме — система NAVILAS', 'Куницкий Константин Владиславович', NULL, NULL, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('sto-2026-event-talk-3', target_event_id, kunitskiy_speaker_id, 'TALK', 'Преимущества метода SMILE Pro: первый год использования ZEISS VisuMax 800', 'Куницкий Константин Владиславович', NULL, NULL, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('sto-2026-event-talk-4', target_event_id, churakov_speaker_id, 'TALK', 'Лазерная коррекция зрения после кросслинкинга роговичного коллагена при кератоконусе', 'Чураков Тимур Касимович', NULL, NULL, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('sto-2026-event-talk-5', target_event_id, churakov_speaker_id, 'TALK', 'Кератотопография Pentacam в диагностике кератоконуса', 'Чураков Тимур Касимович', NULL, NULL, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('sto-2026-event-talk-6', target_event_id, churakov_speaker_id, 'TALK', 'Кросслинкинг в лечении кератоконуса у детей', 'Чураков Тимур Касимович', NULL, NULL, true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('sto-2026-event-talk-7', target_event_id, ostroverhov_speaker_id, 'TALK', 'Клинический случай YAG-лазерной гиалоидопунктуры с консервативным лечением ретинопатии Вальсальвы', 'Островерхов Александр Иванович', NULL, NULL, true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('sto-2026-event-talk-8', target_event_id, ostroverhov_speaker_id, 'TALK', 'Результаты комплексного лечения содружественного косоглазия у взрослых в амбулаторных условиях', 'Островерхов Александр Иванович', NULL, NULL, true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('sto-2026-event-talk-9', target_event_id, ostroverhov_speaker_id, 'TALK', 'Клинический случай имплантации клапана Ahmed при оперированной рефрактерной глаукоме', 'Островерхов Александр Иванович', NULL, NULL, true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('sto-2026-event-talk-10', target_event_id, evdokimov_speaker_id, 'TALK', 'Макулярный разрыв. Катаракта', 'Евдокимов Георгий Вячеславович', NULL, NULL, true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('sto-2026-event-talk-11', target_event_id, chichenkova_speaker_id, 'TALK', 'Деструкция стекловидного тела. Витреолизис', 'Чиченкова Анна Васильевна', NULL, NULL, true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('sto-2026-event-talk-12', target_event_id, hubonov_speaker_id, 'TALK', 'Лазерная экстракция катаракты. Преимущества системы «Ракот»', 'Хубонов Мурид Хубонович', NULL, NULL, true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("eventId", "sortOrder") DO UPDATE SET
    "speakerId" = EXCLUDED."speakerId",
    "kind" = EXCLUDED."kind",
    "title" = EXCLUDED."title",
    "speakerNameSnapshot" = EXCLUDED."speakerNameSnapshot",
    "startAt" = NULL,
    "endAt" = NULL,
    "published" = EXCLUDED."published",
    "updatedAt" = CURRENT_TIMESTAMP;
END $$;
