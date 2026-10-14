import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SchemaOrg } from "@/components/seo/schema-org";
import { Card, CardContent } from "@/components/ui/card";
import { CooperationApplicationForm } from "./cooperation-application-form";
import { associationClinicsPage, associationDoctorsPage } from "@/lib/association-content";
import type { CooperationParticipantType } from "@/lib/cooperation/constants";
import type { CooperationTracking } from "@/lib/cooperation/tracking";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

const copy: Record<CooperationParticipantType, { eyebrow: string; title: string; description: string; note: string }> = {
  CLINIC: { eyebrow: "Заявка от клиники", title: "Сотрудничество для клиник", description: "Расскажите об организации и целях участия в профессиональном сообществе офтальмологии.", note: "Заявка поможет Ассоциации понять профиль организации и предложить следующий шаг после проверки сведений." },
  DOCTOR: { eyebrow: "Заявка врача или эксперта", title: "Сотрудничество для врачей и экспертов", description: "Подайте заявку на участие в профессиональном сообществе без заполнения полного резюме или загрузки документов.", note: "Профессиональный профиль создаётся только после отдельного решения и приглашения — отправка формы сама по себе его не создаёт." },
  PARTNER: { eyebrow: "Заявка поставщика или технологического партнёра", title: "Сотрудничество для поставщиков и технологических партнёров", description: "Предложите Ассоциации отраслевой, научный, образовательный или технологический проект.", note: "Заявка проходит проверку. Полноценная карточка поставщика не создаётся автоматически и появляется только после отдельного решения." },
};

type AudiencePage = typeof associationClinicsPage | typeof associationDoctorsPage;

// Клиника и врач получают страницу «Для клиник» / «Для врачей»: утверждённые
// выгоды стоят перед анкетой на том же каноническом маршруте, без второй витрины.
const audiencePages: Partial<Record<CooperationParticipantType, AudiencePage>> = {
  CLINIC: associationClinicsPage,
  DOCTOR: associationDoctorsPage,
};

function AudienceBenefits({ page }: { page: AudiencePage }) {
  return (
    <section aria-label={page.title} className="space-y-5">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {page.benefits.map((benefit, index) => (
          <li className="h-full rounded-lg border bg-card p-5 shadow-sm" key={benefit.title}>
            <span aria-hidden="true" className="text-sm font-semibold tabular-nums text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="mt-2 text-base font-semibold leading-6">{benefit.title}</h2>
            {"body" in benefit && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{benefit.body}</p>}
          </li>
        ))}
      </ul>
      <p className="rounded-lg border-l-4 border-primary bg-primary/[0.04] px-5 py-4 text-base font-semibold leading-7 text-foreground">
        {page.closing}
      </p>
    </section>
  );
}

function ApplicationLayout({ content, participantType, tracking, clinics }: { content: (typeof copy)[CooperationParticipantType]; participantType: CooperationParticipantType; tracking: CooperationTracking; clinics?: { title: string; description: string }[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="min-w-0"><CardContent className="min-w-0 p-5 sm:p-8"><CooperationApplicationForm clinics={clinics} participantType={participantType} tracking={tracking} /></CardContent></Card>
      <aside className="h-fit rounded-2xl border bg-muted/30 p-5 sm:p-6"><p className="text-sm font-semibold">Перед отправкой</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{content.note}</p><div className="mt-5 border-t pt-5 text-sm leading-6 text-muted-foreground"><p>Обязательные поля отмечены <span className="text-destructive">*</span>.</p><p className="mt-2">Мы не просим загружать паспорт, диплом или полное резюме.</p></div></aside>
    </div>
  );
}

export function CooperationRolePage({ participantType, tracking, clinics }: { participantType: CooperationParticipantType; tracking: CooperationTracking; clinics?: { title: string; description: string }[] }) {
  const content = copy[participantType];
  const audiencePage = audiencePages[participantType];
  const path = `/cooperation/${participantType.toLowerCase()}`;
  const pageTitle = audiencePage?.title ?? content.title;
  const pageDescription = audiencePage?.intro ?? content.description;

  return (
    <div className="space-y-6 pb-8">
      <Breadcrumbs items={[{ href: "/cooperation", label: "Сотрудничество" }, { label: pageTitle }]} />
      {audiencePage ? (
        <>
          <section className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{audiencePage.title}</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{audiencePage.intro}</p>
          </section>
          <AudienceBenefits page={audiencePage} />
          <section aria-labelledby="cooperation-application-title" className="scroll-mt-24 space-y-5 border-t pt-6" id="application">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-tight" id="cooperation-application-title">{content.eyebrow}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{content.description}</p>
            </div>
            <ApplicationLayout clinics={clinics} content={content} participantType={participantType} tracking={tracking} />
          </section>
        </>
      ) : (
        <>
          <section className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{content.eyebrow}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{content.title}</h1><p className="mt-4 text-base leading-7 text-muted-foreground">{content.description}</p></section>
          <ApplicationLayout clinics={clinics} content={content} participantType={participantType} tracking={tracking} />
        </>
      )}
      <SchemaOrg data={breadcrumbJsonLd([{ href: "/", label: "Главная" }, { href: "/cooperation", label: "Сотрудничество" }, { href: path, label: pageTitle }])} />
      <SchemaOrg data={{ "@context": "https://schema.org", "@type": "WebPage", name: pageTitle, description: pageDescription, url: absoluteUrl(path), inLanguage: "ru-RU" }} />
    </div>
  );
}
