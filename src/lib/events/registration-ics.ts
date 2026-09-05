import { STO_2026_EVENT, STO_2026_EVENT_PATH, STO_2026_PUBLIC_ORIGIN } from "./sto-2026";

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

export function buildEventIcs() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Association of Ophthalmology Clinics//STO-2026//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:sto-2026@oftalmologia.pro",
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
    "DTSTART:20261015T100000Z",
    `SUMMARY:${icsEscape(STO_2026_EVENT.title)}`,
    `LOCATION:${icsEscape(`${STO_2026_EVENT.venueName}, ${STO_2026_EVENT.venueAddress}`)}`,
    `DESCRIPTION:${icsEscape(`${STO_2026_EVENT.registrationLabel}. ${STO_2026_EVENT.startLabel}. Программа: ${STO_2026_PUBLIC_ORIGIN}${STO_2026_EVENT_PATH}`)}`,
    `URL:${STO_2026_PUBLIC_ORIGIN}${STO_2026_EVENT_PATH}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}
