"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ACADEMIC_DEGREE_OPTIONS,
  CLINIC_INTEREST_OPTIONS,
  COOPERATION_ATTACHMENT_ACCEPT,
  DOCTOR_INTEREST_OPTIONS,
  DOCTOR_SPECIALTY_OPTIONS,
  labelsForCooperationValues,
  PARTNER_TYPE_OPTIONS,
  type CooperationParticipantType,
} from "@/lib/cooperation/constants";
import { trackCooperationEvent } from "@/lib/cooperation/analytics";
import type { CooperationTracking } from "@/lib/cooperation/tracking";
import { cn } from "@/lib/utils";

type ClinicOption = { title: string; description: string };
type DraftValue = string | string[] | boolean | File | null;
type CooperationDraft = Record<string, DraftValue>;
type CooperationStep = 1 | 2 | 3 | 4;

const inputClass = "mt-2 block min-h-11 min-w-0 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base sm:text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "text-sm font-medium text-foreground";
const stepTitles = ["Контактные данные", "Профессиональные сведения или организация", "Проверка данных", "Согласие и отправка"] as const;

function stringValue(draft: CooperationDraft, name: string) {
  const value = draft[name];
  return typeof value === "string" ? value : "";
}

function stringValues(draft: CooperationDraft, name: string) {
  const value = draft[name];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isEmpty(value: DraftValue | undefined) {
  if (Array.isArray(value)) return value.length === 0;
  return typeof value !== "string" || value.trim() === "";
}

function Field({ label, name, required, type = "text", placeholder, autoComplete, value, onChange }: { label: string; name: string; required?: boolean; type?: string; placeholder?: string; autoComplete?: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}{required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}</span>
      <input aria-required={required || undefined} autoComplete={autoComplete} className={inputClass} name={name} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} type={type} value={value} />
    </label>
  );
}

function SelectField({ label, name, options, required, value, onChange, placeholder = "Выберите вариант" }: { label: string; name: string; options: readonly { value: string; label: string }[]; required?: boolean; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}{required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}</span>
      <select aria-required={required || undefined} className={inputClass} name={name} onChange={(event) => onChange(event.target.value)} required={required} value={value}>
        <option disabled value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function CheckList({ label, name, options, required, values, onChange }: { label: string; name: string; options: readonly { value: string; label: string }[]; required?: boolean; values: string[]; onChange: (values: string[]) => void }) {
  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return (
    <fieldset aria-required={required || undefined} className="space-y-3">
      <legend className={labelClass}>{label}{required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label className="flex items-start gap-2 rounded-lg border border-border/70 px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/40" key={option.value}>
            <input checked={values.includes(option.value)} className="mt-0.5 size-4 accent-primary text-base sm:text-sm" name={name} onChange={() => toggle(option.value)} type="checkbox" value={option.value} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SuccessState({ applicationNumber }: { applicationNumber: string }) {
  return (
    <section aria-live="polite" className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 sm:p-8">
      <CheckCircle2 className="size-10 text-primary" />
      <h2 className="mt-5 text-2xl font-semibold">Заявка отправлена на проверку</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Спасибо. После подтверждения на указанный email будет отправлена ссылка для создания или активации личного кабинета.</p>
      <p className="mt-5 text-sm text-muted-foreground">Номер заявки</p>
      <p className="mt-1 font-mono text-2xl font-semibold tracking-wide text-foreground">{applicationNumber}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button asChild><Link href="/cooperation">Вернуться к сотрудничеству <ArrowRight className="size-4" /></Link></Button>
        <Button asChild variant="outline"><Link href="/about">Об Ассоциации</Link></Button>
      </div>
    </section>
  );
}

function requiredFields(participantType: CooperationParticipantType, step: CooperationStep) {
  if (step === 1) {
    return participantType === "DOCTOR"
      ? [["lastName", "Фамилия"], ["firstName", "Имя"], ["phone", "Телефон"], ["email", "Email"]]
      : [["contactName", "Контактное лицо"], ["phone", "Телефон"], ["email", "Email"]];
  }
  if (step !== 2) return [];
  if (participantType === "CLINIC") return [["organizationName", "Название организации"], ["inn", "ИНН"], ["city", "Город"], ["contactPosition", "Должность"], ["interests", "Цели обращения"]];
  if (participantType === "DOCTOR") return [["city", "Город"], ["specialties", "Специализация"], ["interests", "Цели участия"]];
  return [["organizationName", "Название организации"], ["city", "Город"], ["contactPosition", "Должность"], ["partnerType", "Тип партнёра"], ["message", "Предложение по сотрудничеству"]];
}

function validateStep(participantType: CooperationParticipantType, step: CooperationStep, draft: CooperationDraft) {
  for (const [name, label] of requiredFields(participantType, step)) {
    if (isEmpty(draft[name])) return `Заполните поле «${label}»`;
  }
  if (participantType === "DOCTOR" && step === 2 && isEmpty(draft.workplace) && isEmpty(draft.customWorkplace)) {
    return "Укажите место работы или заполните поле «Моей клиники нет в списке»";
  }
  return null;
}

function draftDisplayValue(value: DraftValue | undefined) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Не заполнено";
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  if (value && typeof value === "object" && "name" in value) return value.name || "Файл выбран";
  return value?.trim() || "Не заполнено";
}

function reviewRows(participantType: CooperationParticipantType, draft: CooperationDraft) {
  const rows: Array<{ label: string; value: string }> = [];
  const add = (label: string, name: string, value = draft[name]) => rows.push({ label, value: draftDisplayValue(value) });
  if (participantType === "DOCTOR") {
    add("ФИО", "lastName", [stringValue(draft, "lastName"), stringValue(draft, "firstName"), stringValue(draft, "middleName")].filter(Boolean).join(" "));
    add("Телефон", "phone");
    add("Email", "email");
    add("Город", "city");
    add("Место работы", "workplace", stringValue(draft, "workplace") || stringValue(draft, "customWorkplace"));
    add("Учёная степень", "academicDegree");
    add("Профессиональная ссылка", "professionalUrl");
    add("Специализация", "specialties", labelsForCooperationValues(stringValues(draft, "specialties"), DOCTOR_SPECIALTY_OPTIONS).join(", "));
    add("Цели участия", "interests", labelsForCooperationValues(stringValues(draft, "interests"), DOCTOR_INTEREST_OPTIONS).join(", "));
  } else if (participantType === "CLINIC") {
    add("Организация", "organizationName");
    add("ИНН", "inn");
    add("Город", "city");
    add("Регион", "region");
    add("Сайт", "website");
    add("Контактное лицо", "contactName");
    add("Должность", "contactPosition");
    add("Телефон", "phone");
    add("Email", "email");
    add("Цели обращения", "interests", labelsForCooperationValues(stringValues(draft, "interests"), CLINIC_INTEREST_OPTIONS).join(", "));
  } else {
    add("Организация", "organizationName");
    add("Город", "city");
    add("Сайт", "website");
    add("Контактное лицо", "contactName");
    add("Должность", "contactPosition");
    add("Телефон", "phone");
    add("Email", "email");
    add("Тип партнёра", "partnerType", PARTNER_TYPE_OPTIONS.find((option) => option.value === stringValue(draft, "partnerType"))?.label);
    add("Предложение", "message");
    add("Вложение", "attachment");
  }
  return rows;
}

function appendDraftValue(data: FormData, name: string, value: DraftValue) {
  if (Array.isArray(value)) {
    value.forEach((item) => data.append(name, item));
  } else if (typeof value === "boolean") {
    if (value) data.set(name, "true");
  } else if (value instanceof File) {
    data.set(name, value);
  } else if (typeof value === "string" && value !== "") {
    data.set(name, value);
  }
}

export function CooperationApplicationForm({ participantType, tracking, clinics = [], onChangeRole, onStepChange }: { participantType: CooperationParticipantType; tracking: CooperationTracking; clinics?: ClinicOption[]; onChangeRole?: () => void; onStepChange?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const startedAt = useRef<number | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const startedTracked = useRef(false);
  const mountedStepRef = useRef(false);
  const [draft, setDraft] = useState<CooperationDraft>({});
  const [step, setStep] = useState<CooperationStep>(1);
  const [pending, setPending] = useState(false);
  const [successNumber, setSuccessNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    idempotencyKey.current = `${crypto.randomUUID()}-${Date.now()}`;
  }, []);

  useEffect(() => {
    if (!mountedStepRef.current) {
      mountedStepRef.current = true;
      return;
    }
    stepHeadingRef.current?.focus({ preventScroll: true });
    onStepChange?.();
  }, [onStepChange, step]);

  function setField(name: string, value: DraftValue) {
    setDraft((current) => ({ ...current, [name]: value }));
    setError(null);
  }

  function trackStart() {
    if (startedTracked.current) return;
    startedTracked.current = true;
    trackCooperationEvent("cooperation_form_started", { ...tracking, participantType });
  }

  function continueToNextStep() {
    setError(null);
    const form = formRef.current;
    if (form && !form.reportValidity()) return;
    const validationError = validateStep(participantType, step, draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep((current) => (current < 4 ? (current + 1) as CooperationStep : current));
  }

  function goBack() {
    setError(null);
    setStep((current) => (current > 1 ? (current - 1) as CooperationStep : current));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    trackCooperationEvent("cooperation_form_submitted", { ...tracking, participantType });
    const data = new FormData();
    data.set("source", tracking.source || "");
    data.set("landingUrl", tracking.landingUrl);
    data.set("pageTitle", tracking.pageTitle || "");
    data.set("referrer", tracking.referrer || "");
    data.set("utmSource", tracking.utmSource || "");
    data.set("utmMedium", tracking.utmMedium || "");
    data.set("utmCampaign", tracking.utmCampaign || "");
    data.set("utmContent", tracking.utmContent || "");
    data.set("participantType", participantType);
    data.set("websiteHoney", "");
    Object.entries(draft).forEach(([name, value]) => appendDraftValue(data, name, value));
    const submissionKey = idempotencyKey.current || `${crypto.randomUUID()}-${Date.now()}`;
    data.set("startedAt", String(startedAt.current || Date.now()));
    data.set("idempotencyKey", submissionKey);
    try {
      const response = await fetch("/api/cooperation/applications", { method: "POST", body: data, headers: { "Idempotency-Key": submissionKey } });
      const payload = await response.json().catch(() => ({})) as { success?: boolean; applicationNumber?: string; error?: string; fieldErrors?: Record<string, string> };
      if (!response.ok || !payload.success || !payload.applicationNumber) {
        const message = payload.error || Object.values(payload.fieldErrors || {})[0] || "Проверьте заполнение формы";
        setError(message);
        trackCooperationEvent("cooperation_form_error", { ...tracking, participantType });
        return;
      }
      setSuccessNumber(payload.applicationNumber);
      trackCooperationEvent("cooperation_application_created", { ...tracking, participantType });
    } catch {
      setError("Не удалось отправить заявку. Проверьте соединение и повторите попытку");
      trackCooperationEvent("cooperation_form_error", { ...tracking, participantType });
    } finally {
      setPending(false);
    }
  }

  if (successNumber) return <SuccessState applicationNumber={successNumber} />;

  return (
    <form ref={formRef} aria-labelledby="cooperation-wizard-title" className="space-y-7" data-cooperation-wizard onFocus={trackStart} onSubmit={submit}>
      <input name="source" type="hidden" value={tracking.source || ""} readOnly />
      <input name="landingUrl" type="hidden" value={tracking.landingUrl} readOnly />
      <input name="pageTitle" type="hidden" value={tracking.pageTitle || ""} readOnly />
      <input name="referrer" type="hidden" value={tracking.referrer || ""} readOnly />
      <input name="utmSource" type="hidden" value={tracking.utmSource || ""} readOnly />
      <input name="utmMedium" type="hidden" value={tracking.utmMedium || ""} readOnly />
      <input name="utmCampaign" type="hidden" value={tracking.utmCampaign || ""} readOnly />
      <input name="utmContent" type="hidden" value={tracking.utmContent || ""} readOnly />
      <input name="websiteHoney" tabIndex={-1} type="text" value="" onChange={() => undefined} aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden" autoComplete="off" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Анкета участия</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight" id="cooperation-wizard-title" ref={stepHeadingRef} tabIndex={-1}>{stepTitles[step - 1]}</h3>
          <p aria-live="polite" className="mt-2 text-sm font-medium text-muted-foreground">Шаг {step} из 4</p>
        </div>
        {onChangeRole && <Button onClick={onChangeRole} type="button" variant="outline">Изменить роль</Button>}
      </div>

      <ol aria-label="Этапы анкеты" className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {stepTitles.map((title, index) => {
          const stepNumber = index + 1;
          const isCurrent = stepNumber === step;
          const isComplete = stepNumber < step;
          return <li aria-current={isCurrent ? "step" : undefined} className="min-w-0" key={title}><div className={cn("h-1.5 rounded-full bg-muted transition-colors", isCurrent || isComplete ? "bg-primary" : "bg-muted")} /><span className={cn("mt-2 block truncate text-[10px] leading-4 sm:text-xs", isCurrent ? "font-semibold text-primary" : "text-muted-foreground")}>{stepNumber}. {title}</span></li>;
        })}
      </ol>

      {step === 1 && (
        <div aria-labelledby="cooperation-step-1" data-cooperation-step="1" id="cooperation-step-1" className="space-y-6">
          {participantType === "DOCTOR" ? (
            <>
              <div className="grid gap-5 md:grid-cols-3">
                <Field autoComplete="family-name" label="Фамилия" name="lastName" onChange={(value) => setField("lastName", value)} required value={stringValue(draft, "lastName")} />
                <Field autoComplete="given-name" label="Имя" name="firstName" onChange={(value) => setField("firstName", value)} required value={stringValue(draft, "firstName")} />
                <Field autoComplete="additional-name" label="Отчество" name="middleName" onChange={(value) => setField("middleName", value)} value={stringValue(draft, "middleName")} />
              </div>
            </>
          ) : (
            <Field autoComplete="name" label="Контактное лицо" name="contactName" onChange={(value) => setField("contactName", value)} required value={stringValue(draft, "contactName")} />
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field autoComplete="tel" label="Телефон" name="phone" onChange={(value) => setField("phone", value)} required type="tel" value={stringValue(draft, "phone")} />
            <Field autoComplete="email" label="Email" name="email" onChange={(value) => setField("email", value)} required type="email" value={stringValue(draft, "email")} />
          </div>
        </div>
      )}

      {step === 2 && participantType === "CLINIC" && (
        <div aria-labelledby="cooperation-step-2" data-cooperation-step="2" id="cooperation-step-2" className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field autoComplete="organization" label="Название организации" name="organizationName" onChange={(value) => setField("organizationName", value)} required value={stringValue(draft, "organizationName")} />
            <Field autoComplete="off" label="ИНН" name="inn" onChange={(value) => setField("inn", value)} placeholder="10 или 12 цифр" required value={stringValue(draft, "inn")} />
            <Field autoComplete="address-level2" label="Город" name="city" onChange={(value) => setField("city", value)} required value={stringValue(draft, "city")} />
            <Field autoComplete="address-level1" label="Регион" name="region" onChange={(value) => setField("region", value)} value={stringValue(draft, "region")} />
            <Field autoComplete="url" label="Сайт" name="website" onChange={(value) => setField("website", value)} placeholder="clinic.ru" value={stringValue(draft, "website")} />
            <Field autoComplete="organization-title" label="Должность" name="contactPosition" onChange={(value) => setField("contactPosition", value)} required value={stringValue(draft, "contactPosition")} />
          </div>
          <CheckList label="Цели обращения" name="interests" onChange={(value) => setField("interests", value)} options={CLINIC_INTEREST_OPTIONS} required values={stringValues(draft, "interests")} />
          <label className="block"><span className={labelClass}>Сообщение <span className="text-muted-foreground">(необязательно)</span></span><textarea className={`${inputClass} min-h-32 resize-y`} name="message" onChange={(event) => setField("message", event.target.value)} value={stringValue(draft, "message")} /></label>
        </div>
      )}

      {step === 2 && participantType === "DOCTOR" && (
        <div aria-labelledby="cooperation-step-2" data-cooperation-step="2" id="cooperation-step-2" className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field autoComplete="address-level2" label="Город" name="city" onChange={(value) => setField("city", value)} required value={stringValue(draft, "city")} />
            <Field autoComplete="address-level1" label="Регион" name="region" onChange={(value) => setField("region", value)} value={stringValue(draft, "region")} />
            <label className="block"><span className={labelClass}>Место работы</span><input className={inputClass} list="cooperation-clinics" name="workplace" onChange={(event) => setField("workplace", event.target.value)} placeholder="Выберите клинику или организацию" value={stringValue(draft, "workplace")} /><datalist id="cooperation-clinics">{clinics.map((clinic) => <option key={clinic.title} value={clinic.title}>{clinic.description}</option>)}</datalist></label>
            <Field label="Моей клиники нет в списке" name="customWorkplace" onChange={(value) => setField("customWorkplace", value)} value={stringValue(draft, "customWorkplace")} />
            <SelectField label="Учёная степень" name="academicDegree" onChange={(value) => setField("academicDegree", value)} options={ACADEMIC_DEGREE_OPTIONS} value={stringValue(draft, "academicDegree")} />
            <Field label="Профессиональная ссылка" name="professionalUrl" onChange={(value) => setField("professionalUrl", value)} placeholder="Сайт профиля, ORCID или публикации" value={stringValue(draft, "professionalUrl")} />
          </div>
          <CheckList label="Специализация" name="specialties" onChange={(value) => setField("specialties", value)} options={DOCTOR_SPECIALTY_OPTIONS} required values={stringValues(draft, "specialties")} />
          <CheckList label="Цели участия" name="interests" onChange={(value) => setField("interests", value)} options={DOCTOR_INTEREST_OPTIONS} required values={stringValues(draft, "interests")} />
          <label className="block"><span className={labelClass}>Сообщение <span className="text-muted-foreground">(необязательно)</span></span><textarea className={`${inputClass} min-h-32 resize-y`} name="message" onChange={(event) => setField("message", event.target.value)} value={stringValue(draft, "message")} /></label>
        </div>
      )}

      {step === 2 && participantType === "PARTNER" && (
        <div aria-labelledby="cooperation-step-2" data-cooperation-step="2" id="cooperation-step-2" className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field autoComplete="organization" label="Название организации" name="organizationName" onChange={(value) => setField("organizationName", value)} required value={stringValue(draft, "organizationName")} />
            <Field autoComplete="off" label="ИНН" name="inn" onChange={(value) => setField("inn", value)} placeholder="10 или 12 цифр" value={stringValue(draft, "inn")} />
            <Field autoComplete="url" label="Сайт" name="website" onChange={(value) => setField("website", value)} placeholder="company.ru" value={stringValue(draft, "website")} />
            <Field autoComplete="address-level2" label="Город" name="city" onChange={(value) => setField("city", value)} required value={stringValue(draft, "city")} />
            <Field autoComplete="address-level1" label="Регион" name="region" onChange={(value) => setField("region", value)} value={stringValue(draft, "region")} />
            <Field autoComplete="organization-title" label="Должность" name="contactPosition" onChange={(value) => setField("contactPosition", value)} required value={stringValue(draft, "contactPosition")} />
          </div>
          <SelectField label="Тип партнёра" name="partnerType" onChange={(value) => setField("partnerType", value)} options={PARTNER_TYPE_OPTIONS} required value={stringValue(draft, "partnerType")} />
          <label className="block"><span className={labelClass}>Предложение по сотрудничеству<span className="ml-1 text-destructive" aria-hidden="true">*</span></span><textarea className={`${inputClass} min-h-36`} name="message" onChange={(event) => setField("message", event.target.value)} placeholder="Кратко опишите задачу, продукт или формат взаимодействия" required value={stringValue(draft, "message")} /></label>
          <label className="block"><span className={labelClass}>Презентация или предложение <span className="text-muted-foreground">(необязательно)</span></span><span className="mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-dashed border-border px-3.5 text-sm text-muted-foreground"><FileText className="size-4" /><input accept={COOPERATION_ATTACHMENT_ACCEPT} className="min-w-0 flex-1 text-base sm:text-sm" name="attachment" onChange={(event: ChangeEvent<HTMLInputElement>) => setField("attachment", event.target.files?.[0] || null)} type="file" /></span><span className="mt-2 block text-xs leading-5 text-muted-foreground">PDF или DOCX, до 10 МБ.{draft.attachment && typeof draft.attachment === "object" && "name" in draft.attachment ? ` Выбран файл: ${draft.attachment.name}` : ""}</span></label>
        </div>
      )}

      {step === 3 && (
        <section aria-labelledby="cooperation-review-title" data-cooperation-step="3" id="cooperation-review" className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-6">
          <h4 className="text-lg font-semibold" id="cooperation-review-title">Проверьте введённые данные</h4>
          <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">{reviewRows(participantType, draft).map((row) => <div key={row.label}><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{row.label}</dt><dd className="mt-1 break-words text-sm text-foreground">{row.value}</dd></div>)}</dl>
          <div className="mt-6 flex flex-wrap gap-3 border-t border-border/70 pt-5">
            <Button onClick={() => setStep(1)} type="button" variant="outline">Изменить контактные данные</Button>
            <Button onClick={() => setStep(2)} type="button" variant="outline">Изменить сведения</Button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section aria-labelledby="cooperation-consent-title" data-cooperation-step="4" id="cooperation-consent" className="space-y-4">
          <h4 className="text-lg font-semibold" id="cooperation-consent-title">Согласие и отправка</h4>
          <label className="flex items-start gap-3 text-sm leading-5 text-muted-foreground"><input checked={draft.consentPersonalData === true} className="mt-1 size-4 accent-primary text-base sm:text-sm" name="consentPersonalData" onChange={(event) => setField("consentPersonalData", event.target.checked)} required type="checkbox" value="true" /><span>Я согласен(на) на обработку персональных данных в соответствии с <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/privacy-policy">политикой обработки персональных данных</Link>.</span></label>
          <label className="flex items-start gap-3 text-sm leading-5 text-muted-foreground"><input checked={draft.consentMarketing === true} className="mt-1 size-4 accent-primary text-base sm:text-sm" name="consentMarketing" onChange={(event) => setField("consentMarketing", event.target.checked)} type="checkbox" value="true" /><span>Согласен(на) получать новости и приглашения Ассоциации.</span></label>
          <p className="text-sm leading-6 text-muted-foreground">Отправка заявки не означает автоматического вступления в Ассоциацию и не создаёт аккаунт или публичный профиль.</p>
        </section>
      )}

      <div className="space-y-4 border-t border-border/80 pt-6">
        <p aria-live="polite" className="min-h-5 text-sm text-destructive">{error}</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button disabled={step === 1 || pending} onClick={goBack} type="button" variant="outline">Назад</Button>
          {step < 4 ? <Button onClick={continueToNextStep} type="button">Продолжить <ArrowRight className="size-4" /></Button> : <Button disabled={pending} type="submit">{pending && <Loader2 className="size-4 animate-spin" />}{pending ? "Отправляем заявку…" : "Отправить заявку"}</Button>}
        </div>
      </div>
    </form>
  );
}
