import assert from "node:assert/strict";
import test from "node:test";
import {
  associationAboutContent,
  associationHomeContent,
  associationPillars,
} from "./association-content";

test("home positioning names the association as the platform brand", () => {
  assert.equal(associationHomeContent.hero.title, "Объединяем клиники, врачей и технологии");
  assert.equal(associationHomeContent.hero.eyebrow, "ПРОФЕССИОНАЛЬНАЯ СРЕДА ОФТАЛЬМОЛОГИИ");
  assert.match(associationHomeContent.hero.description, /обмена клиническим опытом/);
  assert.equal(
    associationHomeContent.hero.mobileDescription,
    "Ассоциация объединяет клиники и специалистов для обмена опытом, профессионального развития и внедрения современных технологий.",
  );
  assert.match(associationHomeContent.encyclopedia.body, /структурированную информацию о заболеваниях/);
});

test("association home has the four approved pillars", () => {
  assert.deepEqual(
    associationPillars.map((pillar) => pillar.title),
    ["КЛИНИКИ", "ВРАЧИ", "ПРОФЕССИОНАЛЬНЫЕ ЗНАНИЯ", "ТЕХНОЛОГИИ И ПАРТНЁРСТВО"],
  );
});

test("association leader uses the approved Ostroverhov portrait asset", () => {
  const leader = associationAboutContent.leaders.find(
    (candidate) =>
      "profileSlug" in candidate &&
      candidate.profileSlug === "ostroverhov-aleksandr-ivanovich",
  );

  assert.equal(
    leader && "photoUrl" in leader ? leader.photoUrl : undefined,
    "/doctors/ostroverkhov.png",
  );
});
