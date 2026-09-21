"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trackEventAnalytics } from "./event-analytics";
import { EVENT_SPECIALTY_OPTIONS } from "@/lib/events/registration-validation";
import { STO_2026_EVENT_SLUG } from "@/lib/events/sto-2026";

type Props = { eventSlug?: string };

function createIdempotencyKey() {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `sto-2026-${random}`;
}

export function EventRegistrationForm({ eventSlug = STO_2026_EVENT_SLUG }: Props) {
  const [startedAt] = useState(() => Date.now());
  const [specialty, setSpecialty] = useState("");
  const [pending, setPending] = useState(false);
  const [successNumber, setSuccessNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError(null);
    setFieldErrors({});
    trackEventAnalytics("event_registration_started", { eventSlug });

    const formData = new FormData(form);
    const query = new URLSearchParams(window.location.search);
    const trackingFields = {
      utm_source: "utmSource",
      utm_medium: "utmMedium",
      utm_campaign: "utmCampaign",
      utm_content: "utmContent",
    } as const;
    for (const [key, field] of Object.entries(trackingFields)) {
      const value = query.get(key);
      if (value && !formData.get(field)) formData.set(field, value);
    }
    formData.set("startedAt", String(startedAt));

    try {
      const response = await fetch(`/api/events/${eventSlug}/register`, {
        method: "POST",
        body: formData,
        headers: { "idempotency-key": createIdempotencyKey() },
      });
      const payload = (await response.json()) as { success?: boolean; registrationNumber?: string; error?: string; fieldErrors?: Record<string, string> };
      if (!response.ok) {
        setError(payload.error || "Не удалось отправить регистрацию");
        setFieldErrors(payload.fieldErrors || {});
        trackEventAnalytics("event_registration_error", { eventSlug, source: payload.error || "validation" });
        return;
      }
      setSuccessNumber(payload.registrationNumber || null);
      trackEventAnalytics("event_registration_completed", { eventSlug });
    } catch {
      setError("Не удалось связаться с сервером. Повторите попытку");
      trackEventAnalytics("event_registration_error", { eventSlug, source: "network" });
    } finally {
      setPending(false);
    }
  }

  if (successNumber !== null) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Готово</p>
        <h2 className="mt-2 text-xl font-semibold">Регистрация получена</h2>
        <p className="mt-2 text-sm leading-6">Номер регистрации: {successNumber}. Подтверждение отправлено на указанный email, если email-outbox настроен.</p>
      </section>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        Участие бесплатное. Обязательные поля отмечены <span className="text-destructive">*</span>.
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p> : null}

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium" htmlFor="event-full-name">
          ФИО <span className="text-destructive">*</span>
          <input id="event-full-name" name="fullName" required maxLength={180} autoComplete="name" enterKeyHint="next" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {fieldErrors.fullName ? <span className="font-normal text-destructive">{fieldErrors.fullName}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="event-phone">
          Телефон <span className="text-destructive">*</span>
          <input id="event-phone" name="phone" required type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" maxLength={80} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {fieldErrors.phone ? <span className="font-normal text-destructive">{fieldErrors.phone}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="event-email">
          Email <span className="text-destructive">*</span>
          <input id="event-email" name="email" required type="email" inputMode="email" autoComplete="email" enterKeyHint="next" maxLength={254} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {fieldErrors.email ? <span className="font-normal text-destructive">{fieldErrors.email}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="event-city">
          Город
          <input id="event-city" name="city" maxLength={160} autoComplete="address-level2" enterKeyHint="next" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="event-specialty">
          Специализация <span className="text-destructive">*</span>
          <select id="event-specialty" name="specialty" required value={specialty} onChange={(event) => setSpecialty(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Выберите вариант</option>
            {EVENT_SPECIALTY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {fieldErrors.specialty ? <span className="font-normal text-destructive">{fieldErrors.specialty}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="event-custom-specialty" hidden={specialty !== "other"}>
          Укажите специализацию <span className="text-destructive">*</span>
          <input id="event-custom-specialty" name="customSpecialty" disabled={specialty !== "other"} required={specialty === "other"} maxLength={160} enterKeyHint="next" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {fieldErrors.customSpecialty ? <span className="font-normal text-destructive">{fieldErrors.customSpecialty}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="event-organization">
          Название организации <span className="text-destructive">*</span>
          <input id="event-organization" name="organization" required maxLength={240} autoComplete="organization" enterKeyHint="next" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {fieldErrors.organization ? <span className="font-normal text-destructive">{fieldErrors.organization}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="event-position">
          Должность
          <input id="event-position" name="position" maxLength={180} autoComplete="organization-title" enterKeyHint="next" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="event-comment">
          Комментарий
          <textarea id="event-comment" name="comment" maxLength={4_000} rows={4} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm leading-6" htmlFor="event-consent">
        <input id="event-consent" name="consentPersonalData" type="checkbox" value="true" required className="mt-1 h-4 w-4 rounded border-input" />
        <span>
          <span>Согласен(на) на обработку персональных данных для регистрации на конференцию.</span>{" "}
          <Link className="text-primary underline underline-offset-2" href="/privacy-policy">
            Политика обработки персональных данных сайта
          </Link>{" "}
          <span className="text-destructive">*</span>
        </span>
      </label>
      {fieldErrors.consentPersonalData ? <p className="text-sm text-destructive">{fieldErrors.consentPersonalData}</p> : null}

      <input type="hidden" name="startedAt" value={startedAt} readOnly />
      <input type="hidden" name="source" value="event_page" readOnly />
      <input type="text" name="websiteHoney" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true" />

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Отправляем…" : "Зарегистрироваться"}
      </Button>
    </form>
  );
}
