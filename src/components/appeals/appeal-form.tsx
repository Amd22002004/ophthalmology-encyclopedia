"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, FileUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  APPEAL_CATEGORY_OPTIONS,
  REPORTER_ROLE_OPTIONS,
  REQUESTED_ACTION_OPTIONS,
} from "@/lib/appeals/constants";

type InvestigationOption = { slug: string; title: string };
type ConsentConfiguration = {
  id: string;
  version: string;
  title: string;
  body: string;
  requiresApproval: boolean;
};

type SubmitState = {
  pending: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  publicNumber: string | null;
};

const labelClass = "mb-1.5 block text-sm font-medium text-foreground";
const helpClass = "mt-1 text-xs leading-5 text-muted-foreground";
const controlClass = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function CheckboxGroup({
  name,
  options,
  error,
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  error?: string;
}) {
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label className="flex cursor-pointer items-start gap-2 rounded-md border bg-background p-3 text-sm leading-5" key={option.value}>
            <input className="mt-1 h-4 w-4 accent-primary" name={name} type="checkbox" value={option.value} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AppealForm({
  investigations,
  consent,
  initialInvestigationSlug,
}: {
  investigations: InvestigationOption[];
  consent: ConsentConfiguration;
  initialInvestigationSlug: string;
}) {
  const [state, setState] = useState<SubmitState>({
    pending: false,
    error: null,
    fieldErrors: {},
    publicNumber: null,
  });
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ pending: true, error: null, fieldErrors: {}, publicNumber: null });
    const form = event.currentTarget;

    try {
      const response = await fetch("/api/appeals", { method: "POST", body: new FormData(form) });
      const result = (await response.json()) as {
        error?: string;
        fieldErrors?: Record<string, string>;
        publicNumber?: string;
      };
      if (!response.ok || !result.publicNumber) {
        setState({
          pending: false,
          error: result.error || "Не удалось отправить обращение",
          fieldErrors: result.fieldErrors || {},
          publicNumber: null,
        });
        return;
      }
      form.reset();
      setSelectedFiles([]);
      setState({ pending: false, error: null, fieldErrors: {}, publicNumber: result.publicNumber });
    } catch {
      setState({ pending: false, error: "Не удалось связаться с сервером. Повторите попытку", fieldErrors: {}, publicNumber: null });
    }
  }

  if (state.publicNumber) {
    return (
      <Card className="border-primary/30">
        <CardContent className="flex gap-3 pt-5">
          <CheckCircle2 aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Обращение зарегистрировано</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Публичный номер: <strong className="font-mono text-foreground">{state.publicNumber}</strong>
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Сохраните номер. Материалы переданы в закрытый реестр Ассоциации для индивидуального рассмотрения.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form className="space-y-5" encType="multipart/form-data" onSubmit={handleSubmit}>
      <input name="consentTemplateId" type="hidden" value={consent.id} />
      <div aria-hidden className="hidden">
        <label htmlFor="appeal-website">Сайт</label>
        <input autoComplete="off" id="appeal-website" name="website" tabIndex={-1} type="text" />
      </div>

      <Card>
        <CardHeader><CardTitle>Контактные данные</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="appeal-name">Имя *</label>
            <Input autoComplete="name" id="appeal-name" name="name" required />
            {state.fieldErrors.name && <p className="mt-1 text-xs text-destructive">{state.fieldErrors.name}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="appeal-city">Город</label>
            <Input autoComplete="address-level2" id="appeal-city" name="city" />
          </div>
          <div>
            <label className={labelClass} htmlFor="appeal-phone">Телефон</label>
            <Input autoComplete="tel" id="appeal-phone" name="phone" type="tel" />
            {state.fieldErrors.phone && <p className="mt-1 text-xs text-destructive">{state.fieldErrors.phone}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="appeal-email">Email</label>
            <Input autoComplete="email" id="appeal-email" name="email" type="email" />
            {state.fieldErrors.email && <p className="mt-1 text-xs text-destructive">{state.fieldErrors.email}</p>}
          </div>
          {state.fieldErrors.contact && <p className="text-xs text-destructive sm:col-span-2">{state.fieldErrors.contact}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Связь с расследованием</CardTitle></CardHeader>
        <CardContent>
          <label className={labelClass} htmlFor="appeal-investigation">Расследование</label>
          <select className={controlClass} defaultValue={initialInvestigationSlug} id="appeal-investigation" name="investigationSlug">
            <option value="">Общее обращение без выбранного расследования</option>
            {investigations.map((investigation) => (
              <option key={investigation.slug} value={investigation.slug}>{investigation.title}</option>
            ))}
          </select>
          <p className={helpClass}>Контекст из новости или расследования заполняется автоматически и проверяется сервером.</p>
          {state.fieldErrors.investigation && <p className="mt-1 text-xs text-destructive">{state.fieldErrors.investigation}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ваша связь с ситуацией</CardTitle></CardHeader>
        <CardContent><CheckboxGroup error={state.fieldErrors.reporterRoles} name="reporterRoles" options={REPORTER_ROLE_OPTIONS} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Категории обращения</CardTitle></CardHeader>
        <CardContent><CheckboxGroup error={state.fieldErrors.categories} name="categories" options={APPEAL_CATEGORY_OPTIONS} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Опишите ситуацию</CardTitle></CardHeader>
        <CardContent>
          <label className={labelClass} htmlFor="appeal-description">Основное обращение *</label>
          <textarea className={`${controlClass} min-h-48 resize-y leading-6`} id="appeal-description" maxLength={20000} name="description" required />
          <p className={helpClass}>Укажите обстоятельства последовательно. Не передавайте пароли и данные, не относящиеся к обращению.</p>
          {state.fieldErrors.description && <p className="mt-1 text-xs text-destructive">{state.fieldErrors.description}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Что вы ожидаете от рассмотрения</CardTitle></CardHeader>
        <CardContent><CheckboxGroup error={state.fieldErrors.requestedActions} name="requestedActions" options={REQUESTED_ACTION_OPTIONS} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Дополнительные сведения</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="appeal-operation-date">Дата операции или лечения</label>
            <Input id="appeal-operation-date" name="operationDate" type="date" />
          </div>
          <div>
            <label className={labelClass} htmlFor="appeal-clinic">Название клиники</label>
            <Input id="appeal-clinic" name="reportedClinicName" />
          </div>
          <div>
            <label className={labelClass} htmlFor="appeal-doctor">Врач, если известен</label>
            <Input id="appeal-doctor" name="reportedDoctorName" />
          </div>
          <div>
            <label className={labelClass} htmlFor="appeal-equipment">Модель оборудования, если известна</label>
            <Input id="appeal-equipment" name="reportedEquipmentName" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Документы и фотографии</CardTitle></CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed bg-muted/20 p-4" htmlFor="appeal-files">
            <FileUp aria-hidden className="h-5 w-5 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-medium text-foreground">Выбрать файлы</span>
              <span className="mt-1 block text-xs text-muted-foreground">PDF, DOC, DOCX, JPEG, PNG или ZIP. До 10 файлов, общий размер до 40 МБ.</span>
            </span>
          </label>
          <input
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
            className="sr-only"
            id="appeal-files"
            multiple
            name="attachments"
            onChange={(event) => setSelectedFiles(Array.from(event.currentTarget.files ?? [], (file) => file.name))}
            type="file"
          />
          <p aria-live="polite" className={`${helpClass} break-words`}>
            {selectedFiles.length > 0
              ? `Выбрано файлов: ${selectedFiles.length}. ${selectedFiles.join(", ")}`
              : "Файлы не выбраны."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Коллективное информирование</CardTitle></CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
            <input className="mt-1 h-4 w-4 shrink-0 accent-primary" name="collectiveInterest" type="checkbox" />
            <span>Я заинтересован(а) в коллективной защите своих прав и прошу уведомить меня, если по данному расследованию будет формироваться коллективное обращение.</span>
          </label>
          <p className={helpClass}>Этот выбор не означает автоматического присоединения к иску или иному коллективному процессу.</p>
        </CardContent>
      </Card>

      <Card className={consent.requiresApproval ? "border-amber-300" : undefined}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <CardTitle>{consent.title}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Версия: {consent.version}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {consent.requiresApproval && (
            <p className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
              Конфигурация содержит поля, требующие утверждения и заполнения уполномоченным лицом.
            </p>
          )}
          <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">{consent.body}</div>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-6">
            <input className="mt-1 h-4 w-4 shrink-0 accent-primary" name="consentAccepted" required type="checkbox" />
            <span>Я ознакомился(ась) с отображаемой выше версией согласия и принимаю её условия.</span>
          </label>
          {state.fieldErrors.consent && <p className="mt-2 text-xs text-destructive">{state.fieldErrors.consent}</p>}
        </CardContent>
      </Card>

      {state.error && (
        <p aria-live="assertive" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</p>
      )}

      <Button className="w-full sm:w-auto" disabled={state.pending} size="lg" type="submit">
        {state.pending ? "Сохраняем обращение…" : "Отправить обращение"}
      </Button>
    </form>
  );
}
