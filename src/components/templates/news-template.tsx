import Link from "next/link";
import { AppealInvitation } from "@/components/appeals/appeal-invitation";
import { EntityBlock } from "@/components/entity/entity-block";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import { getPublicInvestigationDocumentTitle } from "@/lib/investigation-documents";
import type { NewsDetail } from "@/lib/loaders";
import {
  groupNewsBlocks,
  type NewsFigure,
  type NewsInline,
  newsOpenGraphImage,
  parseNewsContent,
} from "@/lib/news-content";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

type RelatedLink = { href: string; title: string; meta?: string | null };

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

function NewsInlines({ inlines }: { inlines: NewsInline[] }) {
  return inlines.map((inline, index) =>
    inline.type === "text" ? (
      <span key={index}>{inline.text}</span>
    ) : (
      <a
        className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
        href={inline.href}
        key={index}
        {...(inline.href.startsWith("https://")
          ? { rel: "noopener noreferrer", target: "_blank" }
          : {})}
      >
        {inline.text}
      </a>
    ),
  );
}

function uniqueLinks(items: RelatedLink[]) {
  return Array.from(new Map(items.map((item) => [item.href, item])).values());
}

function RelatedEntityList({ title, items }: { title: string; items: RelatedLink[] }) {
  if (items.length === 0) return null;

  return (
    <EntityBlock title={title}>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            className="block rounded-md border bg-background p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
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

function NewsFigureView({
  figure,
  loading,
  className,
}: {
  figure: NewsFigure;
  loading: "eager" | "lazy";
  className?: string;
}) {
  return (
    <figure className={className ? `space-y-2 ${className}` : "space-y-2"}>
      {/* Local editorial images stay sized by the caption notation to avoid CLS. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={figure.alt}
        className="h-auto w-full rounded-md border bg-muted object-contain"
        decoding="async"
        height={figure.height}
        loading={loading}
        src={figure.src}
        width={figure.width}
      />
      {figure.caption.length > 0 && (
        <figcaption className="text-xs leading-5 text-muted-foreground">
          <NewsInlines inlines={figure.caption} />
        </figcaption>
      )}
    </figure>
  );
}

function NewsFigureGroup({ figures, eagerLead }: { figures: NewsFigure[]; eagerLead: boolean }) {
  const [lead, ...rest] = figures;
  if (!lead) return null;

  return (
    <div className="space-y-3">
      <NewsFigureView figure={lead} loading={eagerLead ? "eager" : "lazy"} />
      {rest.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
          {rest.map((figure, index) => {
            const spansRow = rest.length % 2 === 1 && index === rest.length - 1;
            return (
              <NewsFigureView
                className={spansRow ? "sm:col-span-2" : undefined}
                figure={figure}
                key={`${figure.src}-${index}`}
                loading="lazy"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewsArticle({ content }: { content: string }) {
  const sections = parseNewsContent(content).map((section) => ({
    title: section.title,
    blocks: groupNewsBlocks(section.blocks),
  }));
  const firstFigureSection = sections.findIndex((section) => section.blocks.some((block) => block.type === "figures"));

  return (
    <article className="space-y-8" aria-label="Текст новости">
      {sections.map((section, index) => (
        <section className="space-y-3" key={`${section.title ?? "intro"}-${index}`}>
          {section.title && <h2 className="text-xl font-semibold tracking-tight text-foreground">{section.title}</h2>}
          {section.blocks.map((block, blockIndex) => {
            if (block.type === "paragraph") {
              return (
                <p className="text-[15px] leading-7 text-foreground/80" key={blockIndex}>
                  <NewsInlines inlines={block.inlines} />
                </p>
              );
            }

            if (block.type === "list") {
              return (
                <ul className="space-y-2 text-[15px] leading-7 text-foreground/80" key={blockIndex}>
                  {block.items.map((item, itemIndex) => (
                    <li className="relative pl-5 before:absolute before:left-0 before:top-[0.72em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary" key={itemIndex}>
                      <NewsInlines inlines={item} />
                    </li>
                  ))}
                </ul>
              );
            }

            const eagerLead = index === firstFigureSection && blockIndex === section.blocks.findIndex((item) => item.type === "figures");
            return <NewsFigureGroup eagerLead={eagerLead} figures={block.figures} key={blockIndex} />;
          })}
        </section>
      ))}
    </article>
  );
}

export function NewsTemplate({ data }: { data: NewsDetail }) {
  const investigations = data.investigations.map((relation) => relation.investigation);
  const evidenceDocuments = investigations.flatMap((investigation) =>
    investigation.documents.map((document) => ({ document, investigation })),
  );
  const clinics = uniqueLinks(
    investigations.flatMap((investigation) =>
      investigation.clinics.map(({ clinic }) => ({
        href: `/clinics/${clinic.slug}`,
        title: clinic.title,
        meta: clinic.city,
      })),
    ),
  );
  const equipment = uniqueLinks(
    investigations.flatMap((investigation) =>
      investigation.equipment.map(({ equipment: item }) => ({
        href: `/equipment/${item.slug}`,
        title: item.title,
        meta: item.manufacturer,
      })),
    ),
  );
  const procedures = uniqueLinks(
    investigations.flatMap((investigation) =>
      investigation.procedures.map(({ procedure }) => ({
        href: `/procedures/${procedure.slug}`,
        title: procedure.title,
      })),
    ),
  );
  const diseases = uniqueLinks(
    investigations.flatMap((investigation) =>
      investigation.diseases.map(({ disease }) => ({
        href: `/diseases/${disease.slug}`,
        title: disease.title,
      })),
    ),
  );
  const clinicResources = uniqueLinks(
    investigations.flatMap((investigation) =>
      investigation.clinics.flatMap(({ clinic }) => [
        {
          href: `/clinics/${clinic.slug}/equipment`,
          title: `Оборудование ${clinic.title}`,
          meta: "Каталожные связи и материалы проверки",
        },
        {
          href: `/clinics/${clinic.slug}/documents`,
          title: `Документы ${clinic.title}`,
          meta: "Опубликованные источники и доказательства",
        },
        {
          href: `/clinics/${clinic.slug}/license`,
          title: `Лицензия ${clinic.title}`,
          meta: "Сведения и границы публикации",
        },
      ]),
    ),
  );
  const hasRelatedMaterials =
    investigations.length > 0 ||
    evidenceDocuments.length > 0 ||
    clinics.length > 0 ||
    equipment.length > 0 ||
    procedures.length > 0 ||
    diseases.length > 0 ||
    clinicResources.length > 0;
  const leadImage = data.content ? newsOpenGraphImage(data.content) : undefined;

  return (
    <TemplateShell
      badges={["Новости Ассоциации", ...(data.publishedAt ? [formatDate(data.publishedAt)!] : [])]}
      breadcrumbs={[{ href: "/news", label: "Новости" }, { label: data.title }]}
      description={data.summary}
      eyebrow="Новости Ассоциации"
      title={data.title}
    >
      <div className={hasRelatedMaterials ? "grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]" : "min-w-0"}>
        <div className="min-w-0">
          {data.content && <NewsArticle content={data.content} />}

          {investigations.length > 0 && (
            <div className="mt-8">
              <AppealInvitation
                compact
                description="Если опубликованные материалы относятся к вашей ситуации, вы можете сообщить об этом Ассоциации."
                investigationSlug={investigations.length === 1 ? investigations[0].slug : undefined}
                title="Столкнулись с аналогичной ситуацией?"
              />
            </div>
          )}

          {investigations.length > 0 && (
            <section className="mt-10 rounded-lg border border-primary/20 bg-primary/5 p-5" aria-label="Полное расследование">
              <h2 className="text-lg font-semibold text-foreground">Полное расследование и доказательная база</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                В новости приведены только ключевые факты. Скан-копии, расшифровки, хронология и границы выводов доступны в полном материале.
              </p>
              <div className="mt-4 space-y-3">
                {investigations.map((investigation) => (
                  <Link
                    className="block rounded-md border bg-background p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
                    href={`/investigations/${investigation.slug}`}
                    key={investigation.slug}
                  >
                    <span className="font-medium text-primary">{investigation.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">{investigation.summary}</span>
                    <span className="mt-2 inline-block text-sm font-semibold text-primary">Открыть полные материалы проверки →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {hasRelatedMaterials && <aside className="space-y-5">
          {evidenceDocuments.length > 0 && (
            <EntityBlock title="Опубликованные документы">
              <div className="space-y-2">
                {evidenceDocuments.map(({ document, investigation }) => {
                  const title = getPublicInvestigationDocumentTitle(document);
                  const date = formatDate(document.documentDate);
                  return (
                    <Link
                      className="block rounded-md border bg-background p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
                      href={`/investigations/${investigation.slug}#document-${document.slug}`}
                      key={`${investigation.slug}-${document.slug}`}
                    >
                      <span className="font-medium text-primary">{title}</span>
                      {document.summary && <span className="mt-1 block text-xs leading-5 text-muted-foreground">{document.summary}</span>}
                      {(document.source || date) && (
                        <span className="mt-2 block text-xs text-muted-foreground">
                          {[document.source, date].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      <span className="mt-2 inline-block text-xs font-semibold text-primary">Открыть в расследовании →</span>
                    </Link>
                  );
                })}
              </div>
            </EntityBlock>
          )}
          <RelatedEntityList
            items={clinics}
            title={clinics.length === 1 ? "Клиника, указанная в материалах расследования" : "Клиники, указанные в материалах расследования"}
          />
          <RelatedEntityList
            items={equipment}
            title={equipment.length === 1 ? "Модель экземпляра, указанного в расследовании" : "Модели экземпляров, указанных в расследовании"}
          />
          <RelatedEntityList items={procedures} title="Связанные процедуры" />
          <RelatedEntityList items={diseases} title="Связанные заболевания" />
          <RelatedEntityList items={clinicResources} title="Материалы по клинике" />
          {investigations.length > 0 && (
            <RelatedEntityList
              items={[{ href: "/regulations", title: "Нормативная база", meta: "Раздел нормативных материалов проекта" }]}
              title="Нормативный контекст"
            />
          )}
        </aside>}
      </div>

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/news", label: "Новости" },
          { href: "/news/" + data.slug, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: data.title,
          description: data.summary,
          ...(leadImage ? { image: absoluteUrl(leadImage.src) } : {}),
          url: absoluteUrl("/news/" + data.slug),
          mainEntityOfPage: absoluteUrl("/news/" + data.slug),
          ...(data.publishedAt ? { datePublished: data.publishedAt.toISOString() } : {}),
          dateModified: data.updatedAt.toISOString(),
          publisher: { "@type": "Organization", name: "Ассоциация офтальмологических клиник" },
        }}
      />
    </TemplateShell>
  );
}
