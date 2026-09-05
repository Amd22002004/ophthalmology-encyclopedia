import assert from "node:assert/strict";
import test from "node:test";
import {
  diseaseConditionJsonLd,
  diseaseWebPageJsonLd,
  faqPageJsonLd,
  medicalProcedureJsonLd,
  procedureWebPageJsonLd,
} from "./seo";

test("disease JSON-LD uses only the approved medical entities", () => {
  const condition = diseaseConditionJsonLd({
    title: "Амблиопия",
    description: "Снижение зрительной функции.",
    aliases: ["Ленивый глаз"],
    path: "/diseases/ambliopiya",
    icdCode: null,
  });
  const page = diseaseWebPageJsonLd({
    title: "Амблиопия",
    description: "Снижение зрительной функции.",
    path: "/diseases/ambliopiya",
  });
  const faq = faqPageJsonLd([{ question: "Что такое амблиопия?", answer: "Ответ." }]);

  assert.equal(condition["@type"], "MedicalCondition");
  assert.equal(condition["@id"], "http://localhost:3000/diseases/ambliopiya#condition");
  assert.deepEqual(condition.alternateName, ["Ленивый глаз"]);
  assert.equal(condition.code, undefined);
  assert.equal(page["@type"], "MedicalWebPage");
  assert.equal(page.about["@id"], "http://localhost:3000/diseases/ambliopiya#condition");
  assert.equal(faq["@type"], "FAQPage");
});

test("procedure JSON-LD points the page and procedure to the same canonical URL", () => {
  const procedure = medicalProcedureJsonLd({
    title: "SMILE Pro",
    description: "Метод лазерной коррекции.",
    path: "/procedures/smile-pro",
    image: "/images/procedures/smile-pro.webp",
  });
  const page = procedureWebPageJsonLd({
    title: "SMILE Pro: принцип",
    description: "Описание метода.",
    path: "/procedures/smile-pro",
    image: "/images/procedures/smile-pro.webp",
  });

  assert.equal(procedure["@type"], "MedicalProcedure");
  assert.equal(procedure["@id"], "http://localhost:3000/procedures/smile-pro#procedure");
  assert.equal(page.about["@id"], procedure["@id"]);
  assert.equal(page.primaryImageOfPage, "http://localhost:3000/images/procedures/smile-pro.webp");
});
