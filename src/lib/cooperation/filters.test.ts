import assert from "node:assert/strict";
import test from "node:test";
import { buildCooperationApplicationSearch } from "./filters";

test("builds admin search across application number, person, organization and contacts", () => {
  assert.deepEqual(buildCooperationApplicationSearch("AOK-2026-000127"), [
    { applicationNumber: { contains: "AOK-2026-000127", mode: "insensitive" } },
    { organizationName: { contains: "AOK-2026-000127", mode: "insensitive" } },
    { firstName: { contains: "AOK-2026-000127", mode: "insensitive" } },
    { lastName: { contains: "AOK-2026-000127", mode: "insensitive" } },
    { inn: { contains: "AOK-2026-000127", mode: "insensitive" } },
    { phone: { contains: "AOK-2026-000127", mode: "insensitive" } },
    { email: { contains: "AOK-2026-000127", mode: "insensitive" } },
  ]);
});
