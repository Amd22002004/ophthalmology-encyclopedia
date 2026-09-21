import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SchemaOrg } from "@/components/seo/schema-org";
import { Card, CardContent } from "@/components/ui/card";
import { CooperationApplicationForm } from "./cooperation-application-form";
import type { CooperationParticipantType } from "@/lib/cooperation/constants";
import type { CooperationTracking } from "@/lib/cooperation/tracking";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

const copy: Record<CooperationParticipantType, { eyebrow: string; title: string; description: string; note: string }> = {
  CLINIC: { eyebrow: "Заявка от клиники", title: "Сотрудничество для клиник", description: "Расскажите об организации и целях участия в профессиональном сообществе офтальмологии.", note: "Заявка поможет Ассоциации понять профиль организации и предложить следующий шаг после проверки сведений." },
  DOCTOR: { eyebrow: "Заявка врача или эксперта", title: "Сотрудничество для врачей и экспертов", description: "Подайте заявку на участие в профессиональном сообществе без заполнения полного резюме или загрузки документов.", note: "Профессиональный профиль создаётся только после отдельного решения и приглашения — отправка формы сама по себе его не создаёт." },
  PARTNER: { eyebrow: "Заявка поставщика или технологического партнёра", title: "Сотрудничество для поставщиков и технологических партнёров", description: "Предложите Ассоциации отраслевой, научный, образовательный или технологический проект.", note: "Заявка проходит проверку. Полноценная карточка поставщика не создаётся автоматически и появляется только после отдельного решения." },
};

export function CooperationRolePage({ participantType, tracking, clinics }: { participantType: CooperationParticipantType; tracking: CooperationTracking; clinics?: { title: string; description: string }[] }) {
  const content = copy[participantType];
  return <div className="space-y-6 pb-8"><Breadcrumbs items={[{ href: "/cooperation", label: "Сотрудничество" }, { label: content.title }]} /><section className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{content.eyebrow}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{content.title}</h1><p className="mt-4 text-base leading-7 text-muted-foreground">{content.description}</p></section><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><Card className="min-w-0"><CardContent className="min-w-0 p-5 sm:p-8"><CooperationApplicationForm clinics={clinics} participantType={participantType} tracking={tracking} /></CardContent></Card><aside className="h-fit rounded-2xl border bg-muted/30 p-5 sm:p-6"><p className="text-sm font-semibold">Перед отправкой</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{content.note}</p><div className="mt-5 border-t pt-5 text-sm leading-6 text-muted-foreground"><p>Обязательные поля отмечены <span className="text-destructive">*</span>.</p><p className="mt-2">Мы не просим загружать паспорт, диплом или полное резюме.</p></div></aside></div><SchemaOrg data={breadcrumbJsonLd([{ href: "/", label: "Главная" }, { href: "/cooperation", label: "Сотрудничество" }, { href: `/cooperation/${participantType.toLowerCase()}`, label: content.title }])} /><SchemaOrg data={{ "@context": "https://schema.org", "@type": "WebPage", name: content.title, description: content.description, url: absoluteUrl(`/cooperation/${participantType.toLowerCase()}`) }} /></div>;
}
