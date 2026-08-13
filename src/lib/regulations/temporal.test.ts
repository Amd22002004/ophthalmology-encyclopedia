import assert from "node:assert/strict";
import test from "node:test";
import { selectApplicableEdition } from "./temporal";

const editions = [
  {
    id: "historical",
    effectiveFrom: "2010-01-01",
    effectiveTo: "2026-01-31",
    verifiedAt: "2026-08-12",
    historicalUseAllowed: true,
  },
  {
    id: "current",
    effectiveFrom: "2026-02-01",
    effectiveTo: "2026-08-31",
    verifiedAt: "2026-08-12",
    historicalUseAllowed: true,
  },
  {
    id: "future",
    effectiveFrom: "2026-09-01",
    effectiveTo: null,
    verifiedAt: "2026-08-12",
    historicalUseAllowed: true,
  },
];

test("выбирает редакцию по дате события, а не по текущей дате", () => {
  const result = selectApplicableEdition(editions, { date: "2010-06-15" });

  assert.equal(result.status, "APPLICABLE");
  if (result.status !== "APPLICABLE") return;
  assert.equal(result.edition.id, "historical");
});

test("считает обе календарные границы периода редакции включительно", () => {
  const firstDay = selectApplicableEdition(editions, { date: "2026-02-01" });
  const lastDay = selectApplicableEdition(editions, { date: "2026-08-31" });

  assert.equal(firstDay.status, "APPLICABLE");
  assert.equal(lastDay.status, "APPLICABLE");
  if (firstDay.status === "APPLICABLE") assert.equal(firstDay.edition.id, "current");
  if (lastDay.status === "APPLICABLE") assert.equal(lastDay.edition.id, "current");
});

test("не применяет будущую редакцию к событию до её вступления в силу", () => {
  const result = selectApplicableEdition(editions, { date: "2026-08-12" });

  assert.equal(result.status, "APPLICABLE");
  if (result.status !== "APPLICABLE") return;
  assert.equal(result.edition.id, "current");
});

test("требует проверки при неизвестной дате события", () => {
  const result = selectApplicableEdition(editions, {});

  assert.deepEqual(result, {
    status: "REQUIRES_VERIFICATION",
    reason: "EVENT_DATE_UNKNOWN",
    candidates: [],
  });
});

test("требует проверки, если интервал события пересекает разные редакции", () => {
  const result = selectApplicableEdition(editions, {
    from: "2026-08-20",
    to: "2026-09-10",
  });

  assert.equal(result.status, "REQUIRES_VERIFICATION");
  if (result.status !== "REQUIRES_VERIFICATION") return;
  assert.equal(result.reason, "EVENT_INTERVAL_SPANS_EDITIONS");
  assert.deepEqual(
    result.candidates.map((edition) => edition.id),
    ["current", "future"],
  );
});

test("требует проверки при перекрывающихся редакциях", () => {
  const result = selectApplicableEdition(
    [
      ...editions,
      {
        id: "conflict",
        effectiveFrom: "2026-08-01",
        effectiveTo: "2026-08-20",
        verifiedAt: "2026-08-12",
        historicalUseAllowed: true,
      },
    ],
    { date: "2026-08-12" },
  );

  assert.equal(result.status, "REQUIRES_VERIFICATION");
  if (result.status !== "REQUIRES_VERIFICATION") return;
  assert.equal(result.reason, "AMBIGUOUS_EDITIONS");
});

test("не применяет текущий снимок текста к более раннему событию", () => {
  const result = selectApplicableEdition(
    [
      {
        id: "current-snapshot",
        effectiveFrom: "2021-09-01",
        effectiveTo: null,
        verifiedAt: "2026-08-12",
        historicalUseAllowed: false,
      },
    ],
    { date: "2022-04-01" },
  );

  assert.equal(result.status, "REQUIRES_VERIFICATION");
  if (result.status !== "REQUIRES_VERIFICATION") return;
  assert.equal(result.reason, "EDITION_TEXT_NOT_VERIFIED_FOR_EVENT_DATE");
});

test("не считает непроверенную редакцию применимой при отсутствии verifiedAt", () => {
  const result = selectApplicableEdition(
    [
      {
        id: "unverified",
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
        verifiedAt: null,
        historicalUseAllowed: false,
      },
    ],
    { date: "2026-08-12" },
  );

  assert.equal(result.status, "REQUIRES_VERIFICATION");
  if (result.status !== "REQUIRES_VERIFICATION") return;
  assert.equal(result.reason, "EDITION_TEXT_NOT_VERIFIED_FOR_EVENT_DATE");
});

test("не разрешает историческое применение без явного historicalUseAllowed", () => {
  const result = selectApplicableEdition(
    [
      {
        id: "current-snapshot-without-opt-in",
        effectiveFrom: "2021-09-01",
        effectiveTo: null,
        verifiedAt: "2026-08-12",
      },
    ],
    { date: "2022-04-01" },
  );

  assert.equal(result.status, "REQUIRES_VERIFICATION");
  if (result.status !== "REQUIRES_VERIFICATION") return;
  assert.equal(result.reason, "EDITION_TEXT_NOT_VERIFIED_FOR_EVENT_DATE");
});
