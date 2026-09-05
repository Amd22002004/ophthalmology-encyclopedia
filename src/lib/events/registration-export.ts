import { ZipArchive } from "archiver";
import { EVENT_SPECIALTY_OPTIONS } from "./registration-validation";

export const EVENT_REGISTRATION_EXPORT_COLUMNS = [
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
] as const;

export type EventRegistrationExportRow = {
  publicNumber: string;
  createdAt: Date;
  status: string;
  fullName: string;
  phone: string;
  email: string;
  specialty: string | null;
  customSpecialty: string | null;
  organization: string | null;
  position: string | null;
  city: string | null;
  comment: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  source: string | null;
  updatedAt: Date;
};

function statusLabel(status: string) {
  return status === "NEW" ? "REGISTERED" : status;
}

function specialtyLabel(value: string | null) {
  return EVENT_SPECIALTY_OPTIONS.find((option) => option.value === value)?.label || value || "";
}

function nameParts(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return [parts[0] || "", parts[1] || "", parts.slice(2).join(" ")];
}

function iso(value: Date) {
  return value.toISOString();
}

export function eventRegistrationExportRow(registration: EventRegistrationExportRow) {
  const [lastName, firstName, middleName] = nameParts(registration.fullName);
  return [
    registration.publicNumber,
    iso(registration.createdAt),
    statusLabel(registration.status),
    lastName,
    firstName,
    middleName,
    registration.phone,
    registration.email,
    specialtyLabel(registration.specialty),
    registration.customSpecialty || "",
    registration.organization || "",
    registration.position || "",
    registration.city || "",
    registration.comment || "",
    registration.utmSource || "",
    registration.utmMedium || "",
    registration.utmCampaign || "",
    registration.utmContent || "",
    registration.source || "",
    iso(registration.updatedAt),
  ];
}

function xml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number) {
  let number = index + 1;
  let name = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    number = Math.floor((number - 1) / 26);
  }
  return name;
}

function inlineCell(reference: string, value: string) {
  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
}

function sheetXml(rows: string[][]) {
  const renderedRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => inlineCell(`${columnName(columnIndex)}${rowIndex + 1}`, value)).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${renderedRows}</sheetData></worksheet>`;
}

function archiveBuffer(files: Array<{ name: string; content: string }>) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    for (const file of files) archive.append(file.content, { name: file.name });
    void archive.finalize();
  });
}

export async function buildEventRegistrationXlsx(registrations: EventRegistrationExportRow[]) {
  const rows = [
    [...EVENT_REGISTRATION_EXPORT_COLUMNS],
    ...registrations.map(eventRegistrationExportRow),
  ];
  return archiveBuffer([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Участники" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Arial"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellXfs></styleSheet>`,
    },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml(rows) },
  ]);
}

export function telegramExportFilename(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yekaterinburg", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  return `sto-2026-registrations-${get("year")}-${get("month")}-${get("day")}-${get("hour")}-${get("minute")}.xlsx`;
}
