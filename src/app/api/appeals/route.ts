import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { AppealFileError } from "@/lib/appeals/storage";
import {
  AppealSubmissionError,
  createAppeal,
  createRequestFingerprint,
} from "@/lib/appeals/repository";
import { validateAppealInput } from "@/lib/appeals/validation";
import { MAX_APPEAL_TOTAL_SIZE } from "@/lib/appeals/files";

export const runtime = "nodejs";

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

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("multipart/form-data;")) {
    return NextResponse.json({ error: "Поддерживается только multipart-форма" }, { status: 415 });
  }
  const rawContentLength = request.headers.get("content-length");
  if (!rawContentLength || !/^\d+$/.test(rawContentLength)) {
    return NextResponse.json({ error: "Размер отправки не указан" }, { status: 411 });
  }
  const contentLength = Number(rawContentLength);
  if (contentLength > MAX_APPEAL_TOTAL_SIZE + 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Общий размер отправки превышает допустимый" }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать форму" }, { status: 400 });
  }

  const validation = validateAppealInput({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    city: String(formData.get("city") ?? ""),
    investigationSlug: String(formData.get("investigationSlug") ?? ""),
    reporterRoles: formData.getAll("reporterRoles").map(String),
    categories: formData.getAll("categories").map(String),
    requestedActions: formData.getAll("requestedActions").map(String),
    description: String(formData.get("description") ?? ""),
    operationDate: String(formData.get("operationDate") ?? ""),
    reportedClinicName: String(formData.get("reportedClinicName") ?? ""),
    reportedDoctorName: String(formData.get("reportedDoctorName") ?? ""),
    reportedEquipmentName: String(formData.get("reportedEquipmentName") ?? ""),
    collectiveInterest: booleanValue(formData.get("collectiveInterest")),
    consentAccepted: booleanValue(formData.get("consentAccepted")),
    consentTemplateId: String(formData.get("consentTemplateId") ?? ""),
    website: String(formData.get("website") ?? ""),
  });

  if (!validation.success) {
    if (validation.isSpam) return NextResponse.json({ success: true, publicNumber: "AO-RECEIVED" });
    return NextResponse.json({ error: "Проверьте заполнение формы", fieldErrors: validation.fieldErrors }, { status: 400 });
  }

  const files = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    const appeal = await createAppeal({
      input: validation.data,
      files,
      requestFingerprint: createRequestFingerprint(ip, userAgent),
    });
    revalidatePath("/investigations");
    if (validation.data.investigationSlug) {
      revalidatePath(`/investigations/${validation.data.investigationSlug}`);
    }
    return NextResponse.json({ success: true, publicNumber: appeal.publicNumber }, { status: 201 });
  } catch (error) {
    if (error instanceof AppealFileError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof AppealSubmissionError) {
      return NextResponse.json(
        { error: error.message, ...(error.field ? { fieldErrors: { [error.field]: error.message } } : {}) },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Не удалось сохранить обращение. Повторите попытку" }, { status: 500 });
  }
}
