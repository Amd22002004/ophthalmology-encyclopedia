import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { CooperationApplicationForm } from "./cooperation-application-form";
import { CooperationLanding } from "./cooperation-landing";

const tracking = {
  source: "WEB",
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  landingUrl: "https://oftalmologia.pro/cooperation",
  referrer: null,
  pageTitle: "Сотрудничество — Ассоциация офтальмологических клиник",
};

test("cooperation roles expose separate mobile disclosure controls without nested buttons", () => {
  const html = renderToStaticMarkup(
    React.createElement(CooperationLanding, { tracking }),
  );

  assert.equal((html.match(/data-cooperation-role=/g) || []).length, 3);
  assert.equal((html.match(/data-cooperation-role-toggle=/g) || []).length, 3);
  assert.equal((html.match(/aria-expanded="false"/g) || []).length, 3);
  assert.equal((html.match(/aria-controls="cooperation-role-details-/g) || []).length, 3);
  assert.equal((html.match(/size-11/g) || []).length, 3);
  assert.match(html, /<button[^>]+aria-pressed="false"[^>]+type="button"/);
  assert.match(html, /aria-label="Показать описание"/);
  assert.match(html, /Выбрать формат/);
  assert.doesNotMatch(html, /Регистрация клиники|Регистрация врача|Регистрация поставщика/);
  assert.doesNotMatch(html, /id="cooperation-application"/);

  const buttonTags = html.match(/<\/?button\b[^>]*>/g) || [];
  let buttonDepth = 0;
  for (const tag of buttonTags) {
    if (tag.startsWith("</")) {
      buttonDepth -= 1;
    } else {
      assert.equal(buttonDepth, 0, "interactive buttons must not be nested");
      buttonDepth += 1;
    }
  }
  assert.equal(buttonDepth, 0);
});

test("cooperation landing uses the graphic participation hero and keeps role benefits for desktop", () => {
  const html = renderToStaticMarkup(
    React.createElement(CooperationLanding, { tracking }),
  );

  assert.match(html, /cooperation-hero/);
  assert.equal(
    existsSync(new URL("../../../public/images/cooperation/cooperation-hero.webp", import.meta.url)),
    true,
  );
  assert.equal(
    existsSync(new URL("../../../public/images/cooperation/cooperation-hero-mobile-v2.webp", import.meta.url)),
    true,
  );
  assert.match(html, /УЧАСТИЕ И СОТРУДНИЧЕСТВО/);
  assert.match(html, /Выберите формат участия/);
  assert.match(html, /После выбора откроется подходящая анкета\./);
  assert.doesNotMatch(html, /Укажите, кто вы\./);
  assert.doesNotMatch(html, /<p[^>]*>Выберите формат участия<\/p>/);
  assert.doesNotMatch(html, />Кто вы\?<\/h2>/);
  assert.match(html, /<h2[^>]*class="sr-only"[^>]*id="cooperation-roles-title">Форматы участия<\/h2>/);
  assert.match(html, /class="space-y-4 lg:space-y-6"/);
  assert.doesNotMatch(html, /Присоединяйтесь к профессиональной среде офтальмологии/);
  assert.doesNotMatch(html, /Стать участником|Узнать о возможностях/);
  assert.match(html, /data-cooperation-role="CLINIC"/);
  assert.equal((html.match(/data-role-benefits/g) || []).length, 3);
  assert.match(html, /профиль клиники/);
  assert.match(html, /профессиональный профиль/);
  assert.match(html, /профиль компании/);
  assert.match(html, /Что дальше\?/);
});

test("cooperation landing restores the centered next-steps process before role selection", () => {
  const html = renderToStaticMarkup(
    React.createElement(CooperationLanding, { tracking }),
  );

  assert.match(html, /data-cooperation-process/);
  assert.match(html, /Понятный процесс/);
  assert.match(html, /Проверяем заявку/);
  assert.match(html, /Подтверждаем профиль/);
  assert.match(html, /Вы получаете приглашение/);
  assert.match(html, /Создаёте пароль и входите в личный кабинет/);
  assert.match(html, /Отправка заявки не означает автоматического вступления в Ассоциацию/);
  assert.match(html, /transition-\[grid-template-rows,opacity,margin-top\]/);
});

test("cooperation roles expose mobile summaries and shared expandable details", () => {
  const html = renderToStaticMarkup(
    React.createElement(CooperationLanding, { tracking }),
  );

  assert.match(html, /Для медицинских организаций и офтальмологических центров\./);
  assert.match(html, /Для врачей-офтальмологов и профильных специалистов\./);
  assert.match(html, /Для поставщиков оборудования, технологий и профессиональных услуг\./);
  assert.equal((html.match(/data-role-details/g) || []).length, 3);
  assert.equal((html.match(/data-role-benefits/g) || []).length, 3);
  assert.match(html, /transition-\[grid-template-rows\]/);
});

test("cooperation application starts with contact step instead of rendering the full form", () => {
  const html = renderToStaticMarkup(
    React.createElement(CooperationApplicationForm, {
      participantType: "CLINIC",
      tracking,
    }),
  );

  assert.match(html, /data-cooperation-wizard/);
  assert.match(html, /Шаг 1 из 4/);
  assert.match(html, /Назад/);
  assert.match(html, /Продолжить/);
  assert.match(html, /name="contactName"/);
  assert.ok((html.match(/text-base sm:text-sm/g) || []).length >= 3);
  assert.doesNotMatch(html, /name="organizationName"/);
  assert.doesNotMatch(html, /name="interests"/);
  assert.doesNotMatch(html, /name="consentPersonalData"/);
});
