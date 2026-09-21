"use client";

import { ArrowRight, Building2, Check, Handshake, Stethoscope } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CooperationApplicationForm } from "./cooperation-application-form";
import { scheduleCooperationApplicationScroll } from "./cooperation-scroll";
import { trackCooperationEvent } from "@/lib/cooperation/analytics";
import type { CooperationParticipantType } from "@/lib/cooperation/constants";
import type { CooperationTracking } from "@/lib/cooperation/tracking";
import { cn } from "@/lib/utils";

const roles: Array<{
  type: CooperationParticipantType;
  title: string;
  mobileDescription: string;
  description: string;
  benefits: string[];
  icon: typeof Building2;
}> = [
  {
    type: "CLINIC",
    title: "Клиника",
    mobileDescription: "Для медицинских организаций и офтальмологических центров.",
    description: "Представьте клинику в профессиональной среде Ассоциации и подтвердите информацию об учреждении.",
    benefits: ["профиль клиники", "информация об учреждении", "связь с сотрудниками", "участие в профессиональной инфраструктуре Ассоциации"],
    icon: Building2,
  },
  {
    type: "DOCTOR",
    title: "Врач / специалист",
    mobileDescription: "Для врачей-офтальмологов и профильных специалистов.",
    description: "Присоединитесь к профессиональной среде и получите возможность развивать подтверждённый профиль.",
    benefits: ["профессиональный профиль", "публикации и научные работы", "участие в профессиональном сообществе", "связь с существующей карточкой врача"],
    icon: Stethoscope,
  },
  {
    type: "PARTNER",
    title: "Партнёр / поставщик",
    mobileDescription: "Для поставщиков оборудования, технологий и профессиональных услуг.",
    description: "Предложите Ассоциации отраслевое, научное, образовательное или технологическое сотрудничество.",
    benefits: ["профиль компании", "оборудование и технологии", "профессиональные контакты", "присутствие в отраслевом справочнике"],
    icon: Handshake,
  },
];

const processSteps = [
  "Проверяем заявку",
  "Подтверждаем профиль",
  "Вы получаете приглашение",
  "Создаёте пароль и входите в личный кабинет",
] as const;

const processDisclaimer =
  "Отправка заявки не означает автоматического вступления в Ассоциацию и не создаёт аккаунт или публичный профиль. Сведения рассматриваются отдельно после проверки.";

type ClinicOption = { title: string; description: string };

export function CooperationLanding({
  tracking,
  clinics = [],
}: {
  tracking: CooperationTracking;
  clinics?: ClinicOption[];
}) {
  const [selectedRole, setSelectedRole] = useState<CooperationParticipantType | null>(null);
  const [expandedRole, setExpandedRole] = useState<CooperationParticipantType | null>(null);
  const selectedRoleData = roles.find((role) => role.type === selectedRole) ?? null;
  const rolesSectionRef = useRef<HTMLElement>(null);
  const applicationSectionRef = useRef<HTMLElement>(null);
  const focusRolesAfterChangeRef = useRef(false);

  useEffect(() => {
    trackCooperationEvent("cooperation_page_view", tracking);
  }, [tracking]);

  useEffect(() => {
    if (!selectedRoleData || typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) {
      scheduleCooperationApplicationScroll(applicationSectionRef.current, true, (callback) => {
        window.setTimeout(() => window.requestAnimationFrame(callback), 350);
      }, window);
      return;
    }
    window.requestAnimationFrame(() => {
      applicationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [selectedRoleData]);

  useEffect(() => {
    if (selectedRoleData || !focusRolesAfterChangeRef.current) return;
    focusRolesAfterChangeRef.current = false;
    window.requestAnimationFrame(() => {
      rolesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      rolesSectionRef.current?.querySelector<HTMLButtonElement>("[data-cooperation-role]")?.focus();
    });
  }, [selectedRoleData]);

  function changeRole() {
    focusRolesAfterChangeRef.current = true;
    setSelectedRole(null);
  }

  const scrollApplicationOnStepChange = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia("(min-width: 768px)").matches) return;
    scheduleCooperationApplicationScroll(applicationSectionRef.current, true, (callback) => {
      window.requestAnimationFrame(callback);
    }, window);
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-4 lg:space-y-6">
        <section
          aria-labelledby="cooperation-hero-title"
          className="cooperation-hero relative isolate flex min-h-[205px] items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-card px-3 py-5 text-center shadow-sm sm:min-h-[260px] sm:px-8 sm:py-8 lg:min-h-[280px]"
          id="cooperation-hero"
        >
          <div aria-hidden="true" className="cooperation-hero-art absolute inset-0" />
          <div className="relative z-10 mx-auto max-w-2xl rounded-2xl border border-white/80 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-[2px] sm:px-8 sm:py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary sm:text-xs sm:tracking-[0.18em]">УЧАСТИЕ И СОТРУДНИЧЕСТВО</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:mt-3 sm:text-3xl lg:text-4xl" id="cooperation-hero-title">Выберите формат участия</h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-muted-foreground sm:mt-3 sm:text-base sm:leading-6">
              После выбора откроется подходящая анкета.
            </p>
          </div>
        </section>

        <section ref={rolesSectionRef} id="cooperation-opportunities" aria-labelledby="cooperation-roles-title" className="scroll-mt-24">
          <h2 className="sr-only" id="cooperation-roles-title">Форматы участия</h2>
          <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.type;
            const isExpanded = expandedRole === role.type;
            return (
              <div className="relative h-full min-w-0" key={role.type}>
                <button
                  aria-pressed={isSelected}
                  className={cn(
                    "group flex h-full w-full min-w-0 cursor-pointer flex-col rounded-2xl border bg-card pr-14 text-left text-card-foreground shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-primary/70 hover:shadow-md hover:ring-2 hover:ring-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.995] lg:pr-0",
                    isSelected ? "border-primary bg-primary/[0.04] shadow-md ring-2 ring-primary/25" : "border-border/80",
                  )}
                  data-cooperation-role={role.type}
                  onClick={() => {
                    setSelectedRole(role.type);
                    trackCooperationEvent("cooperation_role_selected", { ...tracking, participantType: role.type });
                  }}
                  type="button"
                >
                  <div className="flex min-h-full flex-1 flex-col p-3 lg:p-6">
                    <div className="flex items-center gap-3 lg:block">
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-primary transition-colors lg:size-12 lg:rounded-2xl", isSelected ? "bg-primary/15" : "bg-primary/10 group-hover:bg-primary/15")}>
                        <Icon aria-hidden="true" className="size-5 lg:size-6" />
                      </div>
                      <h3 className="min-w-0 flex-1 text-base font-semibold lg:mt-6 lg:text-xl">{role.title}</h3>
                      {isSelected && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground lg:hidden"><Check aria-hidden="true" className="size-3" /> Выбрано</span>}
                    </div>
                    <p className={cn("mt-2 text-xs leading-5 text-muted-foreground lg:hidden", isExpanded && "hidden")}>{role.mobileDescription}</p>
                    <div
                      className={cn("grid transition-[grid-template-rows] duration-300 ease-out lg:block", isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr] lg:grid-rows-[1fr]")}
                      data-role-details
                      id={`cooperation-role-details-${role.type}`}
                    >
                      <div className="min-h-0 overflow-hidden lg:flex lg:flex-1 lg:flex-col lg:overflow-visible">
                        <p className="mt-2 text-sm leading-6 text-muted-foreground lg:mt-3">{role.description}</p>
                        <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground lg:mt-5 lg:flex-1" data-role-benefits>
                          {role.benefits.map((benefit) => <li className="flex items-start gap-2" key={benefit}><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" /> <span>{benefit}</span></li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 hidden min-h-8 items-center justify-between gap-3 border-t border-border/70 pt-3 lg:mt-6 lg:flex lg:min-h-10 lg:pt-4">
                      <span className={cn("hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold opacity-0 transition-opacity duration-300 lg:inline-flex lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100", isSelected ? "bg-primary text-primary-foreground opacity-100" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary")}>
                        {isSelected && <Check aria-hidden="true" className="size-3.5" />}
                        {isSelected ? "Выбрано" : "Выбрать формат"}
                      </span>
                      <ArrowRight aria-hidden="true" className="ml-auto hidden size-4 text-primary transition-transform group-hover:translate-x-1 lg:block" />
                    </div>
                  </div>
                </button>
                <button
                  aria-controls={`cooperation-role-details-${role.type}`}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Скрыть описание" : "Показать описание"}
                  className="absolute right-2 top-2 z-10 inline-flex size-11 items-center justify-center rounded-xl text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:hidden"
                  data-cooperation-role-toggle={role.type}
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpandedRole((current) => current === role.type ? null : role.type);
                  }}
                  type="button"
                >
                  <ArrowRight aria-hidden="true" className={cn("size-5 transition-transform duration-300", isExpanded && "rotate-90")} />
                </button>
              </div>
            );
          })}
          </div>

          <div
            aria-hidden={Boolean(selectedRoleData)}
            className={cn(
              "grid overflow-hidden transition-[grid-template-rows,opacity,margin-top] duration-300 ease-out",
              selectedRoleData ? "pointer-events-none mt-0 grid-rows-[0fr] opacity-0" : "mt-8 grid-rows-[1fr] opacity-100",
            )}
            data-cooperation-process
          >
            <div className="min-h-0 overflow-hidden">
              <section aria-labelledby="cooperation-process-title" className="rounded-2xl border bg-muted/30 p-4 shadow-sm sm:p-6">
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Понятный процесс</p>
                  <h3 id="cooperation-process-title" className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Что дальше?</h3>
                </div>
                <ol className="mt-5 grid gap-4 sm:grid-cols-4 sm:gap-5">
                  {processSteps.map((step, index) => (
                    <li className="flex flex-col items-center text-center" key={step}>
                      <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span>
                      <span className="mt-2 max-w-xs text-sm font-medium leading-5 text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-6 text-muted-foreground">{processDisclaimer}</p>
              </section>
            </div>
          </div>
        </section>
      </div>

      {selectedRoleData && (
        <section ref={applicationSectionRef} aria-labelledby="cooperation-application-title" className="scroll-mt-24 rounded-2xl border border-primary/25 bg-card p-5 shadow-sm sm:p-8 lg:min-h-[calc(100svh-6rem)]" id="cooperation-application">
          <div className="flex flex-col gap-4 border-b border-primary/15 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Выбранный формат</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight" id="cooperation-application-title">Заявка: {selectedRoleData.title}</h2>
              <p aria-live="polite" className="mt-2 text-sm leading-6 text-muted-foreground">Роль выбрана. Заполните пошаговую анкету ниже.</p>
            </div>
            <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"><Check aria-hidden="true" className="size-3.5" /> Выбрано</span>
          </div>
          <div className="pt-7">
            <CooperationApplicationForm key={selectedRoleData.type} clinics={clinics} onChangeRole={changeRole} onStepChange={scrollApplicationOnStepChange} participantType={selectedRoleData.type} tracking={tracking} />
          </div>
        </section>
      )}
    </div>
  );
}
