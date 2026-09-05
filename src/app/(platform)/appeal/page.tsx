import { AppealForm } from "@/components/appeals/appeal-form";
import { EntityBlock } from "@/components/entity/entity-block";
import { EntityHeader } from "@/components/entity/entity-header";
import { SchemaOrg } from "@/components/seo/schema-org";
import Link from "next/link";
import { getAppealFormConfiguration } from "@/lib/appeals/public";
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ investigation?: string | string[] }> };

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Подать обращение в Ассоциацию — единая форма",
  description: "Единая защищённая форма для обращений, документов, сообщений о возможных нарушениях, предложений и информации по расследованиям.",
  path: "/appeal",
});

export default async function AppealPage({ searchParams }: Props) {
  const { investigations, consent } = await getAppealFormConfiguration();
  const params = await searchParams;
  const requestedSlug = typeof params.investigation === "string" ? params.investigation : "";
  const initialInvestigationSlug = investigations.some((item) => item.slug === requestedSlug) ? requestedSlug : "";

  return (
    <div className="space-y-5">
      <EntityHeader
        badges={["Закрытый реестр", "Доказательная база"]}
        description="Направьте жалобу, сведения по расследованию, документы, сообщение о возможном нарушении, запрос обратной связи или предложение. Каждое обращение получает публичный номер и рассматривается индивидуально."
        eyebrow="Обращения граждан"
        title="Подать обращение в Ассоциацию"
      />

      <section aria-label="Как работает единая форма обращений" className="grid gap-5 lg:grid-cols-3">
        <EntityBlock title="Какие обращения принимаются">
          <p className="text-sm leading-6 text-muted-foreground">
            Жалобы пациентов, материалы по расследованиям, сообщения о возможных нарушениях, документы, просьбы рассмотреть вопрос о возврате денежных средств, предложения и другая обратная связь.
          </p>
        </EntityBlock>
        <EntityBlock title="Что происходит после отправки">
          <p className="text-sm leading-6 text-muted-foreground">
            Обращение сохраняется в закрытом реестре, получает публичный номер и поступает на индивидуальное рассмотрение. Переданные материалы могут использоваться для проверки обстоятельств и формирования доказательной базы.
          </p>
        </EntityBlock>
        <EntityBlock title="Конфиденциальность">
          <p className="text-sm leading-6 text-muted-foreground">
            Контакты, текст и вложения не публикуются. Документы хранятся в защищённом разделе, а актуальная версия согласия показывается непосредственно перед отправкой формы.
          </p>
        </EntityBlock>
      </section>

      <EntityBlock title="Правовые документы перед отправкой">
        <div className="space-y-2">
          <p>
            Перед отправкой ознакомьтесь с <Link className="text-primary underline-offset-4 hover:underline" href="/privacy-policy">политикой обработки персональных данных</Link> и <Link className="text-primary underline-offset-4 hover:underline" href="/personal-data-consent">пояснением к согласию</Link>. Текст согласия с текущей версией также отображается ниже в форме.
          </p>
          <p className="text-xs">Если сообщение содержит медицинские сведения или документы, передавайте только информацию, необходимую для рассмотрения обращения.</p>
        </div>
      </EntityBlock>

      {consent ? (
        <AppealForm consent={consent} initialInvestigationSlug={initialInvestigationSlug} investigations={investigations} />
      ) : (
        <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
          Приём обращений временно недоступен: активная конфигурация согласия не найдена.
        </p>
      )}

      <SchemaOrg data={breadcrumbJsonLd([{ href: "/", label: "Главная" }, { href: "/appeal", label: "Подать обращение" }])} />
      <SchemaOrg data={{
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Подать обращение в Ассоциацию",
        description: "Единая форма передачи обращений, информации и документов в Ассоциацию.",
        url: absoluteUrl("/appeal"),
      }} />
    </div>
  );
}
