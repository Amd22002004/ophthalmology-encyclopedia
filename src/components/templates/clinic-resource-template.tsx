import { FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { EntityBlock } from "@/components/entity/entity-block";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { ClinicDbDetail } from "@/lib/loaders";
import { getPublicInvestigationDocumentTitle } from "@/lib/investigation-documents";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export type ClinicResourceKind = "equipment" | "documents" | "license";

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

const DOCUMENT_KIND_LABEL: Record<string, string> = {
  "registration-document": "Регистрационный документ",
  "manufacturer-response": "Ответ производителя",
  "organization-response": "Ответ организации",
  "association-appeal": "Обращение Ассоциации",
  "official-letter": "Официальное письмо",
  "court-document": "Судебный документ",
  "equipment-photo": "Фотография оборудования",
  "object-photo": "Фотография объекта",
};

function resourceCopy(kind: ClinicResourceKind, title: string) {
  if (kind === "equipment") {
    return {
      eyebrow: "Клиника · оборудование",
      title: `Оборудование ${title}`,
      description: `Модели и документы, связанные с ${title}. Связи разделены по степени подтверждения и не переносят выводы о конкретном экземпляре на модель в целом.`,
    };
  }
  if (kind === "documents") {
    return {
      eyebrow: "Клиника · документы",
      title: `Документы ${title}`,
      description: `Опубликованные регистрационные, лицензионные и доказательные материалы, относящиеся к ${title}.`,
    };
  }
  return {
    eyebrow: "Клиника · лицензия",
    title: `Лицензия ${title}`,
    description: `Сведения о лицензии ${title}, доступные в карточке клиники, и границы опубликованной проверки.`,
  };
}

function RelatedInvestigationLinks({ data }: { data: ClinicDbDetail }) {
  return (
    <div className="space-y-2">
      {data.investigations.map(({ investigation }) => (
        <Link
          className="block rounded-md border bg-background p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
          href={`/investigations/${investigation.slug}`}
          key={investigation.slug}
        >
          <span className="font-medium text-primary">{investigation.title}</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{investigation.summary}</span>
          <span className="mt-2 inline-block text-xs font-semibold text-primary">Открыть материалы проверки →</span>
        </Link>
      ))}
    </div>
  );
}

function RelatedNewsLinks({ data }: { data: ClinicDbDetail }) {
  const news = Array.from(
    new Map(
      data.investigations.flatMap(({ investigation }) =>
        investigation.news.map(({ news }) => [news.slug, news]),
      ),
    ).values(),
  );
  if (news.length === 0) return null;

  return (
    <EntityBlock title="Публикации Ассоциации">
      <div className="space-y-2">
        {news.map((item) => (
          <Link className="block rounded-md border bg-background p-3 text-sm font-semibold text-primary hover:border-primary/50 hover:bg-primary/5" href={`/news/${item.slug}`} key={item.slug}>
            {item.title} →
          </Link>
        ))}
      </div>
    </EntityBlock>
  );
}

function EquipmentResource({ data }: { data: ClinicDbDetail }) {
  const directEquipment = data.equipment;
  const mentionedEquipment = Array.from(
    new Map(
      data.investigations.flatMap(({ investigation }) =>
        investigation.equipment.map(({ equipment }) => [equipment.slug, { equipment, investigation }]),
      ),
    ).values(),
  );

  return (
    <div className="space-y-5">
      {directEquipment.length > 0 && (
        <EntityBlock title="Оборудование, подтверждённое связью с клиникой">
          <div className="grid gap-3 sm:grid-cols-2">
            {directEquipment.map(({ equipment }) => (
              <Link
                className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
                href={`/equipment/${equipment.slug}`}
                key={equipment.slug}
              >
                <p className="font-semibold text-foreground">{equipment.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[equipment.manufacturer, equipment.country].filter(Boolean).join(" · ") || "Карточка оборудования"}
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-primary">Открыть карточку →</span>
              </Link>
            ))}
          </div>
        </EntityBlock>
      )}

      {mentionedEquipment.length > 0 && (
        <EntityBlock title="Оборудование, указанное в материалах расследования">
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            Ниже приведены каталожные модели, связанные с опубликованными материалами. Проверка относится к конкретному объекту, если он идентифицирован в расследовании, а не к модели как таковой.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {mentionedEquipment.map(({ equipment, investigation }) => (
              <div className="rounded-lg border bg-card p-4" key={`${investigation.slug}-${equipment.slug}`}>
                <Link className="font-semibold text-primary hover:underline" href={`/equipment/${equipment.slug}`}>
                  {equipment.title}
                </Link>
                {equipment.manufacturer && <p className="mt-1 text-sm text-muted-foreground">{equipment.manufacturer}</p>}
                <Link
                  className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                  href={`/investigations/${investigation.slug}`}
                >
                  Материалы проверки: {investigation.title} →
                </Link>
              </div>
            ))}
          </div>
        </EntityBlock>
      )}

      {directEquipment.length === 0 && mentionedEquipment.length === 0 && (
        <EntityBlock title="Сведения требуют подтверждения">
          <p className="text-sm leading-6 text-muted-foreground">
            В опубликованных материалах нет отдельного перечня моделей оборудования, подтверждённо связанного с этой клиникой.
          </p>
        </EntityBlock>
      )}

      <EntityBlock title="Материалы проверки">
        <RelatedInvestigationLinks data={data} />
      </EntityBlock>
      <RelatedNewsLinks data={data} />
    </div>
  );
}

function DocumentsResource({ data }: { data: ClinicDbDetail }) {
  const documents = data.investigations.flatMap(({ investigation }) =>
    investigation.documents.map((document) => ({ document, investigation })),
  );
  const uniqueDocuments = Array.from(
    new Map(documents.map((item) => [`${item.investigation.slug}-${item.document.slug}`, item])).values(),
  );
  const registrationDocuments = uniqueDocuments.filter(({ document }) => document.kind === "registration-document");
  const equipmentDocuments = uniqueDocuments.filter(({ document }) =>
    ["manufacturer-response", "equipment-photo", "object-photo"].includes(document.kind),
  );
  const associationDocuments = uniqueDocuments.filter(({ document }) => document.kind === "association-appeal");
  const knownKinds = new Set([
    "registration-document",
    "manufacturer-response",
    "equipment-photo",
    "object-photo",
    "association-appeal",
  ]);
  const otherDocuments = uniqueDocuments.filter(
    ({ document }) => !knownKinds.has(document.kind),
  );

  const renderDocuments = (items: typeof uniqueDocuments) => (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(({ document, investigation }) => {
        const title = getPublicInvestigationDocumentTitle(document);
        return (
          <article className="rounded-lg border bg-card p-4" key={`${investigation.slug}-${document.slug}`}>
            <div className="flex items-start gap-3">
              <FileText aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{DOCUMENT_KIND_LABEL[document.kind] ?? "Документ расследования"}</p>
                {document.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{document.summary}</p>}
                {(document.source || document.documentDate) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {[document.source, formatDate(document.documentDate)].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                  <Link className="text-primary hover:underline" href={`/investigations/${investigation.slug}#document-${document.slug}`}>
                    Открыть в расследовании →
                  </Link>
                  {document.fileUrl && (
                    <a className="text-primary hover:underline" href={document.fileUrl} rel="noopener" target="_blank">
                      Открыть документ →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      {data.license && (
        <EntityBlock title="Лицензионные сведения">
          <p className="text-sm leading-6"><span className="text-muted-foreground">Лицензия:</span> {data.license}</p>
          <Link className="mt-3 inline-block text-sm font-semibold text-primary hover:underline" href={`/clinics/${data.slug}/license`}>
            Открыть страницу лицензии →
          </Link>
        </EntityBlock>
      )}
      {registrationDocuments.length > 0 && <EntityBlock title="Регистрационные документы">{renderDocuments(registrationDocuments)}</EntityBlock>}
      {equipmentDocuments.length > 0 && <EntityBlock title="Документы и фотографии оборудования">{renderDocuments(equipmentDocuments)}</EntityBlock>}
      {associationDocuments.length > 0 && <EntityBlock title="Документы Ассоциации">{renderDocuments(associationDocuments)}</EntityBlock>}
      {otherDocuments.length > 0 && <EntityBlock title="Другие опубликованные материалы">{renderDocuments(otherDocuments)}</EntityBlock>}
      {uniqueDocuments.length === 0 && (
        <EntityBlock title="Опубликованные документы">
          <p className="text-sm leading-6 text-muted-foreground">Документы по этой клинике пока не опубликованы в открытом разделе.</p>
        </EntityBlock>
      )}
      <EntityBlock title="Расследования и источники">
        <RelatedInvestigationLinks data={data} />
      </EntityBlock>
      <RelatedNewsLinks data={data} />
    </div>
  );
}

function LicenseResource({ data }: { data: ClinicDbDetail }) {
  return (
    <div className="space-y-5">
      <EntityBlock title="Известные сведения">
        {data.license ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-muted-foreground">Номер/сведения</dt>
            <dd className="font-medium text-foreground">{data.license}</dd>
            {data.licenseDate && <><dt className="text-muted-foreground">Дата</dt><dd>{formatDate(data.licenseDate)}</dd></>}
            {data.licenseStatus && <><dt className="text-muted-foreground">Статус в карточке</dt><dd>{data.licenseStatus}</dd></>}
          </dl>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">Лицензионные сведения в карточке клиники не заполнены.</p>
        )}
      </EntityBlock>

      <EntityBlock title="Границы публикации">
        <div className="flex gap-3">
          <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-muted-foreground">
            Эта страница отображает только сведения, сохранённые в карточке клиники и опубликованные документы. Наличие записи о лицензии само по себе не является выводом о соблюдении или нарушении требований.
          </p>
        </div>
      </EntityBlock>

      <EntityBlock title="Связанные материалы">
        <RelatedInvestigationLinks data={data} />
      </EntityBlock>
      <RelatedNewsLinks data={data} />
    </div>
  );
}

export function ClinicResourceTemplate({ data, kind }: { data: ClinicDbDetail; kind: ClinicResourceKind }) {
  const copy = resourceCopy(kind, data.title);
  const pagePath = `/clinics/${data.slug}/${kind}`;

  return (
    <TemplateShell
      badges={["Клиника", copy.eyebrow]}
      breadcrumbs={[
        { href: "/clinics", label: "Клиники" },
        { href: `/clinics/${data.slug}`, label: data.title },
        { label: copy.title },
      ]}
      description={copy.description}
      eyebrow={copy.eyebrow}
      title={copy.title}
    >
      <div className="space-y-5">
        {kind === "equipment" && <EquipmentResource data={data} />}
        {kind === "documents" && <DocumentsResource data={data} />}
        {kind === "license" && <LicenseResource data={data} />}
      </div>
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/clinics", label: "Клиники" },
          { href: `/clinics/${data.slug}`, label: data.title },
          { href: pagePath, label: copy.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: copy.title,
          description: copy.description,
          url: absoluteUrl(pagePath),
          isPartOf: { "@type": "WebSite", name: "Офтальмологическая энциклопедия" },
          about: { "@type": "MedicalOrganization", name: data.title, url: absoluteUrl(`/clinics/${data.slug}`) },
        }}
      />
    </TemplateShell>
  );
}
