import assert from "node:assert/strict";
import test from "node:test";
import {
  associationAboutContent,
  associationClinicsPage,
  associationDoctorsPage,
  associationHomeContent,
  associationPrinciples,
} from "./association-content";

test("home hero keeps the approved texts verbatim", () => {
  assert.deepEqual(associationHomeContent.hero, {
    title: "Ассоциация офтальмологических клиник",
    subtitle: "Федеральное профессиональное объединение клиник и специалистов",
    directions: "Клиники · Врачи · Наука · Технологии · Нормативная база",
    lead: "Объединяем клиники, знания и специалистов ради повышения качества офтальмологической помощи для пациентов!",
    primaryCta: "Вступить в Ассоциацию",
    secondaryCta: "Клиники-участники",
  });
});

test("association section keeps the approved lead, bridge, mission and five principles", () => {
  const { about } = associationHomeContent;
  assert.equal(
    about.lead,
    "Ассоциация офтальмологических клиник — федеральное профессиональное объединение клиник и специалистов, создающее систему качества, обмена знаниями и совместного развития офтальмологии ради результата для пациента.",
  );
  assert.equal(about.bridge, "Наукой · Клинической практикой · Пациентом");
  assert.equal(
    about.mission,
    "Повышать качество и доступность офтальмологической помощи в России, объединяя клиники и специалистов вокруг единых стандартов качества, знаний и лучших мировых практик ради результата для каждого пациента.",
  );
  assert.deepEqual(
    about.principles,
    [
      "Пациент в центре",
      "Качество и доказательность",
      "Независимость и объективность",
      "Открытость и обмен знаниями",
      "Профессиональная этика",
    ],
  );
});

test("about page principles carry the leaflet explanations verbatim", () => {
  assert.deepEqual(associationAboutContent.ourPrinciples.title, "Наши принципы");
  assert.deepEqual(associationAboutContent.ourPrinciples.items, associationPrinciples);
  assert.deepEqual(
    associationPrinciples.map((principle) => `${principle.title}: ${principle.body}`),
    [
      "Пациент в центре: Безопасность и результат пациента имеют приоритет.",
      "Качество и доказательность: Решения принимаются на основе данных и профессиональной экспертизы.",
      "Независимость и объективность: Ни одна отдельная клиника или коммерческий партнёр не должны определять экспертные решения Ассоциации.",
      "Открытость и обмен знаниями: Полезный опыт должен становиться доступным профессиональному сообществу.",
      "Профессиональная этика: Честная конкуренция, уважение к коллегам и ответственность перед пациентом.",
    ],
  );
  // Шесть правил блока «Как мы работаем с информацией» остаются без изменений.
  assert.equal(associationAboutContent.principles.length, 6);
});

test("home audiences show four benefit titles each and link to the audience pages", () => {
  const { clinics, doctors, caption } = associationHomeContent.audiences;
  assert.deepEqual(clinics.benefits, [
    "Профессиональный профиль",
    "Профессиональная видимость и доверие",
    "Участие в формировании стандартов",
    "Совместные проекты",
  ]);
  assert.deepEqual(doctors.benefits, [
    "Индивидуальный профессиональный профиль",
    "Научное портфолио и профессиональная видимость",
    "Профессиональное сообщество",
    "Возможность влиять на развитие отрасли",
  ]);
  assert.equal(clinics.href, "/cooperation/clinic");
  assert.equal(doctors.href, "/cooperation/doctor");
  assert.equal(caption, "Вместе развиваем офтальмологию, основанную на знаниях и профессиональной ответственности.");
});

test("audience pages have exactly six approved benefits and their closing lines", () => {
  assert.equal(associationClinicsPage.benefits.length, 6);
  assert.equal(associationDoctorsPage.benefits.length, 6);
  assert.equal(associationClinicsPage.closing, "Присоединяйтесь. Участвуйте. Создавайте изменения!");
  assert.equal(associationDoctorsPage.closing, "Знания. Сообщество. Наука. Обмен опытом. Профессиональный рост.");
});

test("join steps and member clinics follow the leaflet", () => {
  const { join, members } = associationHomeContent;
  assert.equal(join.steps.length, 4);
  assert.equal(join.cta, "Заполнить анкету");
  assert.deepEqual(
    members.clinics.map((clinic) => `${clinic.name} (${clinic.city})`),
    [
      "Центр микрохирургии глаза «Визус-1» (Тюмень)",
      "Офтальмологический центр «Визус-1» (Тюмень)",
      "МНТК микрохирургии глаза имени Фёдорова (Екатеринбург)",
      "Центр микрохирургии глаза «Прозрение-Север» (Ноябрьск)",
      "Офтальмологическая клиника «Полярный круг» (Ноябрьск)",
      "Центр микрохирургии глаза «Северное сияние» (Салехард)",
    ],
  );
  assert.equal(members.more, "и др.");
  assert.equal(members.allHref, "/clinics");
});

test("association leader uses the approved Ostroverhov portrait asset", () => {
  const leader = associationAboutContent.leaders.find(
    (candidate) =>
      "profileSlug" in candidate &&
      candidate.profileSlug === "ostroverhov-aleksandr-ivanovich",
  );

  assert.equal(
    leader && "photoUrl" in leader ? leader.photoUrl : undefined,
    "/images/association-people/ostroverhov-aleksandr-ivanovich-mint-bokeh.webp",
  );
});
