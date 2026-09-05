import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import {
  buildGoogleSheetRow,
  parseGoogleSheetsConfig,
  syncRegistrationToGoogleSheet,
  type GoogleSheetsRegistration,
} from "./google-sheets";

const registration: GoogleSheetsRegistration = {
  publicNumber: "AOK-EVENT-2026-000007",
  createdAt: new Date("2026-08-27T06:00:00.000Z"),
  status: "NEW",
  fullName: "Анна Петрова",
  phone: "+79991234567",
  email: "anna@example.com",
  specialty: "ophthalmologist",
  customSpecialty: null,
  organization: "Клиника",
  position: "Врач",
  city: "Тюмень",
  comment: null,
  utmSource: "print",
  utmMedium: "qr",
  utmCampaign: "conference_invitation_2026",
  utmContent: "registration",
  source: "PRINT_QR",
  updatedAt: new Date("2026-08-27T06:00:00.000Z"),
};

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

test("Google Sheets остаётся disabled без явного feature flag", () => {
  const config = parseGoogleSheetsConfig({});
  assert.equal(config.enabled, false);
  assert.equal(config.sheetName, "Участники");
});

test("Google Sheets row использует registration number первым ключевым столбцом", () => {
  const row = buildGoogleSheetRow(registration);
  assert.equal(row[0], "AOK-EVENT-2026-000007");
  assert.equal(row[7], "anna@example.com");
  assert.equal(row[16], "conference_invitation_2026");
});

test("Google Sheets не добавляет дубликат при повторной обработке outbox", async () => {
  const calls: Array<{ method: string; url: string }> = [];
  const result = await syncRegistrationToGoogleSheet(
    {
      enabled: true,
      spreadsheetId: "sheet-id",
      sheetName: "Участники",
      serviceAccount: { clientEmail: "service@example.com", privateKey: privateKey.export({ format: "pem", type: "pkcs8" }).toString() },
    },
    registration,
    async (input, init) => {
      calls.push({ method: init?.method || "GET", url: String(input) });
      if (String(input).includes("oauth2.googleapis.com")) {
        return new Response(JSON.stringify({ access_token: "test-token" }), { status: 200 });
      }
      return new Response(JSON.stringify({ values: [["№ регистрации"], [registration.publicNumber]] }), { status: 200 });
    },
  );

  assert.equal(result.alreadyPresent, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].method, "GET");
});

test("Google Sheets инициализирует заголовки пустой вкладки перед первой регистрацией", async () => {
  const calls: Array<{ method: string; url: string; body?: string }> = [];
  const result = await syncRegistrationToGoogleSheet(
    {
      enabled: true,
      spreadsheetId: "sheet-id",
      sheetName: "Участники",
      serviceAccount: { clientEmail: "service@example.com", privateKey: privateKey.export({ format: "pem", type: "pkcs8" }).toString() },
    },
    registration,
    async (input, init) => {
      calls.push({ method: init?.method || "GET", url: String(input), body: typeof init?.body === "string" ? init.body : undefined });
      if (String(input).includes("oauth2.googleapis.com")) {
        return new Response(JSON.stringify({ access_token: "test-token" }), { status: 200 });
      }
      if (init?.method === "PUT") return new Response(JSON.stringify({ updatedRows: 1 }), { status: 200 });
      if (init?.method === "POST") return new Response(JSON.stringify({ updates: { updatedRows: 1 } }), { status: 200 });
      return new Response(JSON.stringify({ values: [] }), { status: 200 });
    },
  );

  assert.deepEqual(result, { alreadyPresent: false, skipped: false });
  assert.deepEqual(calls.map((call) => call.method), ["POST", "GET", "PUT", "POST"]);
  assert.match(calls[2].url, /A1%3AT1/);
  assert.deepEqual(JSON.parse(calls[2].body || "{}").values, [[
    "№ регистрации",
    "дата и время регистрации",
    "статус",
    "фамилия",
    "имя",
    "отчество",
    "телефон",
    "email",
    "специальность",
    "другая специальность",
    "организация / клиника",
    "должность",
    "город",
    "комментарий",
    "UTM source",
    "UTM medium",
    "UTM campaign",
    "UTM content",
    "источник",
    "дата последнего изменения",
  ]]);
  assert.equal(JSON.parse(calls[3].body || "{}").values[0][0], "AOK-EVENT-2026-000007");
});
