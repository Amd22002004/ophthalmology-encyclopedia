import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EntityHeader } from "./entity-header";

test("длинные badges не отнимают у H1 всю ширину desktop-заголовка", () => {
  const html = renderToStaticMarkup(
    createElement(EntityHeader, {
      eyebrow: "Научная деятельность",
      title:
        "Опыт комбинированного применения модифицированного кросслинкинга роговицы",
      description: "А.И. Островерхов",
      badges: [
        "Научная статья",
        "2023",
        "Вестник Кыргызско-Российского Славянского университета",
        "Полный текст проверен",
      ],
    }),
  );

  assert.match(html, /lg:flex-1/);
  assert.match(html, /lg:max-w-\[46%\]/);
  assert.match(html, /lg:justify-end/);
});
