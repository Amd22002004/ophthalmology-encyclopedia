import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  STO_2026_EVENT,
  STO_2026_EVENT_PATH,
  STO_2026_PROGRAM,
  STO_2026_QR_PATH,
  STO_2026_REGISTER_PATH,
  STO_2026_SPEAKERS,
  eventAnalyticsPayload,
  getSTO2026PublicTopicTitle,
} from "./sto-2026";

test("STO-2026 keeps the approved local event times", () => {
  assert.equal(STO_2026_EVENT.slug, "sovremennye-tehnologii-v-oftalmologii-2026");
  assert.equal(STO_2026_EVENT.registrationStartsAt, "2026-10-15T14:00:00+05:00");
  assert.equal(STO_2026_EVENT.startsAt, "2026-10-15T15:00:00+05:00");
  assert.equal(STO_2026_EVENT.registrationOpen, true);
  assert.equal(STO_2026_EVENT.programPublished, true);
  assert.equal(STO_2026_EVENT.speakersPublished, true);
  assert.equal(STO_2026_EVENT_PATH, "/events/sovremennye-tehnologii-v-oftalmologii-2026");
  assert.equal(STO_2026_REGISTER_PATH, `${STO_2026_EVENT_PATH}/register`);
  assert.equal(STO_2026_QR_PATH, "/e/sto-2026");
});

test("STO-2026 exposes six speakers and twelve untimed topics in source order", () => {
  assert.deepEqual(
    STO_2026_SPEAKERS.map((speaker) => speaker.fullName),
    [
      "Куницкий Константин Владиславович",
      "Чураков Тимур Касимович",
      "Островерхов Александр Иванович",
      "Евдокимов Георгий Вячеславович",
      "Чиченкова Анна Васильевна",
      "Хубонов Мурид Хубонович",
    ],
  );
  assert.equal(STO_2026_SPEAKERS.length, 6);
  assert.equal(STO_2026_SPEAKERS[2]?.photoUrl, "/doctors/ostroverkhov.png");
  assert.equal(existsSync(resolve(process.cwd(), "public/doctors/ostroverkhov.png")), true);
  assert.equal(STO_2026_PROGRAM.length, 12);
  assert.ok(STO_2026_PROGRAM.every((talk) => talk.startTime === null && talk.endTime === null));
  assert.deepEqual(
    STO_2026_PROGRAM.map((talk) => talk.title),
    [
      "Лечение кератоконуса: преимущества имплантации роговичных сегментов",
      "Лазерное лечение сетчатки в навигационном режиме — система NAVILAS",
      "Преимущества метода SMILE Pro: первый год использования ZEISS VisuMax 800",
      "Лазерная коррекция зрения после кросслинкинга роговичного коллагена при кератоконусе",
      "Кератотопография Pentacam в диагностике кератоконуса",
      "Кросслинкинг в лечении кератоконуса у детей",
      "Клинический случай YAG-лазерной гиалоидопунктуры с консервативным лечением ретинопатии Вальсальвы",
      "Результаты комплексного лечения содружественного косоглазия у взрослых в амбулаторных условиях",
      "Клинический случай имплантации клапана Ahmed при оперированной рефрактерной глаукоме",
      "Возможности коррекции зрения с помощью современных интраокулярных линз компании Alcon",
      "Деструкция стекловидного тела. Витреолизис",
      "Лазерная экстракция катаракты. Преимущества системы «Ракот»",
    ],
  );
  assert.ok(STO_2026_SPEAKERS.every((speaker) => speaker.photoUrl.startsWith("/doctors/")));
  assert.ok(STO_2026_SPEAKERS.every((speaker) => speaker.doctorSlug));
});

test("STO-2026 uses the approved DOCX wording for the public Evdokimov topic", () => {
  assert.equal(
    getSTO2026PublicTopicTitle("Макулярный разрыв. Катаракта"),
    "Возможности коррекции зрения с помощью современных интраокулярных линз компании Alcon",
  );
  assert.equal(
    getSTO2026PublicTopicTitle("Кератотопография Pentacam в диагностике кератоконуса"),
    "Кератотопография Pentacam в диагностике кератоконуса",
  );
});

test("event analytics payload has no personal data", () => {
  const payload = eventAnalyticsPayload("event_speaker_opened", {
    eventSlug: STO_2026_EVENT.slug,
    speakerOrder: 2,
    source: "PRINT_QR",
    utmCampaign: "conference_invitation_2026",
    email: "person@example.com",
    phone: "+70000000000",
    fullName: "Не отправлять",
  });

  assert.deepEqual(payload, {
    event: "event_speaker_opened",
    eventSlug: STO_2026_EVENT.slug,
    speakerOrder: 2,
    source: "PRINT_QR",
    utmCampaign: "conference_invitation_2026",
  });
});
