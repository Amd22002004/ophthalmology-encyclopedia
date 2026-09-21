import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { EventRegistrationForm } from "./event-registration-form";

test("event registration form is a short one-column form with contact keyboard hints", () => {
  const html = renderToStaticMarkup(React.createElement(EventRegistrationForm));
  assert.match(html, /name="fullName"/);
  assert.match(html, /name="phone"/);
  assert.match(html, /type="tel"/);
  assert.match(html, /name="email"/);
  assert.match(html, /type="email"/);
  assert.match(html, /enterkeyhint="next"/i);
  assert.match(html, /name="consentPersonalData"/);
  assert.match(html, /Согласен\(на\) на обработку персональных данных для регистрации на конференцию\./);
  assert.match(html, /href="\/privacy-policy"/);
  assert.match(html, /name="customSpecialty"/);
  assert.match(html, /Название организации/);
  assert.match(html, /id="event-organization"[^>]*required/);
  assert.match(html, /name="organization"/);
  assert.doesNotMatch(html, /novalidate/i);
  assert.match(html, /Участие бесплатное\. Обязательные поля отмечены .*\*.*\./);
  assert.doesNotMatch(html, /Регистрация не создаёт личный кабинет и не является записью на медицинскую услугу\./);
  assert.doesNotMatch(html, /fullName.*analytics|email.*trackEventAnalytics/i);
});
