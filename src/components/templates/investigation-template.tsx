import { FileText, Image as ImageIcon, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { AppealInvitation } from "@/components/appeals/appeal-invitation";
import { FloatingAppealInvitation } from "@/components/appeals/floating-appeal-invitation";
import { EntityBlock } from "@/components/entity/entity-block";
import { IndependentControlAssessments } from "@/components/investigations/independent-control-assessments";
import { RegulatoryAssessments } from "@/components/investigations/regulatory-assessments";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import {
  GLAZCENTR_INVESTIGATION_SLUG,
  getPublicInvestigationDocumentTitle,
  isPubliclyHiddenInvestigationDocument,
  PUBLIC_ASSOCIATION_MATERIALS_NOTE,
} from "@/lib/investigation-documents";
import type { InvestigationDetail } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

function EvidenceDocument({
  document,
}: {
  document: InvestigationDetail["documents"][number];
}) {
  const isImage = document.mimeType?.startsWith("image/") && document.previewImageUrl;
  const title = getPublicInvestigationDocumentTitle(document);
  const documentDate = formatDate(document.documentDate);

  return (
    <article className="overflow-hidden rounded-lg border bg-card" id={"document-" + document.slug}>
      <div className="border-b bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          {isImage ? (
            <ImageIcon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          ) : (
            <FileText aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Первичный документ
            </p>
            <h3 className="mt-1 font-semibold">{title}</h3>
            {document.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{document.summary}</p>}
            {(documentDate || document.source) && (
              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {documentDate && (
                  <div className="flex gap-1">
                    <dt>Дата:</dt>
                    <dd>{documentDate}</dd>
                  </div>
                )}
                {document.source && (
                  <div className="flex gap-1">
                    <dt>Источник:</dt>
                    <dd>{document.source}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      </div>

      {isImage && (
        <div className="bg-muted p-3 sm:p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={title}
            className="mx-auto h-auto max-h-[900px] w-auto max-w-full rounded border bg-white"
            src={document.previewImageUrl!}
          />
        </div>
      )}

      {document.content && (
        <div className="border-t p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Текстовая расшифровка
          </p>
          <div className="whitespace-pre-wrap rounded-md border bg-background p-4 text-sm leading-6 text-foreground/90">
            {document.content}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t p-4 text-sm">
        {document.fileUrl && (
          <a
            className="font-semibold text-primary hover:underline"
            href={document.fileUrl}
            rel="noopener"
            target="_blank"
          >
            Открыть документ →
          </a>
        )}
      </div>
    </article>
  );
}

function RelatedEntityList({
  title,
  items,
}: {
  title: string;
  items: { href: string; title: string; meta?: string | null }[];
}) {
  if (items.length === 0) return null;

  return (
    <EntityBlock title={title}>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            className="block rounded-md border bg-background p-3 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
            href={item.href}
            key={item.href}
          >
            <span className="font-medium text-primary">{item.title}</span>
            {item.meta && <span className="mt-1 block text-xs text-muted-foreground">{item.meta}</span>}
          </Link>
        ))}
      </div>
    </EntityBlock>
  );
}

function buildInvestigationFaq(data: InvestigationDetail, publicDocumentCount: number) {
  const clinic = data.clinics[0]?.clinic;
  const instance = data.equipmentInstances[0];
  const objectLabel = instance
    ? `${instance.model}${instance.serialNumber ? `, заводской номер ${instance.serialNumber}` : ""}`
    : "конкретный объект, указанный в опубликованных документах";

  return [
    {
      question: "Что является объектом проверки?",
      answer: `В опубликованных материалах объектом проверки обозначен ${objectLabel}. Каталожная модель оборудования используется для навигации и не является самостоятельным объектом проверки.`,
    },
    {
      question: "Какая клиника указана в материалах?",
      answer: clinic
        ? `${clinic.title}${clinic.city ? `, ${clinic.city}` : ""}. Связь основана на опубликованных материалах расследования.`
        : "Клиника не указана в доступной версии расследования.",
    },
    {
      question: "Какие документы опубликованы?",
      answer: publicDocumentCount > 0
        ? `Опубликовано документов: ${publicDocumentCount}. Для каждого документа указаны публичное название, источник и дата, если они доступны.`
        : "Документы в открытом разделе расследования пока не опубликованы.",
    },
    {
      question: "Как обозначается статус материалов?",
      answer: data.status,
    },
    {
      question: "Какие нормативные материалы связаны с расследованием?",
      answer: data.regulatoryAssessments.length > 0 || data.registryChecks.length > 0
        ? "Связанные нормативные положения и результаты проверок отображаются в разделе нормативной проверки с указанием применимости и доказательной базы."
        : "На странице опубликованы только те нормативные ссылки, для которых в материалах есть проверенная связь. Отсутствие отдельной оценки не является выводом о нарушении.",
    },
    {
      question: "Есть ли окончательный вывод о нарушении?",
      answer: "Окончательные выводы не подменяются публикацией материалов проверки. На странице отдельно указаны подтверждённые сведения, границы оценки и вопросы, требующие проверки компетентных органов.",
    },
    {
      question: "Где посмотреть первичные документы?",
      answer: "Публичные первичные документы размещены в разделах доказательной базы этой страницы. В карточках используются публичные названия без внутренних имён файлов; документы, не вошедшие в открытую часть, здесь не показываются.",
    },
    {
      question: "Как сообщить дополнительную информацию?",
      answer: "Используйте форму обращения на этой странице. Контекст расследования будет передан в форму автоматически.",
    },
    {
      question: "Можно ли направить документы?",
      answer: "Да. Форма обращения позволяет описать ситуацию и приложить материалы в предусмотренных форматах. Каждое обращение рассматривается индивидуально.",
    },
    {
      question: "Будет ли расследование обновляться?",
      answer: "Материал может обновляться при появлении новых проверенных документов и официальных ответов. Изменения должны сохранять ссылку на источник и границы вывода.",
    },
  ];
}

export function InvestigationTemplate({ data }: { data: InvestigationDetail }) {
  const primaryAppealId = `appeal-primary-${data.slug}`;
  const endAppealId = `appeal-end-${data.slug}`;
  const publishedAt = formatDate(data.publishedAt);
  const sectionsByKey = new Map(data.sections.map((section) => [section.key, section]));
  const summary = sectionsByKey.get("summary");
  const objectUnderReview = sectionsByKey.get("object-under-review");
  const remainingSections = data.sections.filter(
    (section) => section.key !== "summary" && section.key !== "object-under-review",
  );
  const publicDocuments = data.documents.filter(
    (document) => !isPubliclyHiddenInvestigationDocument(data.slug, document),
  );
  const manufacturerDocuments = publicDocuments.filter((document) => document.kind === "manufacturer-response");
  const officialDocuments = publicDocuments.filter((document) => document.kind === "association-appeal");
  const otherEvidenceDocuments = publicDocuments.filter(
    (document) => document.kind !== "manufacturer-response" && document.kind !== "association-appeal",
  );

  const clinics = data.clinics.map((relation) => ({
    href: "/clinics/" + relation.clinic.slug,
    title: relation.clinic.title,
    meta: relation.clinic.city,
  }));
  const equipment = data.equipment.map((relation) => ({
    href: "/equipment/" + relation.equipment.slug,
    title: relation.equipment.title,
    meta: relation.equipment.manufacturer,
  }));
  const diseases = data.diseases.map((relation) => ({
    href: "/diseases/" + relation.disease.slug,
    title: relation.disease.title,
  }));
  const procedures = data.procedures.map((relation) => ({
    href: "/procedures/" + relation.procedure.slug,
    title: relation.procedure.title,
  }));
  const news = data.news.map((relation) => ({
    href: "/news/" + relation.news.slug,
    title: relation.news.title,
    meta: formatDate(relation.news.publishedAt),
  }));
  const faqItems = buildInvestigationFaq(data, publicDocuments.length);
  const investigationTitle = data.clinics.length === 1
    ? `Проверка деятельности ${data.clinics[0].clinic.title}`
    : data.title;

  const anchors = [
    summary ? { href: "#summary", label: summary.title } : null,
    data.equipmentInstances.length > 0 ? { href: "#object-of-review", label: "Объект проверки" } : null,
    objectUnderReview ? { href: "#object-under-review", label: objectUnderReview.title } : null,
    data.equipmentInstances.length || data.regulatoryAssessments.length || data.registryChecks.length
      ? { href: "#regulatory-analysis", label: "Нормативная проверка" }
      : null,
    data.independentControlAssessments.length > 0
      ? {
          href: "#independent-control-assessments",
          label: "Проверка по критериям независимой оценки",
        }
      : null,
    data.timeline.length > 0 ? { href: "#timeline", label: "Хронология" } : null,
    ...remainingSections.map((section) => ({ href: "#" + section.key, label: section.title })),
    otherEvidenceDocuments.length > 0 ? { href: "#evidence", label: "Другие доказательства" } : null,
    { href: "#faq", label: "Вопросы и ответы" },
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  return (
    <TemplateShell
      badges={["Расследование Ассоциации", data.status]}
      breadcrumbs={[
        { href: "/investigations", label: "Расследования" },
        { label: data.title },
      ]}
      description={data.summary}
      eyebrow="Расследования"
      title={investigationTitle}
    >
      <div className="space-y-5">
        <section className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex gap-3">
            <ShieldAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">{data.status}</p>
              {data.statusNote && <p className="mt-1 text-sm leading-6 text-muted-foreground">{data.statusNote}</p>}
              {publishedAt && <p className="mt-2 text-xs text-muted-foreground">Опубликовано: {publishedAt}</p>}
            </div>
          </div>
        </section>

        {data.equipmentInstances.length > 0 && (
          <section id="object-of-review">
            <EntityBlock title="Объект проверки">
              <p className="mb-4 text-sm leading-6 text-muted-foreground">
                Этот блок описывает идентифицированный экземпляр оборудования. Связь с каталожной карточкой нужна для навигации и не переносит выводы расследования на модель в целом.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {data.equipmentInstances.map((instance) => (
                  <article className="rounded-lg border bg-card p-4" id={`equipment-instance-${instance.id}`} key={instance.id}>
                    <dl className="grid gap-2 text-sm sm:grid-cols-[150px_1fr]">
                      <dt className="text-muted-foreground">Модель</dt>
                      <dd className="font-semibold text-foreground">
                        {instance.equipment ? (
                          <Link className="text-primary hover:underline" href={`/equipment/${instance.equipment.slug}`}>
                            {instance.model}
                          </Link>
                        ) : instance.model}
                      </dd>
                      {instance.serialNumber && <><dt className="text-muted-foreground">Заводской номер</dt><dd>{instance.serialNumber}</dd></>}
                      {instance.manufactureYear && <><dt className="text-muted-foreground">Год выпуска</dt><dd>{instance.manufactureYear}</dd></>}
                      {instance.manufacturer && <><dt className="text-muted-foreground">Производитель</dt><dd>{instance.manufacturer}</dd></>}
                    </dl>
                    {instance.identificationSummary && <p className="mt-4 text-sm leading-6 text-muted-foreground">{instance.identificationSummary}</p>}
                    {instance.identificationEvidence.filter(
                      (evidence) =>
                        !isPubliclyHiddenInvestigationDocument(data.slug, evidence.document),
                    ).length > 0 && (
                      <div className="mt-4 border-t pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Основание идентификации</p>
                        <div className="mt-2 space-y-1">
                          {instance.identificationEvidence
                            .filter(
                              (evidence) =>
                                !isPubliclyHiddenInvestigationDocument(data.slug, evidence.document),
                            )
                            .map(({ document }) => (
                            <a className="block text-sm font-semibold text-primary hover:underline" href={`#document-${document.slug}`} key={document.slug}>
                              {getPublicInvestigationDocumentTitle(document)} →
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </EntityBlock>
          </section>
        )}

        <nav aria-label="Разделы расследования" className="rounded-lg border bg-card p-3">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {anchors.map((anchor) => (
              <li key={anchor.href}>
                <a className="text-primary hover:underline" href={anchor.href}>
                  {anchor.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {summary && (
          <section id={summary.key}>
            <EntityBlock title={summary.title}>
              <div className="whitespace-pre-line leading-7">{summary.content}</div>
            </EntityBlock>
          </section>
        )}

        {objectUnderReview && (
          <section id={objectUnderReview.key}>
            <EntityBlock title={objectUnderReview.title}>
              <div className="whitespace-pre-line leading-7">{objectUnderReview.content}</div>
            </EntityBlock>
          </section>
        )}

        <RegulatoryAssessments
          assessments={data.regulatoryAssessments}
          instances={data.equipmentInstances}
          investigationSlug={data.slug}
          registryChecks={data.registryChecks}
        />

        <IndependentControlAssessments
          assessments={data.independentControlAssessments}
          investigationSlug={data.slug}
        />

        {data.timeline.length > 0 && <section id="timeline">
          <EntityBlock title="Хронология">
            <ol className="space-y-4 border-l-2 border-primary/20 pl-5">
              {data.timeline.map((event) => (
                <li className="relative" key={event.id}>
                  <span className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{event.dateLabel}</p>
                  <h3 className="mt-1 font-medium">{event.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.description}</p>
                  {event.equipmentInstance ? (
                    <a
                      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                      href={`#equipment-instance-${event.equipmentInstance.id}`}
                    >
                      Экземпляр: {event.equipmentInstance.model}
                      {event.equipmentInstance.serialNumber
                        ? `, зав. № ${event.equipmentInstance.serialNumber}`
                        : ""}
                    </a>
                  ) : null}
                </li>
              ))}
            </ol>
          </EntityBlock>
        </section>}

        {remainingSections.map((section) => (
          <section id={section.key} key={section.id}>
            <EntityBlock title={section.title}>
              <div className="whitespace-pre-line leading-7">
                {data.slug === GLAZCENTR_INVESTIGATION_SLUG &&
                section.key === "official-documents" &&
                officialDocuments.length === 0
                  ? PUBLIC_ASSOCIATION_MATERIALS_NOTE
                  : section.content}
              </div>
              {section.key === "official-documents" && officialDocuments.length > 0 && (
                <div className="mt-5 space-y-4">
                  {officialDocuments.map((document) => (
                    <EvidenceDocument document={document} key={document.id} />
                  ))}
                </div>
              )}
              {section.key === "manufacturer-responses" && manufacturerDocuments.length > 0 && (
                <div className="mt-5 space-y-4">
                  {manufacturerDocuments.map((document) => (
                    <EvidenceDocument document={document} key={document.id} />
                  ))}
                </div>
              )}
            </EntityBlock>
          </section>
        ))}

        {otherEvidenceDocuments.length > 0 && (
          <section id="evidence">
            <EntityBlock title="Другие доказательства">
              <div className="space-y-4">
                {otherEvidenceDocuments.map((document) => (
                  <EvidenceDocument document={document} key={document.id} />
                ))}
              </div>
            </EntityBlock>
          </section>
        )}

        <section id="faq">
          <EntityBlock title="Вопросы и ответы">
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div className="border-b pb-4 last:border-b-0 last:pb-0" key={item.question}>
                  <h3 className="font-semibold text-foreground">{item.question}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </EntityBlock>
        </section>

        <div id={primaryAppealId}>
          <AppealInvitation investigationSlug={data.slug} />
        </div>

        <FloatingAppealInvitation
          endId={endAppealId}
          investigationSlug={data.slug}
          triggerId={primaryAppealId}
        />

        <p className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
          Получено обращений: <strong className="font-semibold text-foreground">{data._count.appeals}</strong>
        </p>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-5">
            <RelatedEntityList
              items={clinics}
              title={clinics.length === 1 ? "Клиника, указанная в материалах проверки" : "Клиники, указанные в материалах проверки"}
            />
            {!objectUnderReview && <RelatedEntityList items={equipment} title="Оборудование, указанное в материалах" />}
          </div>
          <div className="space-y-5">
            <RelatedEntityList items={procedures} title="Процедуры, упомянутые в материалах" />
            <RelatedEntityList items={diseases} title="Связанные заболевания" />
            <RelatedEntityList items={news} title="Публикации Ассоциации по этому расследованию" />
          </div>
        </div>

        <div id={endAppealId}>
          <AppealInvitation
            actionLabel="Подать обращение"
            description="Если ваша ситуация может быть связана с обстоятельствами, описанными в расследовании, направьте дополнительную информацию, документы или описание случая."
            investigationSlug={data.slug}
            title="Столкнулись с похожей ситуацией?"
          />
        </div>
      </div>

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/investigations", label: "Расследования" },
          { href: "/investigations/" + data.slug, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: data.title,
          description: data.summary,
          url: absoluteUrl("/investigations/" + data.slug),
          ...(data.publishedAt ? { datePublished: data.publishedAt.toISOString() } : {}),
          dateModified: data.updatedAt.toISOString(),
          publisher: { "@type": "Organization", name: "Ассоциация офтальмологических клиник" },
          mainEntityOfPage: absoluteUrl("/investigations/" + data.slug),
        }}
      />
      <SchemaOrg data={faqPageJsonLd(faqItems)} />
    </TemplateShell>
  );
}
