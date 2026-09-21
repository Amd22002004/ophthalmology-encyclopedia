import { STO_2026_EVENT, STO_2026_EVENT_PATH, STO_2026_PUBLIC_ORIGIN } from "./sto-2026";

const EVENT_TIME_ZONE = "Asia/Yekaterinburg";

const EMAIL_BACKGROUND = "#eef5f6";
const EMAIL_NAVY = "#12384a";
const EMAIL_TEAL = "#168b8b";
const EMAIL_MUTED = "#5c7279";
const EMAIL_BORDER = "#dce8e9";

export type EventApplicantEmailInput = {
  fullName: string;
  publicNumber: string;
};

export type EventAssociationEmailInput = EventApplicantEmailInput & {
  phone: string;
  email: string;
  city?: string | null;
  specialty?: string | null;
  organization?: string | null;
  position?: string | null;
  source?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  comment?: string | null;
  createdAt?: Date;
};

export type EventRegistrationEmail = {
  subject: string;
  previewText: string;
  text: string;
  html: string;
};

const eventRegistrationDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: EVENT_TIME_ZONE,
});

export function formatEventRegistrationDate(value: Date) {
  return eventRegistrationDateFormatter.format(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}

function optional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

function textLine(label: string, value: string | null | undefined) {
  const normalized = optional(value);
  return normalized ? `${label}: ${normalized}` : null;
}

function htmlLink(href: string, label: string, style: string) {
  return `<a href="${escapeHtml(href)}" style="${style}">${escapeHtml(label)}</a>`;
}

function renderEmailDocument(previewText: string, content: string) {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(STO_2026_EVENT.title)}</title>
    <style>
      @media only screen and (max-width: 640px) {
        .email-shell { width: 100% !important; }
        .email-pad { padding: 24px 16px !important; }
        .event-info-cell { display: block !important; width: 100% !important; border-right: 0 !important; border-bottom: 1px solid ${EMAIL_BORDER} !important; }
        .event-info-cell:last-child { border-bottom: 0 !important; }
        .button-cell { display: block !important; width: 100% !important; padding: 0 0 10px !important; }
        .button-cell a { display: block !important; text-align: center !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:${EMAIL_BACKGROUND}; color:${EMAIL_NAVY}; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.55;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${escapeHtml(previewText)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background:${EMAIL_BACKGROUND};">
      <tr>
        <td class="email-pad" align="center" style="padding:40px 16px;">
          <table class="email-shell" role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:640px; background:#ffffff;">
            <tr>
              <td style="padding:24px 32px; border-bottom:1px solid ${EMAIL_BORDER};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="48" valign="middle" style="width:48px; padding-right:14px;">
                      <a href="${STO_2026_PUBLIC_ORIGIN}" style="text-decoration:none;">
                        <img src="${STO_2026_PUBLIC_ORIGIN}/association-logo.png" width="48" height="48" alt="Ассоциация офтальмологических клиник" style="display:block; width:48px; height:48px; border:0; border-radius:8px;">
                      </a>
                    </td>
                    <td valign="middle">
                      <p style="margin:0; color:${EMAIL_TEAL}; font-size:11px; font-weight:bold; letter-spacing:1px; line-height:1.3; text-transform:uppercase;">Профессиональное объединение</p>
                      <p style="margin:4px 0 0; color:${EMAIL_NAVY}; font-size:15px; font-weight:bold; line-height:1.35;">Ассоциация офтальмологических клиник</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">${content}</td>
            </tr>
            <tr>
              <td style="padding:24px 32px; border-top:1px solid ${EMAIL_BORDER}; color:${EMAIL_MUTED}; font-size:13px; line-height:1.55;">
                <p style="margin:0;">По вопросам участия: ${htmlLink(`mailto:${STO_2026_EVENT.organizerEmail}`, STO_2026_EVENT.organizerEmail, `color:${EMAIL_TEAL}; text-decoration:underline;`)}</p>
                <p style="margin:8px 0 0;">Сохраните это письмо. Номер регистрации можно указать при обращении к организаторам.</p>
                <p style="margin:16px 0 0; color:${EMAIL_NAVY}; font-weight:bold;">Ассоциация офтальмологических клиник</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderEventInfoCell(label: string, value: string, className = "event-info-cell", hasRightBorder = true) {
  return `<td class="${className}" width="50%" valign="top" style="width:50%; padding:16px;${hasRightBorder ? ` border-right:1px solid ${EMAIL_BORDER};` : ""}">
    <p style="margin:0; color:${EMAIL_TEAL}; font-size:11px; font-weight:bold; letter-spacing:1px; line-height:1.3; text-transform:uppercase;">${escapeHtml(label)}</p>
    <p style="margin:7px 0 0; color:${EMAIL_NAVY}; font-size:16px; font-weight:bold; line-height:1.45;">${escapeHtml(value)}</p>
  </td>`;
}

function renderAdminRow(label: string, value: string | null | undefined) {
  const normalized = optional(value);
  if (!normalized) return "";
  return `<tr>
    <td valign="top" style="width:34%; padding:10px 12px 10px 0; color:${EMAIL_MUTED}; font-size:14px; border-bottom:1px solid ${EMAIL_BORDER};">${escapeHtml(label)}</td>
    <td valign="top" style="padding:10px 0; color:${EMAIL_NAVY}; font-size:15px; border-bottom:1px solid ${EMAIL_BORDER}; white-space:pre-wrap; overflow-wrap:anywhere;">${escapeHtml(normalized)}</td>
  </tr>`;
}

const eventUrl = `${STO_2026_PUBLIC_ORIGIN}${STO_2026_EVENT_PATH}`;
const programUrl = `${eventUrl}#program`;

export function buildApplicantEventEmail(input: EventApplicantEmailInput): EventRegistrationEmail {
  const subject = `Ваша регистрация получена — №${input.publicNumber}`;
  const previewText = "Конференция 15 октября в Тюмени. Регистрация гостей с 14:00, начало в 15:00.";
  const text = [
    "Ваша регистрация получена",
    "",
    `Здравствуйте, ${input.fullName}!`,
    "",
    `Спасибо за регистрацию на межрегиональную конференцию «${STO_2026_EVENT.title}».`,
    "",
    `Номер регистрации: ${input.publicNumber}`,
    "",
    STO_2026_EVENT.dateLabel,
    "С 14:00 — регистрация гостей и кофе-брейк.",
    "В 15:00 — начало конференции.",
    "Время местное — Тюмень, UTC+5.",
    "",
    "Место проведения",
    STO_2026_EVENT.venueName,
    STO_2026_EVENT.venueAddress,
    `Зал «${STO_2026_EVENT.venueHall}», ${STO_2026_EVENT.venueFloor}`,
    "",
    "Участие бесплатное.",
    "",
    `Программа конференции: ${programUrl}`,
    `Построить маршрут: ${STO_2026_EVENT.mapUrl}`,
    "Добавить в календарь: откройте вложение sto-2026.ics",
    "",
    "Сохраните это письмо. Номер регистрации можно указать при обращении к организаторам.",
    "Регистрация на конференцию не создаёт личный кабинет и не является записью на медицинскую услугу.",
    "",
    `По вопросам участия: ${STO_2026_EVENT.organizerEmail}`,
    "",
    "До встречи на конференции!",
    STO_2026_EVENT.organizerName,
  ].join("\n");

  const content = `
    <h1 style="margin:0; color:${EMAIL_NAVY}; font-size:30px; line-height:1.2;">Ваша регистрация получена</h1>
    <p style="margin:20px 0 0;">Здравствуйте, ${escapeHtml(input.fullName)}!</p>
    <p style="margin:12px 0 0;">Спасибо за регистрацию на межрегиональную конференцию «${escapeHtml(STO_2026_EVENT.title)}».</p>
    <p style="display:inline-block; margin:24px 0 0; padding:8px 12px; color:${EMAIL_NAVY}; background:#e8f4f3; font-size:14px; font-weight:bold; line-height:1.4;">Номер регистрации: ${escapeHtml(input.publicNumber)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; margin-top:24px; border:1px solid ${EMAIL_BORDER};">
      <tr>
        ${renderEventInfoCell("Дата", STO_2026_EVENT.dateLabel)}
        ${renderEventInfoCell("Время", "14:00 регистрация · 15:00 начало", "event-info-cell", false)}
      </tr>
    </table>
    <p style="margin:16px 0 0; color:${EMAIL_MUTED};">С 14:00 — регистрация гостей и кофе-брейк.<br>В 15:00 — начало конференции.<br>Время местное — Тюмень, UTC+5.</p>
    <div style="margin-top:24px; padding:18px; background:#f5faf9; border-left:4px solid ${EMAIL_TEAL};">
      <p style="margin:0; color:${EMAIL_TEAL}; font-size:11px; font-weight:bold; letter-spacing:1px; line-height:1.3; text-transform:uppercase;">Место проведения</p>
      <p style="margin:8px 0 0; color:${EMAIL_NAVY}; font-size:17px; font-weight:bold; line-height:1.45;">${escapeHtml(STO_2026_EVENT.venueName)}</p>
      <p style="margin:4px 0 0;">${escapeHtml(STO_2026_EVENT.venueAddress)}<br>Зал «${escapeHtml(STO_2026_EVENT.venueHall)}», ${escapeHtml(STO_2026_EVENT.venueFloor)}</p>
    </div>
    <p style="margin:20px 0 0;">Участие бесплатное.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; margin-top:24px;">
      <tr>
        <td class="button-cell" width="50%" valign="top" style="width:50%; padding-right:6px;">${htmlLink(programUrl, "Программа конференции", `display:block; padding:13px 12px; color:#ffffff; background:${EMAIL_TEAL}; font-size:15px; font-weight:bold; line-height:1.35; text-align:center; text-decoration:none;`)}</td>
        <td class="button-cell" width="50%" valign="top" style="width:50%; padding-left:6px;">${htmlLink(STO_2026_EVENT.mapUrl, "Построить маршрут", `display:block; padding:13px 12px; color:${EMAIL_NAVY}; background:#dff1f0; font-size:15px; font-weight:bold; line-height:1.35; text-align:center; text-decoration:none;`)}</td>
      </tr>
    </table>
    <p style="margin:16px 0 0; color:${EMAIL_MUTED}; font-size:14px;">Добавить в календарь — откройте файл события во вложении письма.</p>
    <p style="margin:10px 0 0; color:${EMAIL_MUTED}; font-size:13px;">Регистрация на конференцию не создаёт личный кабинет и не является записью на медицинскую услугу.</p>`;

  return { subject, previewText, text, html: renderEmailDocument(previewText, content) };
}

export function buildAssociationEventEmail(input: EventAssociationEmailInput): EventRegistrationEmail {
  const subject = `Новая регистрация на конференцию — №${input.publicNumber}`;
  const previewText = `Новая регистрация на конференцию — №${input.publicNumber}`;
  const comment = optional(input.comment);
  const text = [
    subject,
    "",
    textLine("Дата заявки", input.createdAt ? formatEventRegistrationDate(input.createdAt) : null),
    textLine("ФИО", input.fullName),
    textLine("Телефон", input.phone),
    textLine("Email", input.email),
    textLine("Город", input.city),
    textLine("Специализация", input.specialty),
    textLine("Организация", input.organization),
    textLine("Должность", input.position),
    textLine("Источник", input.source),
    textLine("UTM campaign", input.utmCampaign),
    textLine("UTM content", input.utmContent),
    ...(comment ? ["", "Комментарий участника:", comment] : []),
    "",
    `Карточка события: ${eventUrl}`,
  ].filter((value): value is string => value !== null).join("\n");

  const rows: Array<[string, string | null | undefined]> = [
    ["Дата заявки", input.createdAt ? formatEventRegistrationDate(input.createdAt) : null],
    ["ФИО", input.fullName],
    ["Телефон", input.phone],
    ["Email", input.email],
    ["Город", input.city],
    ["Специализация", input.specialty],
    ["Организация", input.organization],
    ["Должность", input.position],
    ["Источник", input.source],
    ["UTM campaign", input.utmCampaign],
    ["UTM content", input.utmContent],
  ];
  const rowsHtml = rows.map(([label, value]) => renderAdminRow(label, value)).join("");
  const commentBlock = comment
    ? `<div style="margin-top:24px; padding:16px; background:#fff8e8; border-left:4px solid #d49a2a;">
      <p style="margin:0; color:#8a5a00; font-size:12px; font-weight:bold; letter-spacing:.6px; text-transform:uppercase;">Комментарий участника</p>
      <p style="margin:8px 0 0; white-space:pre-wrap; overflow-wrap:anywhere;">${escapeHtml(comment)}</p>
    </div>`
    : "";
  const content = `
    <h1 style="margin:0; color:${EMAIL_NAVY}; font-size:28px; line-height:1.2;">Новая регистрация</h1>
    <p style="margin:12px 0 0; color:${EMAIL_MUTED};">${escapeHtml(STO_2026_EVENT.title)} · №${escapeHtml(input.publicNumber)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; margin-top:24px; border-collapse:collapse;">${rowsHtml}</table>
    ${commentBlock}
    <p style="margin:24px 0 0;">${htmlLink(eventUrl, "Открыть карточку события", `color:${EMAIL_TEAL}; font-weight:bold; text-decoration:underline;`)}</p>`;

  return { subject, previewText, text, html: renderEmailDocument(previewText, content) };
}
