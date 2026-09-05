import assert from "node:assert/strict";
import test from "node:test";
import { buildAppealWhereInput } from "./filters";

test("объединяет независимые фильтры через AND и не теряет полнотекстовый OR", () => {
  const where = buildAppealWhereInput({
    status: "IN_REVIEW",
    investigationId: "investigation-1",
    clinicId: "clinic-1",
    clinic: "Глазцентр",
    doctor: "Иванов",
    equipment: "Eye-Q",
    region: "Тюменская",
    from: "2026-08-01",
    to: "2026-08-07",
    query: "AO-20260807",
  });

  assert.ok(Array.isArray(where.AND));
  assert.deepEqual(where.AND?.slice(0, 3), [
    { status: "IN_REVIEW" },
    { investigationId: "investigation-1" },
    { clinicId: "clinic-1" },
  ]);
  assert.ok(where.AND?.some((item) => "reportedDoctorName" in item));
  assert.ok(where.AND?.some((item) => "reportedEquipmentName" in item));
  assert.ok(where.AND?.some((item) => "OR" in item && JSON.stringify(item).includes("reportedClinicName")));
  assert.ok(where.AND?.some((item) => "OR" in item));
  assert.ok(where.AND?.some((item) => "createdAt" in item));
});

test("игнорирует неизвестный статус", () => {
  const where = buildAppealWhereInput({ status: "DELETED" });
  assert.deepEqual(where, {});
});

test("ищет клинику и по сообщению заявителя, и по классифицированной карточке", () => {
  const where = buildAppealWhereInput({ clinic: "Глазцентр" });

  assert.deepEqual(where, {
    AND: [
      {
        OR: [
          { reportedClinicName: { contains: "Глазцентр", mode: "insensitive" } },
          { clinic: { is: { title: { contains: "Глазцентр", mode: "insensitive" } } } },
        ],
      },
    ],
  });
});
