import { UserRound } from "lucide-react";
import Link from "next/link";
import {
  DocCard,
  InfoField,
  NoveltyCard,
  PracticalCard,
  ResultCard,
  parseOrganization,
  parseSupervisor,
  splitIntoParagraphs,
} from "@/components/entity/scientific-work-ui";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { ScientificWorkDetail } from "@/lib/loaders";
import { doctorFullName } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

const CARD =
  "rounded-[13px] border border-[#d8e3e1] bg-card p-[17px_18px] shadow-[0_1px_2px_rgba(15,33,31,0.04),0_4px_14px_rgba(15,33,31,0.05)]";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={CARD}>
      <h2 className="mb-[13px] text-[14.5px] font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Pill({ href, title }: { href: string; title: string }) {
  return (
    <Link
      className="inline-flex items-center gap-1 rounded-[7px] px-[9px] py-[3px] text-[12px] font-medium transition-opacity hover:opacity-80"
      href={href}
      style={{ background: "#e6f4f5", color: "#0a5d65" }}
    >
      {title} <span aria-hidden>↗</span>
    </Link>
  );
}

const SOURCE_STATUS_LABELS = {
  FULL_TEXT: "Полный текст проверен",
  EXTRACTED_PAGES: "Полный источник · страницы выпуска",
  SCANNED_PAGES: "Полный источник · сканированные страницы",
  BIBLIOGRAPHIC_ONLY: "Только библиографические данные",
} as const;

const CONTENT_SECTION_LABELS = {
  ORIGINAL_RESEARCH: {
    summary: "Краткое описание",
    novelty: "Актуальность",
    practical: "Материалы и методы",
    results: "Результаты",
    conclusions: "Вывод / практическое значение",
  },
  CLINICAL_CASE: {
    summary: "Краткое описание",
    novelty: "Актуальность",
    practical: "Клинический случай и методика",
    results: "Результаты",
    conclusions: "Вывод / практическое значение",
  },
  REVIEW: {
    summary: "Краткое описание",
    novelty: "Актуальность",
    practical: "Обзор и направления применения",
    results: "Положения статьи",
    conclusions: "Вывод / практическое значение",
  },
  THESIS: {
    summary: "Аннотация",
    novelty: "Научная новизна",
    practical: "Материалы и методы",
    results: "Основные результаты",
    conclusions: "Вывод / практическое значение",
  },
  OTHER: {
    summary: "Краткое описание",
    novelty: "Актуальность",
    practical: "Методика",
    results: "Результаты",
    conclusions: "Вывод / практическое значение",
  },
} as const;

function getScientificWorkImageMeta(src: string, workTitle: string) {
  const meta: Record<string, { alt: string; caption: string }> = {
    "fundus-left-eye-before.png": {
      alt: "Фото глазного дна левого глаза при ретинопатии Вальсальвы",
      caption:
        "Рис. 1. Фото глазного дна левого глаза: массивное кровоизлияние диаметром более трёх диаметров диска зрительного нерва.",
    },
    "oct-left-eye-before.png": {
      alt: "ОКТ левого глаза до YAG лазерной гиалоидопунктуры",
      caption:
        "Рис. 2. ОКТ левого глаза: обширное кровоизлияние между гиалоидной мембраной и сетчаткой с захватом фовеа.",
    },
    "oct-after-yag-gialoidopunktura.png": {
      alt: "ОКТ левого глаза после YAG лазерной гиалоидопунктуры",
      caption: "Рис. 3. ОКТ левого глаза после проведённой YAG лазерной гиалоидопунктуры.",
    },
    "oct-day-1-after-treatment.png": {
      alt: "ОКТ на первый день после YAG лазерной гиалоидопунктуры",
      caption: "Рис. 4. ОКТ на 1-й день после проведённой YAG лазерной гиалоидопунктуры.",
    },
    "oct-day-5-after-treatment.png": {
      alt: "ОКТ на пятые сутки после YAG лазерной гиалоидопунктуры и лечения",
      caption:
        "Рис. 5. ОКТ на 5-е сутки после YAG лазерной гиалоидопунктуры и курса медикаментозного лечения.",
    },
  };
  const fileName = src.split("/").pop() ?? src;
  return (
    meta[fileName] ?? {
      alt: `Иллюстрация к научной работе «${workTitle}»`,
      caption: "Иллюстрация из первичного документа научной работы.",
    }
  );
}

export function ScientificWorkTemplate({ data }: { data: ScientificWorkDetail }) {
  const authorName = doctorFullName(data.doctor);
  const sourceStatusLabel = SOURCE_STATUS_LABELS[data.sourceStatus];
  const badges = [
    data.type,
    data.year ? String(data.year) : null,
    data.journal,
    sourceStatusLabel,
  ].filter(Boolean) as string[];
  const supervisor = data.supervisor ? parseSupervisor(data.supervisor) : null;
  const org = data.organization ? parseOrganization(data.organization) : null;
  const summaryParagraphs = data.summary ? splitIntoParagraphs(data.summary) : [];
  const clinics = data.doctor.clinics.map((r) => r.clinic);
  const sectionLabels = CONTENT_SECTION_LABELS[data.contentKind];
  const bibliographicOnly = data.sourceStatus === "BIBLIOGRAPHIC_ONLY";
  const canShowLocalAssets =
    data.rightsVerifiedAt !== null && data.rightsBasis !== "UNVERIFIED";
  const publicationAuthors = data.authors.length > 0 ? data.authors : [authorName];
  const publicationMeta = [data.journal, data.year ? String(data.year) : null]
    .filter(Boolean)
    .join(" · ");
  const documentsAvailable = Boolean(
    data.sourcePageUrl ||
      data.sourcePdfUrl ||
      (canShowLocalAssets && (data.abstractUrl || data.pdfUrl)),
  );
  const periodical = data.journal
    ? { "@type": "Periodical", name: data.journal }
    : null;
  const publicationVolume =
    periodical && data.volume
      ? {
          "@type": "PublicationVolume",
          volumeNumber: data.volume,
          isPartOf: periodical,
        }
      : periodical;
  const journalIsPartOf =
    publicationVolume && data.issue
      ? {
          "@type": "PublicationIssue",
          issueNumber: data.issue,
          isPartOf: publicationVolume,
        }
      : publicationVolume;

  return (
    <TemplateShell
      badges={badges}
      breadcrumbs={[{ href: "/publications", label: "Научные работы" }, { label: data.title }]}
      description={[publicationAuthors.join(", "), publicationMeta].filter(Boolean).join(" · ")}
      eyebrow="Научная деятельность"
      title={data.title}
    >
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="space-y-4">
          {/* ── Информационный блок ── */}
          <Section title="О работе">
            <div className="grid gap-[16px] sm:grid-cols-2">
              <InfoField label="Авторы публикации">
                <p className="font-semibold">{publicationAuthors.join(", ")}</p>
              </InfoField>

              <InfoField label="Автор в энциклопедии">
                <Link
                  className="font-semibold hover:text-primary"
                  href={`/doctors/${data.doctor.slug}`}
                >
                  {authorName}
                </Link>
                {data.degree && (
                  <p className="text-[12.5px] text-muted-foreground">{data.degree}</p>
                )}
              </InfoField>

              <InfoField label="Тема исследования">
                <p className="font-semibold">{data.topic ?? data.title}</p>
              </InfoField>

              {data.journal && (
                <InfoField label="Издание">
                  <p className="font-semibold">{data.journal}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {[
                      data.year ? String(data.year) : null,
                      data.volume ? `т. ${data.volume}` : null,
                      data.issue ? `№ ${data.issue}` : null,
                      data.pages ? `с. ${data.pages}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </InfoField>
              )}

              {data.contentKind === "THESIS" && org && (
                <InfoField label="Организация / место защиты">
                  {org.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  {org.city && <p className="font-medium text-foreground/70">{org.city}</p>}
                  {data.year != null && (
                    <p className="font-medium text-foreground/70">{data.year} год</p>
                  )}
                </InfoField>
              )}

              {supervisor && (
                <InfoField label="Научный руководитель">
                  <p className="font-semibold">{supervisor.name}</p>
                  {supervisor.titles.map((t) => (
                    <p className="text-[12.5px] text-muted-foreground" key={t}>
                      {t}
                    </p>
                  ))}
                </InfoField>
              )}

              {data.speciality && (
                <InfoField
                  label={data.contentKind === "THESIS" ? "Специальность" : "Научное направление"}
                >
                  <p>{data.speciality}</p>
                </InfoField>
              )}

              {data.publicationCount != null && data.publicationCount > 0 && (
                <InfoField label="Публикации по теме">
                  <p className="font-semibold">{data.publicationCount} публикаций</p>
                </InfoField>
              )}

              {data.bibliography && (
                <div className="sm:col-span-2">
                  <InfoField label="Библиографическая ссылка">
                    <p>{data.bibliography}</p>
                  </InfoField>
                </div>
              )}

              {data.doi && (
                <InfoField label="DOI">
                  <a
                    className="font-semibold text-primary hover:underline"
                    href={`https://doi.org/${data.doi}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {data.doi}
                  </a>
                </InfoField>
              )}
            </div>
          </Section>

          <Section title="Статус и первичный источник">
            <div className="space-y-[7px] text-[13.5px] leading-relaxed text-foreground/85">
              <p className="font-semibold text-foreground">{sourceStatusLabel}</p>
              {bibliographicOnly && (
                <>
                  <p>Источник полного текста не найден.</p>
                  <p>Карточка подготовлена по библиографическим данным.</p>
                </>
              )}
              {data.sourceNote && <p>{data.sourceNote}</p>}
              {data.rightsNote?.trim() && (
                <p className="text-[12.5px] text-muted-foreground">
                  Права на локальные материалы: {data.rightsNote}
                </p>
              )}
            </div>
          </Section>

          {/* ── Аннотация ── */}
          {summaryParagraphs.length > 0 && (
            <div className="rounded-[11px] border-l-[3px] border-primary bg-primary/[0.04] p-[16px_18px]">
              <h2 className="mb-[10px] text-[12px] font-bold uppercase tracking-[0.06em] text-primary">
                {sectionLabels.summary}
              </h2>
              <div className="space-y-[10px]">
                {summaryParagraphs.map((para, i) => (
                  <p className="text-[13.5px] leading-[1.7] text-foreground/85" key={i}>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ── Научная новизна / актуальность ── */}
          {!bibliographicOnly && data.novelty.length > 0 && (
            <Section title={sectionLabels.novelty}>
              <div className="space-y-[8px]">
                {data.novelty.map((n) => (
                  <NoveltyCard key={n} text={n} />
                ))}
              </div>
            </Section>
          )}

          {/* ── Практическая значимость / клинический случай ── */}
          {!bibliographicOnly && data.practicalValue.length > 0 && (
            <Section title={sectionLabels.practical}>
              <div className="space-y-[8px]">
                {data.practicalValue.map((p) => (
                  <PracticalCard key={p} text={p} />
                ))}
              </div>
            </Section>
          )}

          {/* ── Основные результаты / выводы ── */}
          {!bibliographicOnly && data.results.length > 0 && (
            <Section title={sectionLabels.results}>
              <div className="grid gap-[10px] sm:grid-cols-2">
                {data.results.map((r) => (
                  <ResultCard key={r} text={r} />
                ))}
              </div>
            </Section>
          )}

          {!bibliographicOnly && data.conclusions.length > 0 && (
            <Section title={sectionLabels.conclusions}>
              <div className="space-y-[8px]">
                {data.conclusions.map((conclusion) => (
                  <PracticalCard key={conclusion} text={conclusion} />
                ))}
              </div>
            </Section>
          )}

          {canShowLocalAssets && data.images.length > 0 && (
            <Section title="Иллюстрации из статьи">
              <div className="grid gap-[10px] sm:grid-cols-2">
                {data.images.map((src) => {
                  const image = getScientificWorkImageMeta(src, data.title);
                  return (
                    <figure key={src}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={image.alt}
                        className="aspect-[4/3] w-full rounded-[10px] border border-[#d8e3e1] object-cover"
                        decoding="async"
                        loading="lazy"
                        src={src}
                      />
                      <figcaption className="mt-2 text-[11.5px] leading-snug text-muted-foreground">
                        {image.caption}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ── Документы ── */}
          {documentsAvailable && (
            <Section title="Документы исследования">
              <div className="grid gap-[10px] sm:grid-cols-2">
                {canShowLocalAssets && data.abstractUrl && (
                  <DocCard
                    description="PDF · Краткое изложение диссертации"
                    href={data.abstractUrl}
                    title="Автореферат"
                    actionLabel="Скачать PDF"
                    download
                  />
                )}
                {canShowLocalAssets && data.pdfUrl && (
                  <DocCard
                    actionLabel="Скачать PDF"
                    description="PDF · Локальная копия первичного документа"
                    download
                    href={data.pdfUrl}
                    title={data.contentKind === "THESIS" ? "Полный текст диссертации" : "Полный текст статьи"}
                  />
                )}
                {data.sourcePageUrl && (
                  <DocCard
                    actionLabel="Открыть источник"
                    description={
                      bibliographicOnly
                        ? "Страница, подтверждающая библиографические данные"
                        : "Страница публикации на сайте первоисточника"
                    }
                    href={data.sourcePageUrl}
                    title={
                      bibliographicOnly
                        ? "Библиографический источник"
                        : "Страница первоисточника"
                    }
                  />
                )}
                {data.sourcePdfUrl && (
                  <DocCard
                    actionLabel="Открыть PDF"
                    description="Внешний файл на сайте источника"
                    href={data.sourcePdfUrl}
                    title="PDF на сайте издателя"
                  />
                )}
              </div>
            </Section>
          )}
        </article>

        {/* ── SIDEBAR: граф связей ── */}
        <aside className="space-y-4">
          <Section title="Автор">
            <Link
              className="group flex items-center gap-[11px] rounded-[11px] border border-[#d8e3e1] bg-background p-[10px_11px] transition-colors hover:border-primary/50 hover:bg-primary/5"
              href={`/doctors/${data.doctor.slug}`}
            >
              <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                {data.doctor.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={authorName}
                    className="h-full w-full object-cover"
                    decoding="async"
                    loading="lazy"
                    src={data.doctor.photoUrl}
                  />
                ) : (
                  <UserRound className="h-5 w-5 text-primary" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {authorName}
                </span>
                {(data.doctor.position ?? data.doctor.category) && (
                  <span className="block text-[12px] text-muted-foreground">
                    {data.doctor.position ?? data.doctor.category}
                  </span>
                )}
              </span>
              <span aria-hidden className="text-muted-foreground">
                →
              </span>
            </Link>
          </Section>

          {data.diseases.length > 0 && (
            <Section title="Заболевания в исследовании">
              <div className="flex flex-wrap gap-[6px]">
                {data.diseases.map((r) => (
                  <Pill href={`/diseases/${r.disease.slug}`} key={r.disease.slug} title={r.disease.title} />
                ))}
              </div>
            </Section>
          )}

          {data.procedures.length > 0 && (
            <Section title="Методики в исследовании">
              <div className="flex flex-wrap gap-[6px]">
                {data.procedures.map((r) => (
                  <Pill
                    href={`/procedures/${r.procedure.slug}`}
                    key={r.procedure.slug}
                    title={r.procedure.title}
                  />
                ))}
              </div>
            </Section>
          )}

          {data.equipment.length > 0 && (
            <Section title="Оборудование в работе">
              <div className="space-y-[8px]">
                {data.equipment.map((r) => (
                  <Link
                    className="group flex items-center justify-between gap-[8px] rounded-[11px] border border-[#d8e3e1] bg-background p-[10px_11px] transition-colors hover:border-primary/50 hover:bg-primary/5"
                    href={`/equipment/${r.equipment.slug}`}
                    key={r.equipment.slug}
                  >
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {r.equipment.title}
                      </span>
                      {r.equipment.manufacturer && (
                        <span className="block text-[12px] text-muted-foreground">
                          {r.equipment.manufacturer}
                        </span>
                      )}
                    </span>
                    <span aria-hidden className="text-muted-foreground">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {clinics.length > 0 && (
            <Section title="Клиники автора">
              <div className="space-y-[8px]">
                {clinics.map((c) => (
                  <Link
                    className="group flex items-center justify-between gap-[8px] rounded-[11px] border border-[#d8e3e1] bg-background p-[10px_11px] transition-colors hover:border-primary/50 hover:bg-primary/5"
                    href={`/clinics/${c.slug}`}
                    key={c.slug}
                  >
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {c.title}
                      </span>
                      {c.city && <span className="block text-[12px] text-muted-foreground">{c.city}</span>}
                    </span>
                    <span aria-hidden className="text-muted-foreground">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {data.relatedWorks.length > 0 && (
            <Section title="Связанные научные работы">
              <div className="space-y-[8px]">
                {data.relatedWorks.map((work) => (
                  <Link
                    className="group flex items-center justify-between gap-[8px] rounded-[11px] border border-[#d8e3e1] bg-background p-[10px_11px] transition-colors hover:border-primary/50 hover:bg-primary/5"
                    href={`/publications/${work.slug}`}
                    key={work.slug}
                  >
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {work.title}
                      </span>
                      <span className="block text-[12px] text-muted-foreground">
                        {[work.type, work.year ? String(work.year) : null].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span aria-hidden className="text-muted-foreground">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

        </aside>
      </div>

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/publications", label: "Научные работы" },
          { href: `/publications/${data.slug}`, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": data.contentKind === "THESIS" ? "Thesis" : "ScholarlyArticle",
          headline: data.title,
          url: absoluteUrl(`/publications/${data.slug}`),
          author: publicationAuthors.map((name, index) => ({
            "@type": "Person",
            name,
            ...(index === data.doctorAuthorIndex
              ? { url: absoluteUrl(`/doctors/${data.doctor.slug}`) }
              : {}),
          })),
          ...(data.summary ? { abstract: data.summary } : {}),
          ...(data.year != null ? { datePublished: String(data.year) } : {}),
          ...(data.bibliography ? { citation: data.bibliography } : {}),
          ...(journalIsPartOf ? { isPartOf: journalIsPartOf } : {}),
          ...(data.pages ? { pagination: data.pages } : {}),
          ...(data.contentKind === "THESIS" && data.degree
            ? { inSupportOf: data.degree }
            : {}),
          ...(data.doi
            ? {
                identifier: {
                  "@type": "PropertyValue",
                  propertyID: "DOI",
                  value: data.doi,
                },
              }
            : {}),
          ...([data.sourcePageUrl, data.doi ? `https://doi.org/${data.doi}` : null].filter(Boolean)
            .length > 0
            ? {
                sameAs: [
                  data.sourcePageUrl,
                  data.doi ? `https://doi.org/${data.doi}` : null,
                ].filter(Boolean),
              }
            : {}),
          ...(canShowLocalAssets && data.images.length > 0
            ? { image: data.images.map((src) => absoluteUrl(src)) }
            : {}),
          ...(canShowLocalAssets && data.pdfUrl
            ? {
                encoding: {
                  "@type": "MediaObject",
                  contentUrl: absoluteUrl(data.pdfUrl),
                  encodingFormat: "application/pdf",
                },
              }
            : {}),
          ...(data.organization
            ? { publisher: { "@type": "Organization", name: data.organization } }
            : {}),
        }}
      />
    </TemplateShell>
  );
}
