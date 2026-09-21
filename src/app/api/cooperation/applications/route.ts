import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { CooperationFileError } from "@/lib/cooperation/files";
import { createCooperationApplication, createCooperationRequestFingerprint, CooperationSubmissionError } from "@/lib/cooperation/repository";
import { validateCooperationApplicationInput } from "@/lib/cooperation/validation";

export const runtime = "nodejs";

const MAX_FORM_BYTES = 12 * 1024 * 1024;

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host.toLowerCase() === host.toLowerCase(); } catch { return false; }
}

function booleanValue(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

function text(formData: FormData, key: string, maxLength = 2_000) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("multipart/form-data;")) return NextResponse.json({ error: "Поддерживается только multipart-форма" }, { status: 415 });
  const rawContentLength = request.headers.get("content-length");
  if (!rawContentLength || !/^\d+$/.test(rawContentLength)) return NextResponse.json({ error: "Размер отправки не указан" }, { status: 411 });
  if (Number(rawContentLength) > MAX_FORM_BYTES) return NextResponse.json({ error: "Общий размер отправки превышает допустимый" }, { status: 413 });

  let formData: FormData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ error: "Не удалось прочитать форму" }, { status: 400 }); }

  const validation = validateCooperationApplicationInput({
    participantType: text(formData, "participantType", 20),
    organizationName: text(formData, "organizationName", 240),
    inn: text(formData, "inn", 20),
    firstName: text(formData, "firstName", 120),
    lastName: text(formData, "lastName", 120),
    middleName: text(formData, "middleName", 120),
    contactName: text(formData, "contactName", 180),
    contactPosition: text(formData, "contactPosition", 180),
    phone: text(formData, "phone", 80),
    email: text(formData, "email", 254),
    city: text(formData, "city", 160),
    region: text(formData, "region", 160),
    website: text(formData, "website", 500),
    workplace: text(formData, "workplace", 240),
    customWorkplace: text(formData, "customWorkplace", 240),
    specialties: formData.getAll("specialties").map(String),
    academicDegree: text(formData, "academicDegree", 80),
    professionalUrl: text(formData, "professionalUrl", 500),
    partnerType: text(formData, "partnerType", 80),
    interests: formData.getAll("interests").map(String),
    message: text(formData, "message", 10_000),
    consentPersonalData: booleanValue(formData.get("consentPersonalData")),
    consentMarketing: booleanValue(formData.get("consentMarketing")),
    startedAt: text(formData, "startedAt", 40),
    websiteHoney: text(formData, "websiteHoney", 200),
    source: text(formData, "source", 100),
    landingUrl: text(formData, "landingUrl", 2_000),
    pageTitle: text(formData, "pageTitle", 300),
    referrer: text(formData, "referrer", 2_000),
    utmSource: text(formData, "utmSource", 200),
    utmMedium: text(formData, "utmMedium", 200),
    utmCampaign: text(formData, "utmCampaign", 200),
    utmContent: text(formData, "utmContent", 200),
  });
  if (!validation.success) {
    if (validation.isSpam) return NextResponse.json({ error: "Запрос отклонён" }, { status: 400 });
    return NextResponse.json({ error: "Проверьте заполнение формы", fieldErrors: validation.fieldErrors }, { status: 400 });
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || text(formData, "idempotencyKey", 100);
  if (!/^[A-Za-z0-9._:-]{16,100}$/.test(idempotencyKey)) return NextResponse.json({ error: "Не удалось идентифицировать отправку. Обновите форму" }, { status: 400 });
  const attachmentValue = formData.get("attachment");
  const attachment = attachmentValue instanceof File && attachmentValue.size > 0 ? attachmentValue : null;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    const result = await createCooperationApplication({
      input: validation.data,
      requestFingerprint: createCooperationRequestFingerprint(ip, userAgent),
      idempotencyKey,
      attachment,
    });
    if (!result.duplicate) {
      revalidatePath("/admin/cooperation");
    }
    return NextResponse.json({ success: true, applicationNumber: result.applicationNumber, status: result.status }, { status: 201 });
  } catch (error) {
    if (error instanceof CooperationFileError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof CooperationSubmissionError) return NextResponse.json({ error: error.message, ...(error.field ? { fieldErrors: { [error.field]: error.message } } : {}) }, { status: error.status });
    return NextResponse.json({ error: "Не удалось сохранить заявку. Повторите попытку" }, { status: 500 });
  }
}
