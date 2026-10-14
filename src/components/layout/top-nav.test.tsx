import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "./app-shell";
import { SiteFooter } from "./site-footer";
import { TopNav } from "./top-nav";
import { audienceHubs } from "@/lib/content-model";

// Минимальный разбор серверной разметки React в дерево: проверяем структуру
// меню, а не регулярные выражения по вложенным спискам.
type HtmlNode = { tag: string; attrs: Record<string, string>; children: (HtmlNode | string)[] };
const voidTags = new Set(["area", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

function parseHtml(html: string): HtmlNode {
  const root: HtmlNode = { tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  for (const [whole, tag, rawAttrs = "", selfClosing, text] of html.matchAll(/<\/?([a-zA-Z][\w-]*)([^>]*?)(\/?)>|([^<]+)/g)) {
    const parent = stack[stack.length - 1];
    if (text !== undefined) {
      parent.children.push(text);
    } else if (whole.startsWith("</")) {
      stack.pop();
    } else {
      const attrs = Object.fromEntries([...rawAttrs.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)].map((m) => [m[1], m[2] ?? ""]));
      const node: HtmlNode = { tag, attrs, children: [] };
      parent.children.push(node);
      if (!selfClosing && !voidTags.has(tag)) stack.push(node);
    }
  }
  return root;
}

const elements = (node: HtmlNode) => node.children.filter((child): child is HtmlNode => typeof child !== "string");
const textOf = (node: HtmlNode): string =>
  node.children.map((child) => (typeof child === "string" ? child : textOf(child))).join("").replace(/\s+/g, " ").trim();

function findAll(node: HtmlNode, predicate: (candidate: HtmlNode) => boolean): HtmlNode[] {
  return elements(node).flatMap((child) => [...(predicate(child) ? [child] : []), ...findAll(child, predicate)]);
}

const headerHtml = renderToStaticMarkup(React.createElement(TopNav));
const footerHtml = renderToStaticMarkup(React.createElement(SiteFooter));
const header = parseHtml(headerHtml);
const footer = parseHtml(footerHtml);
const [mainNav] = findAll(header, (node) => node.tag === "nav" && node.attrs["aria-label"] === "Основное меню");
const mainItems = elements(elements(mainNav)[0]).filter((node) => node.tag === "li");
const referenceItem = mainItems[3];
const [referenceButton] = findAll(referenceItem, (node) => node.tag === "button");
const [referencePanel] = findAll(referenceItem, (node) => node.attrs.id === referenceButton.attrs["aria-controls"]);
const referenceGroups = findAll(referencePanel, (node) => node.tag === "ul").map((list) => ({
  title: textOf(findAll(referencePanel, (node) => node.attrs.id === list.attrs["aria-labelledby"])[0]),
  links: findAll(list, (node) => node.tag === "a").map((link) => `${textOf(link)} ${link.attrs.href}`),
}));
const linksNamed = (root: HtmlNode, name: string) => findAll(root, (node) => node.tag === "a" && textOf(node) === name);

test("header menu has exactly five items in the approved order", () => {
  assert.equal(mainItems.length, 5);
  assert.deepEqual(
    mainItems.map((item) => {
      const [control] = findAll(item, (node) => node.tag === "a" || node.tag === "button");
      return `${textOf(control)} ${control.attrs.href ?? "button"}`;
    }),
    ["Об Ассоциации /about", "Членство /cooperation", "Клиники-участники /#members", "Справочник button", "Новости /news"],
  );
});

test("reference menu is a button with aria-expanded that controls a panel present in server HTML", () => {
  assert.equal(referenceButton.attrs["aria-expanded"], "false");
  assert.equal(referenceButton.attrs.type, "button");
  assert.ok(referencePanel, "panel is rendered on the server");
  assert.match(referencePanel.attrs.class, /reference-menu-panel/);
});

test("reference menu contains the four groups and seventeen links of the former sidebar", () => {
  assert.deepEqual(referenceGroups, [
    {
      title: "Пациентам",
      links: ["Заболевания /diseases", "Лечение и коррекция /procedures", "Инновации /innovations", "Подать обращение /appeal"],
    },
    {
      title: "Врачам",
      links: [
        "Врачи и специалисты /doctors",
        "Клинические рекомендации /guidelines",
        "Научные работы /publications",
        "Регистрация врача /cooperation/doctor",
        "История офтальмологии /history",
      ],
    },
    {
      title: "Клиникам",
      links: [
        "Каталог клиник /clinics",
        "Клиники по ОМС /clinics/oms",
        "Договорные клиники /clinics/contract",
        "Законодательство /regulations",
        "Независимая оценка /independent-control",
        "Расследования /investigations",
      ],
    },
    { title: "Поставщикам", links: ["Каталог поставщиков /suppliers", "Оборудование /equipment"] },
  ]);
  assert.equal(referenceGroups.flatMap((group) => group.links).length, 17);
  assert.equal(referenceGroups[2].links.at(-1), "Расследования /investigations");
  assert.deepEqual(referenceGroups.map((group) => group.title), audienceHubs.map((hub) => hub.title));
});

test("appeal link appears once in the header and once in the footer", () => {
  assert.equal(linksNamed(header, "Подать обращение").length, 1);
  assert.equal(linksNamed(footer, "Подать обращение").length, 1);
});

test("header keeps search, join and cabinet actions and drops removed items", () => {
  const [join] = linksNamed(header, "Вступить");
  assert.equal(join.attrs.href, "/cooperation");
  assert.match(headerHtml, /href="\/cabinet"/);
  assert.match(headerHtml, /aria-label="Войти в личный кабинет"/);
  assert.match(headerHtml, /<span>Поиск<\/span>/);
  assert.match(headerHtml, /<span class="sr-only">Поиск<\/span>/);
  for (const removed of ["Врачи", "Клиники", "Вопросы", "О нас", "Сотрудничество"]) {
    assert.equal(linksNamed(mainNav, removed).length, 0, removed);
  }
  assert.doesNotMatch(headerHtml, /href="\/questions"/);
});

test("header never uses the word encyclopedia", () => {
  assert.doesNotMatch(headerHtml, /нциклопед/i);
});

test("layout has no sidebar", () => {
  const shell = renderToStaticMarkup(React.createElement(AppShell, null, React.createElement("p", null, "content")));
  assert.doesNotMatch(shell, /<aside/);
  assert.doesNotMatch(readFileSync(new URL("./app-shell.tsx", import.meta.url), "utf8"), /Sidebar/);
  for (const removed of ["left-sidebar.tsx", "sidebar-section.tsx", "sidebar-link.tsx", "mobile-sidebar-toggle.tsx"]) {
    assert.equal(existsSync(new URL(`./${removed}`, import.meta.url)), false, removed);
  }
});
