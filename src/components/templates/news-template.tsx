import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import { AppealInvitation } from "@/components/appeals/appeal-invitation";
import { EntityBadge } from "@/components/entity/entity-badge";
import { EntityBlock } from "@/components/entity/entity-block";
import { NewsMembershipCta } from "@/components/news/news-membership-cta";
import { NewsVideo } from "@/components/news/news-video";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getPublicInvestigationDocumentTitle } from "@/lib/investigation-documents";
import type { NewsDetail } from "@/lib/loaders";
import { resolveNewsEvent } from "@/lib/news-event";
import {
  groupNewsBlocks,
  newsOpenGraphImage,
  parseNewsContent,
  type NewsFigure,
  type NewsFlowBlock,
  type NewsInline,
} from "@/lib/news-content";
import {
  NEWS_CONFERENCE_FRAME_HEIGHT,
  NEWS_CONFERENCE_FRAME_WIDTH,
  NEWS_CONFERENCE_VIDEO_HEIGHT,
  NEWS_CONFERENCE_VIDEO_URL,
  NEWS_CONFERENCE_VIDEO_WIDTH,
  parseNewsChapters,
  parseNewsGallery,
  parseNewsHighlights,
} from "@/lib/news-media";
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

function NewsInlines({ inlines }: { inlines: NewsInline[] }) {
  return inlines.map((inline, index) =>
    inline.type === "text" ? (
      <span key={index}>{inline.text}</span>
    ) : (
      <a
        className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
        href={inline.href}
        key={index}
        {...(inline.href.startsWith("https://") ? { rel: "noopener noreferrer", target: "_blank" } : {})}
      >
        {inline.text}
      </a>
    ),
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

function NewsFlow({ block }: { block: NewsFlowBlock }) {
  if (block.type === "paragraph") {
    return (
      <p className="text-[15px] leading-7 text-foreground/80">
        <NewsInlines inlines={block.inlines} />
      </p>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="space-y-2 text-[15px] leading-7 text-foreground/80">
        {block.items.map((item, itemIndex) => (
          <li className="relative pl-5 before:absolute before:left-0 before:top-[0.72em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary" key={itemIndex}>
            <NewsInlines inlines={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "callout") {
    return (
      <aside className="rounded-lg border border-primary/20 bg-accent p-5" aria-label={block.title}>
        <div className="flex items-center gap-2">
          <Eye aria-hidden className="h-5 w-5 shrink-0 text-primary" />
          <h3 className="text-base font-semibold text-foreground">{block.title}</h3>
        </div>
        <ul className="mt-3 space-y-3 text-[15px] leading-7 text-foreground/80">
          {block.items.map((item) => (
            <li className="relative pl-5 before:absolute before:left-0 before:top-[0.72em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </aside>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l-4 border-primary bg-secondary px-4 py-3">
        <p className="text-[15px] leading-7 text-foreground">{block.text}</p>
        <footer className="mt-3 text-sm leading-6">
          <span className="block font-semibold text-foreground">{block.name}</span>
          <span className="mt-1 block text-foreground/80">{block.credentials}</span>
        </footer>
      </blockquote>
    );
  }

  return null;
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
            if (block.type === "figures") {
              const eagerLead =
                index === firstFigureSection &&
                blockIndex === section.blocks.findIndex((item) => item.type === "figures");
              return <NewsFigureGroup eagerLead={eagerLead} figures={block.figures} key={blockIndex} />;
            }
            return <NewsFlow block={block} key={blockIndex} />;
          })}
        </section>
      ))}
    </article>
  );
}

function collectNewsRelations(data: NewsDetail) {
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

  return { investigations, evidenceDocuments, clinics, equipment, procedures, diseases, clinicResources };
}

function NewsSidebar({
  data,
  eventHref,
  eventTitle,
}: {
  data: NewsDetail;
  eventHref?: string | null;
  eventTitle?: string | null;
}) {
  const { investigations, evidenceDocuments, clinics, equipment, procedures, diseases, clinicResources } = collectNewsRelations(data);

  return (
    <aside className="space-y-5">
      {eventHref && eventTitle && (
        <EntityBlock title="Мероприятие">
          <Link
            className="block rounded-md border bg-background p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
            href={eventHref}
          >
            <span className="font-medium text-primary">{eventTitle}</span>
            <span className="mt-2 inline-block text-xs font-semibold text-primary">Страница мероприятия →</span>
          </Link>
        </EntityBlock>
      )}
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
    </aside>
  );
}

function NewsStructuredData({ data }: { data: NewsDetail }) {
  const figure = !data.coverImageUrl && data.content ? newsOpenGraphImage(data.content) : undefined;
  return (
    <>
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
          url: absoluteUrl("/news/" + data.slug),
          mainEntityOfPage: absoluteUrl("/news/" + data.slug),
          ...(data.coverImageUrl
            ? {
                image: {
                  "@type": "ImageObject",
                  url: absoluteUrl(data.coverImageUrl),
                  ...(data.coverImageAlt ? { caption: data.coverImageAlt } : {}),
                },
              }
            : figure
              ? {
                  image: {
                    "@type": "ImageObject",
                    url: absoluteUrl(figure.src),
                    width: figure.width,
                    height: figure.height,
                    caption: figure.alt,
                  },
                }
              : {}),
          ...(data.videoUrl
            ? {
                video: {
                  "@type": "VideoObject",
                  name: data.seoTitle || data.title,
                  description: data.summary,
                  contentUrl: absoluteUrl(data.videoUrl),
                  ...(data.videoPosterUrl ? { thumbnailUrl: absoluteUrl(data.videoPosterUrl) } : {}),
                  ...(data.publishedAt ? { uploadDate: data.publishedAt.toISOString() } : {}),
                },
              }
            : {}),
          ...(data.publishedAt ? { datePublished: data.publishedAt.toISOString() } : {}),
          dateModified: data.updatedAt.toISOString(),
          publisher: { "@type": "Organization", name: "Ассоциация офтальмологических клиник" },
        }}
      />
    </>
  );
}

function InvestigationContinuation({ data, showAppeal }: { data: NewsDetail; showAppeal: boolean }) {
  const { investigations } = collectNewsRelations(data);
  if (!showAppeal && investigations.length === 0) return null;

  return (
    <>
      {showAppeal && (
        <div className={investigations.length > 0 ? "mt-8" : undefined}>
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
    </>
  );
}

function isMultimediaNews(data: NewsDetail) {
  return Boolean(
    data.videoUrl ||
      data.coverImageUrl ||
      data.badges.length > 0 ||
      data.showMembershipCta ||
      data.eventSlug ||
      parseNewsHighlights(data.highlights).length > 0 ||
      parseNewsGallery(data.gallery).length > 0,
  );
}

export function NewsTemplate({ data }: { data: NewsDetail }) {
  if (!isMultimediaNews(data)) return <StandardNewsTemplate data={data} />;
  return <MultimediaNewsTemplate data={data} />;
}

function StandardNewsTemplate({ data }: { data: NewsDetail }) {
  const relations = collectNewsRelations(data);
  const hasRelatedMaterials =
    relations.investigations.length > 0 ||
    relations.evidenceDocuments.length > 0 ||
    relations.clinics.length > 0 ||
    relations.equipment.length > 0 ||
    relations.procedures.length > 0 ||
    relations.diseases.length > 0 ||
    relations.clinicResources.length > 0;

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
          <InvestigationContinuation data={data} showAppeal={relations.investigations.length > 0} />
        </div>
        {hasRelatedMaterials && <NewsSidebar data={data} />}
      </div>
      <NewsStructuredData data={data} />
    </TemplateShell>
  );
}

function MultimediaNewsTemplate({ data }: { data: NewsDetail }) {
  const highlights = parseNewsHighlights(data.highlights);
  const chapters = parseNewsChapters(data.videoChapters);
  const gallery = parseNewsGallery(data.gallery);
  const eventLink = resolveNewsEvent(data.eventSlug);
  const badges = data.badges.length > 0 ? data.badges : ["Новости Ассоциации"];
  const videoWidth = data.videoUrl === NEWS_CONFERENCE_VIDEO_URL ? NEWS_CONFERENCE_VIDEO_WIDTH : 16;
  const videoHeight = data.videoUrl === NEWS_CONFERENCE_VIDEO_URL ? NEWS_CONFERENCE_VIDEO_HEIGHT : 9;
  const { investigations } = collectNewsRelations(data);
  const hasSidebar = Boolean(eventLink || investigations.length > 0);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ href: "/news", label: "Новости" }, { label: data.title }]} />
      <header className="rounded-lg border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Новости Ассоциации</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <EntityBadge key={badge}>{badge}</EntityBadge>
          ))}
        </div>
        {eventLink && (
          <p className="mt-4 text-sm leading-6 text-foreground">
            <time dateTime={eventLink.startsAt}>{eventLink.dateLabel}</time>, {eventLink.city}.{" "}
            <Link className="font-semibold text-primary hover:underline" href={eventLink.href}>
              {eventLink.venueName}
            </Link>
            , {eventLink.venueAddress}, зал «{eventLink.venueHall}», {eventLink.venueFloor}.{" "}
            <Link className="font-semibold text-primary hover:underline" href={eventLink.href}>
              Страница мероприятия
            </Link>
          </p>
        )}
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{data.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-foreground">{data.summary}</p>
      </header>

      {highlights.length > 0 && (
        <section aria-label="Краткие итоги" className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article className="rounded-lg border bg-card p-5" key={item.title}>
              <p className="text-base font-semibold text-foreground">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-foreground/80">{item.text}</p>
            </article>
          ))}
        </section>
      )}

      <div className={hasSidebar ? "grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]" : undefined}>
        <div className="min-w-0 space-y-8">
          {data.videoUrl && (
            <NewsVideo
              chapters={chapters}
              height={videoHeight}
              poster={data.videoPosterUrl}
              src={data.videoUrl}
              width={videoWidth}
            />
          )}
          {data.content && <NewsArticle content={data.content} />}
          {gallery.length > 0 && (
            <section aria-label="Кадры с конференции">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {gallery.map((item, index) => (
                  <li
                    className={
                      index === gallery.length - 1 && gallery.length % 2 === 1
                        ? "overflow-hidden rounded-lg border bg-card sm:col-span-2"
                        : "overflow-hidden rounded-lg border bg-card"
                    }
                    key={item.src}
                  >
                    <Image
                      alt={item.alt}
                      className="aspect-[1046/576] w-full object-cover"
                      height={NEWS_CONFERENCE_FRAME_HEIGHT}
                      sizes="(min-width: 1280px) 420px, (min-width: 640px) 50vw, 100vw"
                      src={item.src}
                      width={NEWS_CONFERENCE_FRAME_WIDTH}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <InvestigationContinuation data={data} showAppeal={investigations.length > 0 && !data.showMembershipCta} />
          {data.showMembershipCta && <NewsMembershipCta />}
        </div>
        {hasSidebar && <NewsSidebar data={data} eventHref={eventLink?.href} eventTitle={eventLink?.title} />}
      </div>
      <NewsStructuredData data={data} />
    </div>
  );
}
