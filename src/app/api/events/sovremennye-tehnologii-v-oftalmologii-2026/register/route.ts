import { revalidatePath } from "next/cache";
import { after, NextResponse } from "next/server";
import {
  createEventRegistration,
  createEventRequestFingerprint,
  EventSubmissionError,
  getEventRegistrationGate,
} from "@/lib/events/registration-repository";
import { validateEventRegistrationInput } from "@/lib/events/registration-validation";
import {
  STO_2026_EVENT_PATH,
  STO_2026_EVENT_SLUG,
  STO_2026_REGISTER_PATH,
} from "@/lib/events/sto-2026";

export const runtime = "nodejs";

const MAX_FORM_BYTES = 96 * 1024;

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function booleanValue(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

function text(formData: FormData, key: string, maxLength = 2_000) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });

  try {
    const gate = await getEventRegistrationGate(STO_2026_EVENT_SLUG);
    if (!gate.open) return NextResponse.json({ error: "Регистрация скоро откроется" }, { status: 409 });
  } catch (error) {
    if (error instanceof EventSubmissionError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Не удалось проверить состояние регистрации" }, { status: 503 });
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/x-www-form-urlencoded") && !contentType.startsWith("multipart/form-data;")) {
    return NextResponse.json({ error: "Поддерживается только форма регистрации" }, { status: 415 });
  }
  const rawContentLength = request.headers.get("content-length");
  if (rawContentLength && /^\d+$/.test(rawContentLength) && Number(rawContentLength) > MAX_FORM_BYTES) {
    return NextResponse.json({ error: "Размер отправки превышает допустимый" }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать форму" }, { status: 400 });
  }

  const validation = validateEventRegistrationInput({
    fullName: text(formData, "fullName", 180),
    phone: text(formData, "phone", 80),
    email: text(formData, "email", 254),
    city: text(formData, "city", 160),
    specialty: text(formData, "specialty", 60),
    customSpecialty: text(formData, "customSpecialty", 160),
    organization: text(formData, "organization", 240),
    position: text(formData, "position", 180),
    comment: text(formData, "comment", 4_000),
    consentPersonalData: booleanValue(formData.get("consentPersonalData")),
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
  if (!/^[A-Za-z0-9._:-]{16,100}$/.test(idempotencyKey)) {
    return NextResponse.json({ error: "Не удалось идентифицировать отправку. Обновите форму" }, { status: 400 });
  }
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    const result = await createEventRegistration({
      eventSlug: STO_2026_EVENT_SLUG,
      input: validation.data,
      requestFingerprint: createEventRequestFingerprint(ip, userAgent),
      idempotencyKey,
    });
    if (!result.duplicate) {
      const googleNotifications = result.notifications.filter((notification) => notification.channel === "GOOGLE_SHEETS");
      after(async () => {
        const { deliverGoogleSheetsNotification } = await import("@/lib/events/google-sheets-worker");
        await Promise.all(googleNotifications.map((notification) => deliverGoogleSheetsNotification(notification.id)));
      });
      revalidatePath("/admin/events");
      revalidatePath(STO_2026_EVENT_PATH);
      revalidatePath(STO_2026_REGISTER_PATH);
    }
    return NextResponse.json(
      result.duplicate
        ? { success: true, status: "RECEIVED" }
        : { success: true, registrationNumber: result.publicNumber, status: result.status },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof EventSubmissionError) return NextResponse.json({ error: error.message, ...(error.field ? { fieldErrors: { [error.field]: error.message } } : {}) }, { status: error.status });
    return NextResponse.json({ error: "Не удалось сохранить регистрацию. Повторите попытку" }, { status: 500 });
  }
}
