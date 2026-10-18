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
  formatSto2026Interval,
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

test("STO-2026 follows the approved programme order, times and speaker credentials", () => {
  assert.deepEqual(
    STO_2026_SPEAKERS.map((speaker) => speaker.fullName),
    [
      "Островерхов Александр Иванович",
      "Чиченкова Анна Васильевна",
      "Куницкий Константин Владиславович",
      "Чураков Тимур Касимович",
      "Дубровина Анна Валерьевна",
      "Степанова Ольга Павловна",
      "Хубонов Мурид Хубонович",
    ],
  );
  assert.equal(STO_2026_SPEAKERS[0]?.credentials, "к.м.н., врач-офтальмолог, офтальмохирург");
  assert.equal(STO_2026_SPEAKERS[1]?.credentials, "врач-офтальмолог, офтальмохирург");
  assert.equal(STO_2026_SPEAKERS[3]?.credentials, "к.м.н., врач-офтальмолог, офтальмохирург, рефракционный хирург, г. Санкт-Петербург");
  assert.equal(STO_2026_SPEAKERS[4]?.doctorSlug, null);
  assert.equal(STO_2026_SPEAKERS[4]?.photoUrl, null);
  assert.equal(STO_2026_SPEAKERS[5]?.credentials, "специалист по клинической поддержке компании Alcon");
  assert.equal(STO_2026_SPEAKERS.every((speaker) => speaker.organizationRole === undefined), true);
  assert.equal(STO_2026_SPEAKERS.some((speaker) => speaker.fullName.includes("Евдокимов") || speaker.fullName.includes("Тахтаев")), false);
  assert.equal(STO_2026_SPEAKERS[0]?.photoUrl, "/doctors/ostroverkhov.png");
  assert.equal(existsSync(resolve(process.cwd(), "public/doctors/ostroverkhov.png")), true);

  const talks = STO_2026_PROGRAM.filter((item) => item.kind === "talk");
  assert.equal(talks.length, 12);
  assert.equal(STO_2026_PROGRAM.filter((item) => item.kind === "section").length, 3);
  assert.equal(STO_2026_PROGRAM.filter((item) => item.kind === "discussion").length, 3);
  assert.deepEqual(
    talks.map((talk) => talk.title),
    [
      "Клинический случай YAG лазерной гиалоидопунктуры с консервативным лечением ретинопатии Вальсальвы",
      "Лазерное лечение сетчатки в навигационном режиме (система Navilas)",
      "Лечение кератоконуса, преимущества имплантации роговичных сегментов",
      "Кератотопография Pentacam в диагностике кератоконуса",
      "Преимущества метода Smile Pro, первый год использования VisuMax800 компании ZEISS",
      "Лазерная коррекция зрения после кросслинкинга роговичного коллагена при кератоконусе",
      "Результаты комплексного лечения содружественного косоглазия у взрослых в амбулаторных условиях",
      "Фемто лазерная коррекция зрения",
      "Важность диагностики синдрома сухого глаза на приеме офтальмолога",
      "Лазерная экстракция катаракты. Преимущество системы «Ракот»",
      "Клинический случай имплантации клапана Ahmed при оперированной рефрактерной глаукоме",
      "Кросслинкинг в лечении кератоконуса у детей",
    ],
  );
  assert.equal(talks[1]?.speakerOrder, 2);
  assert.deepEqual(
    STO_2026_PROGRAM.map((item) => formatSto2026Interval(item)),
    [
      "14:00–15:00",
      "15:00–15:15",
      "15:15",
      "15:15–15:30",
      "15:30–15:45",
      "15:45–16:00",
      "16:00–16:15",
      "16:15–16:30",
      "16:30",
      "16:30–16:45",
      "16:45–17:00",
      "17:00–17:10",
      "17:10–17:25",
      "17:25–17:40",
      "17:40",
      "17:40–17:55",
      "17:55–18:05",
      "18:05–18:20",
      "18:20–18:35",
      "18:35–18:45",
      "18:45–19:00",
      "19:00",
    ],
  );
  const opening = STO_2026_PROGRAM.find((item) => item.kind === "opening");
  assert.match(opening?.detail ?? "", /Президента Ассоциации офтальмологических клиник Черных Аллы Сергеевны/);
  assert.match(opening?.detail ?? "", /Американской Академии Офтальмологии/);
  assert.doesNotMatch(opening?.detail ?? "", /Легенда/);
  assert.equal(
    STO_2026_PROGRAM.some((item) => /Alcon|Витреолизис|Макулярный разрыв|Евдокимов/.test(item.title) && item.kind === "talk" && !item.title.includes("сухого глаза")),
    false,
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
