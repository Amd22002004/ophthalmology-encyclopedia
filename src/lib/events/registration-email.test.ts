import assert from "node:assert/strict";
import test from "node:test";
import {
  getEventAssociationNotificationRecipients,
  getInternalOrLegacyRecipients,
} from "../email/recipients";
import {
  buildApplicantEventEmail,
  buildAssociationEventEmail,
  formatEventRegistrationDate,
} from "./registration-email-format";
import { getEventEmailHeaders } from "./registration-sender";

test("event registration email formats UTC timestamps in Tyumen time", () => {
  assert.equal(
    formatEventRegistrationDate(new Date("2026-09-08T09:38:00.000Z")),
    "08.09.2026, 14:38",
  );
});

test("event email uses the approved sender identity and reply address", () => {
  assert.deepEqual(getEventEmailHeaders("aok@oftalmologia.pro"), {
    from: "Ассоциация офтальмологических клиник <aok@oftalmologia.pro>",
    replyTo: "aok@oftalmologia.pro",
    envelope: { from: "aok@oftalmologia.pro" },
  });
});

test("event association recipients exclude the applicant but keep other organizers", () => {
  assert.deepEqual(
    getEventAssociationNotificationRecipients(
      "Participant@Example.com",
      ["participant@example.com", "organizer@example.com", "second@example.com"],
      null,
    ),
    ["organizer@example.com", "second@example.com"],
  );
});

test("event-only recipient filtering does not alter the shared resolver", () => {
  const storedRecipients = ["participant@example.com", "organizer@example.com"];

  assert.deepEqual(getInternalOrLegacyRecipients(storedRecipients, null), storedRecipients);
  assert.deepEqual(
    getEventAssociationNotificationRecipients("participant@example.com", storedRecipients, null),
    ["organizer@example.com"],
  );
  assert.deepEqual(
    getEventAssociationNotificationRecipients("participant@example.com", ["participant@example.com"], null),
    [],
  );
});

test("applicant receives one branded confirmation without the submitted comment", () => {
  const email = buildApplicantEventEmail({
    fullName: "Анна Петрова",
    publicNumber: "AOK-EVENT-2026-000012",
  });

  assert.equal(email.subject, "Ваша регистрация получена — №AOK-EVENT-2026-000012");
  assert.equal(
    email.previewText,
    "Конференция 15 октября в Тюмени. Регистрация гостей с 14:00, начало в 15:00.",
  );
  assert.match(email.html, /Ваша регистрация получена/);
  assert.match(email.html, /Программа конференции/);
  assert.match(email.html, /Построить маршрут/);
  assert.match(email.html, /Добавить в календарь/);
  assert.match(email.html, /15 октября 2026 года/);
  assert.match(email.html, /DoubleTree by Hilton Tyumen/);
  assert.match(email.html, /Зал «Сильвер Холл», 2 этаж/);
  assert.match(email.html, /@media only screen and \(max-width: 640px\)/);
  assert.equal((email.html.match(/Сохраните это письмо/gu) || []).length, 1);
  assert.doesNotMatch(email.html.replace(/<[^>]+>/gu, ""), /https:\/\/yandex\.ru\/maps/);
  assert.match(email.text, /Регистрация на конференцию не создаёт личный кабинет/);
  assert.doesNotMatch(email.text, /Комментарий/);
});

test("association email escapes participant input and omits an empty comment block", () => {
  const email = buildAssociationEventEmail({
    fullName: '<img src="x" onerror="alert(1)">',
    publicNumber: "AOK-EVENT-2026-000012",
    phone: "+79991234567",
    email: "participant@example.com",
    organization: "<b>Клиника</b>",
    comment: "</td><script>alert(1)</script>",
  });

  assert.match(email.html, /&lt;img src=&quot;x&quot; onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(email.html, /&lt;b&gt;Клиника&lt;\/b&gt;/);
  assert.match(email.html, /&lt;\/td&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /Комментарий участника/);
  assert.match(email.text, /Комментарий участника:/);

  const withoutComment = buildAssociationEventEmail({
    fullName: "Анна Петрова",
    publicNumber: "AOK-EVENT-2026-000013",
    phone: "+79991234567",
    email: "participant@example.com",
    organization: "Клиника",
    comment: "  ",
  });
  assert.doesNotMatch(withoutComment.html, /Комментарий участника/);
});
