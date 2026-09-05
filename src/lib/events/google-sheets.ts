import { createPrivateKey, createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  EVENT_REGISTRATION_EXPORT_COLUMNS,
  eventRegistrationExportRow,
  type EventRegistrationExportRow,
} from "./registration-export";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export type GoogleSheetsRegistration = EventRegistrationExportRow;

export type GoogleSheetsServiceAccount = {
  clientEmail: string;
  privateKey: string;
};

export type GoogleSheetsConfig = {
  enabled: boolean;
  spreadsheetId?: string;
  sheetName: string;
  serviceAccount?: GoogleSheetsServiceAccount;
  serviceAccountJson?: string;
  serviceAccountPath?: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function parseGoogleSheetsConfig(env: Record<string, string | undefined> = process.env): GoogleSheetsConfig {
  return {
    enabled: env.GOOGLE_EVENT_SHEETS_ENABLED?.trim().toLowerCase() === "true",
    spreadsheetId: env.GOOGLE_EVENT_SHEETS_SPREADSHEET_ID?.trim() || undefined,
    sheetName: env.GOOGLE_EVENT_SHEETS_SHEET_NAME?.trim() || "Участники",
    serviceAccountJson: env.GOOGLE_EVENT_SHEETS_SERVICE_ACCOUNT_JSON?.trim() || undefined,
    serviceAccountPath: env.GOOGLE_EVENT_SHEETS_SERVICE_ACCOUNT_PATH?.trim() || undefined,
  };
}

export function buildGoogleSheetRow(registration: GoogleSheetsRegistration) {
  return eventRegistrationExportRow(registration);
}

export function googleSheetsColumns() {
  return [...EVENT_REGISTRATION_EXPORT_COLUMNS];
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function loadServiceAccount(config: GoogleSheetsConfig): GoogleSheetsServiceAccount {
  if (config.serviceAccount) return config.serviceAccount;
  const raw = config.serviceAccountJson || (config.serviceAccountPath ? readFileSync(config.serviceAccountPath, "utf8") : "");
  if (!raw) throw new Error("Google Sheets service account is not configured");
  try {
    const parsed = JSON.parse(raw) as { client_email?: unknown; private_key?: unknown };
    if (typeof parsed.client_email !== "string" || typeof parsed.private_key !== "string") throw new Error("invalid service account");
    return { clientEmail: parsed.client_email, privateKey: parsed.private_key };
  } catch {
    throw new Error("Google Sheets service account configuration is invalid");
  }
}

function createServiceAccountAssertion(account: GoogleSheetsServiceAccount, now = Math.floor(Date.now() / 1_000)) {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: account.clientEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3_600,
  }));
  const unsigned = `${header}.${payload}`;
  let signature: string;
  try {
    signature = base64Url(createSign("RSA-SHA256").update(unsigned).end().sign(createPrivateKey(account.privateKey)));
  } catch {
    throw new Error("Google Sheets service account private key is invalid");
  }
  return `${unsigned}.${signature}`;
}

async function jsonResponse<T>(response: Response, errorPrefix: string): Promise<T> {
  if (!response.ok) throw new Error(`${errorPrefix} (${response.status})`);
  try {
    return await response.json() as T;
  } catch {
    throw new Error(`${errorPrefix} (invalid response)`);
  }
}

async function getAccessToken(config: GoogleSheetsConfig, fetchImpl: FetchLike) {
  const account = loadServiceAccount(config);
  const assertion = createServiceAccountAssertion(account);
  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }).toString(),
  });
  const token = await jsonResponse<{ access_token?: unknown }>(response, "Google OAuth token request failed");
  if (typeof token.access_token !== "string" || !token.access_token) throw new Error("Google OAuth token response is invalid");
  return token.access_token;
}

function sheetsUrl(config: GoogleSheetsConfig, range: string) {
  return `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId || "")}/values/${encodeURIComponent(range)}`;
}

export async function syncRegistrationToGoogleSheet(
  config: GoogleSheetsConfig,
  registration: GoogleSheetsRegistration,
  fetchImpl: FetchLike = fetch,
) {
  if (!config.enabled) return { alreadyPresent: false, skipped: true as const };
  if (!config.spreadsheetId) throw new Error("Google Sheets spreadsheet ID is not configured");
  const accessToken = await getAccessToken(config, fetchImpl);
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/json" };
  const range = `${config.sheetName}!A:A`;
  const lookupResponse = await fetchImpl(sheetsUrl(config, range), { headers });
  const lookup = await jsonResponse<{ values?: unknown[][] }>(lookupResponse, "Google Sheets lookup failed");
  const alreadyPresent = (lookup.values || []).some((row) => Array.isArray(row) && row[0] === registration.publicNumber);
  if (alreadyPresent) return { alreadyPresent: true as const, skipped: false as const };

  if (!(lookup.values || []).length) {
    const headerRange = `${config.sheetName}!A1:T1`;
    const headerResponse = await fetchImpl(`${sheetsUrl(config, headerRange)}?valueInputOption=RAW`, {
      method: "PUT",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ majorDimension: "ROWS", values: [googleSheetsColumns()] }),
    });
    await jsonResponse(headerResponse, "Google Sheets header initialization failed");
  }

  const appendResponse = await fetchImpl(`${sheetsUrl(config, range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ majorDimension: "ROWS", values: [buildGoogleSheetRow(registration)] }),
  });
  await jsonResponse(appendResponse, "Google Sheets append failed");
  return { alreadyPresent: false as const, skipped: false as const };
}
