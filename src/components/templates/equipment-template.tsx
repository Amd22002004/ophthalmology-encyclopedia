import { UserRound } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import {
  getDocumentMeta,
  getEquipmentEditorial,
  getEquipmentImageMeta,
} from "@/lib/equipment-editorial";
import type { EquipmentDetail } from "@/lib/loaders";
import { doctorFullName } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";

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

/** Маркированный список (преимущества / показания / ограничения). */
function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-[6px]">
      {items.map((item) => (
        <li
          className="relative pl-[14px] text-[13px] leading-relaxed text-foreground/80 before:absolute before:left-0 before:top-[7px] before:h-[4px] before:w-[4px] before:rounded-full before:bg-primary/60"
          key={item}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Карточка связанной сущности. */
function LinkCard({
  href,
  title,
  meta,
  children,
}: {
  href: string;
  title: string;
  meta?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <Link
      className="group flex items-center gap-[11px] rounded-[11px] border border-[#d8e3e1] bg-background p-[10px_11px] transition-colors hover:border-primary/50 hover:bg-primary/5"
      href={href}
    >
      {children}
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {title}
        </span>
        {meta && <span className="block text-[12px] text-muted-foreground">{meta}</span>}
      </span>
      <span aria-hidden className="text-muted-foreground">
        →
      </span>
    </Link>
  );
}

export function EquipmentTemplate({ data }: { data: EquipmentDetail }) {
  const badges = [
    data.category?.title,
    data.manufacturer,
    data.country,
    data.year ? String(data.year) : null,
  ].filter(Boolean) as string[];

  const heroImage = data.images[0] ?? null;
  const gallery = data.images;
  const editorial = getEquipmentEditorial(data.slug);
  const evolutionIndex = data.evolution.findIndex((item) => item.slug === data.slug);
  const comparisonsByTitle = new Map(data.comparisonEquipment.map((item) => [item.title, item]));
  const associationInvestigations = data.investigations.map((relation) => relation.investigation);
  const associationNews = Array.from(
    new Map(
      data.investigations.flatMap((relation) =>
        relation.investigation.news.map(({ news }) => [news.slug, news]),
      ),
    ).values(),
  );

  // Группировка технических характеристик для таблицы
  const specGroups = data.specs.reduce<Record<string, typeof data.specs>>((acc, s) => {
    const key = s.group ?? "Характеристики";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  return (
    <TemplateShell
      badges={badges}
      breadcrumbs={[{ href: "/equipment", label: "Оборудование" }, { label: data.title }]}
      description={data.summary ?? ""}
      eyebrow={data.category?.title ?? "Оборудование"}
      title={data.title}
    >
      <div className="space-y-4">
        {/* ── HERO ── */}
        <section className={CARD}>
          <div className="grid gap-[18px] sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] items-start">
            {heroImage ? (
              /* aspect-ratio резервирует место под изображение до загрузки → CLS = 0
                 без хранения пиксельных размеров в БД. Hero — LCP-кандидат, не lazy. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={getEquipmentImageMeta(data.slug, heroImage, data.title).alt}
                className="aspect-[3/2] w-full rounded-[11px] border border-[#d8e3e1] object-cover"
                decoding="async"
                fetchPriority="high"
                src={heroImage}
              />
            ) : null}
            <dl className="grid grid-cols-1 gap-x-[18px] gap-y-[8px] sm:grid-cols-2">
              {data.manufacturer && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Производитель
                  </dt>
                  <dd className="mt-0.5 text-[13px] font-semibold text-foreground">
                    {data.manufacturer}
                  </dd>
                </div>
              )}
              {data.country && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Страна
                  </dt>
                  <dd className="mt-0.5 text-[13px] font-semibold text-foreground">
                    {data.country}
                  </dd>
                </div>
              )}
              {data.category?.title && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Тип оборудования
                  </dt>
                  <dd className="mt-0.5 text-[13px] font-semibold text-foreground">
                    {data.category.title}
                  </dd>
                </div>
              )}
              {data.year != null && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Год появления
                  </dt>
                  <dd className="mt-0.5 text-[13px] font-semibold text-foreground">{data.year}</dd>
                </div>
              )}
              {data.supplier && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Поставщик
                  </dt>
                  <dd className="mt-0.5 text-[13px] font-semibold">
                    <Link
                      className="text-primary hover:underline"
                      href={`/suppliers/${data.supplier.slug}`}
                    >
                      {data.supplier.title}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {data.description && (
              <Section title="Описание">
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-foreground/80">
                  {data.description}
                </p>
              </Section>
            )}

            {editorial?.history && (
              <Section title="История модели">
                <div className="space-y-3 text-[13.5px] leading-relaxed text-foreground/80">
                  {editorial.history.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {editorial.history.sources.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {editorial.history.sources.map((source) => (
                      <a
                        className="rounded-[8px] border border-[#d8e3e1] bg-background px-3 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary/5"
                        href={source.href}
                        key={source.href}
                        rel="noopener"
                        target="_blank"
                      >
                        {source.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {data.evolution.length > 1 && (
              <Section title="Эволюция модели">
                <ol className="grid gap-2 sm:grid-cols-2">
                  {data.evolution.map((item, index) => {
                    const isCurrent = item.slug === data.slug;
                    const isPreviousModel = index === evolutionIndex - 1;
                    const isNextModel = index === evolutionIndex + 1;
                    return isCurrent ? (
                      <li
                        className="rounded-[10px] border border-primary/40 bg-primary/5 p-3"
                        key={item.slug}
                      >
                        <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                          {item.year ?? "Без подтверждённого года"}
                        </span>
                        <span className="mt-1 block text-[13px] font-semibold text-foreground">{item.title}</span>
                        <span className="mt-1 block text-[11.5px] text-muted-foreground">Текущая карточка</span>
                      </li>
                    ) : (
                      <li key={item.slug}>
                        <LinkCard
                          href={`/equipment/${item.slug}`}
                          meta={item.year ? `Поколение ${item.year}` : item.summary}
                          title={
                            isPreviousModel
                              ? `← Предыдущая модель: ${item.title}`
                              : isNextModel
                                ? `Следующая модель: ${item.title} →`
                                : `Этап подтверждённой линии: ${item.title}`
                          }
                        />
                      </li>
                    );
                  })}
                </ol>
                {evolutionIndex === 0 && (
                  <p className="mt-3 rounded-[10px] border border-dashed border-[#d8e3e1] p-3 text-[12px] text-muted-foreground">
                    Предыдущая модель не указана в подтверждённой линии.
                  </p>
                )}
                {evolutionIndex === data.evolution.length - 1 && (
                  <p className="mt-3 rounded-[10px] border border-dashed border-[#d8e3e1] p-3 text-[12px] text-muted-foreground">
                    Следующее подтверждённое поколение пока не добавлено.
                  </p>
                )}
              </Section>
            )}

            {editorial?.timeline && editorial.timeline.length > 0 && (
              <Section title="Таймлайн развития">
                <ol className="relative ml-1 space-y-4 border-l border-primary/25 pl-5">
                  {editorial.timeline.map((event) => (
                    <li className="relative" key={`${event.year}-${event.title}`}>
                      <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                        {event.year}
                      </span>
                      <h3 className="mt-0.5 text-[13px] font-semibold text-foreground">{event.title}</h3>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{event.description}</p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {data.principle && (
              <Section title="Принцип работы">
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-foreground/80">
                  {data.principle}
                </p>
              </Section>
            )}

            {data.advantages.length > 0 && (
              <Section title="Преимущества">
                <BulletList items={data.advantages} />
              </Section>
            )}

            {data.indications.length > 0 && (
              <Section title="Показания">
                <BulletList items={data.indications} />
              </Section>
            )}

            {data.limitations.length > 0 && (
              <Section title="Ограничения">
                <BulletList items={data.limitations} />
              </Section>
            )}

            {/* ── Технические характеристики ── */}
            {data.specs.length > 0 && (
              <Section title="Технические характеристики">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <caption className="sr-only">Технические характеристики {data.title}</caption>
                    <tbody>
                      {Object.entries(specGroups).map(([group, rows]) => (
                        <Fragment key={group}>
                          <tr>
                            <th
                              className="pb-[6px] pt-[12px] text-left text-[11px] font-bold uppercase tracking-[0.08em] text-primary"
                              colSpan={2}
                              scope="colgroup"
                            >
                              {group}
                            </th>
                          </tr>
                          {rows.map((s) => (
                            <tr className="border-t border-[#d8e3e1]" key={s.id}>
                              <th
                                className="w-[45%] py-[8px] pr-[12px] text-left align-top font-normal text-muted-foreground"
                                scope="row"
                              >
                                {s.label}
                              </th>
                              <td className="py-[8px] align-top font-semibold text-foreground">
                                {s.value}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* ── Галерея ── */}
            {gallery.length > 0 && (
              <Section title="Галерея">
                <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3">
                  {gallery.map((src) => (
                    <figure key={src}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={getEquipmentImageMeta(data.slug, src, data.title).alt}
                        className="aspect-[4/3] w-full rounded-[10px] border border-[#d8e3e1] object-cover"
                        decoding="async"
                        loading="lazy"
                        src={src}
                      />
                      <figcaption className="mt-2 text-[11px] leading-snug text-muted-foreground">
                        {getEquipmentImageMeta(data.slug, src, data.title).caption}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Документы ── */}
            {data.manuals.length > 0 && (
              <Section title="Документы">
                <div className="grid gap-[8px] sm:grid-cols-2">
                  {data.manuals.map((url) => {
                    const document = getDocumentMeta(data.slug, url);
                    return (
                    <a
                      className="group rounded-[9px] border border-[#d8e3e1] bg-background p-[11px] transition-colors hover:border-primary/50 hover:bg-primary/5"
                      href={url}
                      key={url}
                      rel="noopener"
                      target="_blank"
                    >
                      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold leading-snug text-foreground group-hover:text-primary">
                        <span aria-hidden>📄</span>
                        {document.title}
                      </span>
                      <span className="mt-1 block text-[11.5px] leading-snug text-muted-foreground">
                        {document.description}
                      </span>
                      <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#176d69]">
                        {document.source} · {document.type}
                        {document.pages ? ` · ${document.pages} стр.` : ""}
                      </span>
                      <span className="mt-2 block text-[12px] font-semibold text-primary">Открыть PDF →</span>
                    </a>
                    );
                  })}
                </div>
              </Section>
            )}

            {editorial?.videos && editorial.videos.length > 0 && (
              <Section title="Видео">
                <div className="space-y-4">
                  {editorial.videos.map((video) => (
                    <div key={video.embedUrl}>
                      <div className="aspect-video overflow-hidden rounded-[10px] border border-[#d8e3e1] bg-muted">
                        <iframe
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="h-full w-full"
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                          src={video.embedUrl}
                          title={video.title}
                        />
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{video.description}</p>
                      <a
                        className="mt-2 inline-block text-[12px] font-semibold text-primary hover:underline"
                        href={video.sourceHref}
                        rel="noopener"
                        target="_blank"
                      >
                        Открыть страницу Alcon ↗
                      </a>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {editorial?.comparisonTargets && editorial.comparisonTargets.length > 0 && (
              <Section title="Сравнение оборудования">
                <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">
                  Сопоставление корректно только по первичным техническим документам конкретных моделей и их маркировке.
                  Карточки ниже связываются автоматически после появления в каталоге оборудования.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {editorial.comparisonTargets.map((target) => {
                    const equipment = comparisonsByTitle.get(target.title);
                    return equipment ? (
                      <LinkCard
                        href={`/equipment/${equipment.slug}`}
                        key={target.title}
                        meta={equipment.summary}
                        title={equipment.title}
                      />
                    ) : (
                      <div
                        className="rounded-[11px] border border-dashed border-[#d8e3e1] bg-background p-[11px]"
                        key={target.title}
                      >
                        <p className="text-[12.5px] font-semibold text-foreground">{target.title}</p>
                        <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{target.description}</p>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {editorial?.faq && editorial.faq.length > 0 && (
              <Section title="Вопросы и ответы">
                <div className="divide-y divide-[#d8e3e1]">
                  {editorial.faq.map((item) => (
                    <div className="py-3 first:pt-0 last:pb-0" key={item.question}>
                      <h3 className="text-[13px] font-semibold text-foreground">{item.question}</h3>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* ── SIDEBAR: связи ── */}
          <aside className="space-y-4">
            {data.clinics.length > 0 && (
              <Section title="Используется в клиниках">
                <div className="space-y-[8px]">
                  {data.clinics.map((r) => (
                    <LinkCard
                      href={`/clinics/${r.clinic.slug}`}
                      key={r.clinic.slug}
                      meta={r.clinic.city}
                      title={r.clinic.title}
                    />
                  ))}
                </div>
              </Section>
            )}

            {data.procedures.length > 0 && (
              <Section title="Используется для процедур">
                <div className="space-y-[8px]">
                  {data.procedures.map((r) => (
                    <LinkCard
                      href={`/procedures/${r.procedure.slug}`}
                      key={r.procedure.slug}
                      title={r.procedure.title}
                    />
                  ))}
                </div>
              </Section>
            )}

            {data.diseases.length > 0 && (
              <Section title="Применяется при заболеваниях">
                <div className="space-y-[8px]">
                  {data.diseases.map((r) => (
                    <LinkCard
                      href={`/diseases/${r.disease.slug}`}
                      key={r.disease.slug}
                      title={r.disease.title}
                    />
                  ))}
                </div>
              </Section>
            )}

            {data.scientificWorks.length > 0 && (
              <Section title="Научные работы">
                <div className="space-y-[8px]">
                  {data.scientificWorks.map((r) =>
                    r.work.slug ? (
                      <LinkCard
                        href={`/publications/${r.work.slug}`}
                        key={r.work.slug}
                        meta={[doctorFullName(r.work.doctor), r.work.year ? String(r.work.year) : null]
                          .filter(Boolean)
                          .join(" · ")}
                        title={r.work.title}
                      />
                    ) : null,
                  )}
                </div>
              </Section>
            )}

            {data.doctors.length > 0 && (
              <Section title="Работают врачи">
                <div className="space-y-[8px]">
                  {data.doctors.map((r) => (
                    <LinkCard
                      href={`/doctors/${r.doctor.slug}`}
                      key={r.doctor.slug}
                      meta={r.doctor.position ?? r.doctor.category}
                      title={doctorFullName(r.doctor)}
                    >
                      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                        {r.doctor.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={doctorFullName(r.doctor)}
                            className="h-full w-full object-cover"
                            src={r.doctor.photoUrl}
                          />
                        ) : (
                          <UserRound className="h-4 w-4 text-primary" />
                        )}
                      </span>
                    </LinkCard>
                  ))}
                </div>
              </Section>
            )}

            {associationInvestigations.length > 0 && (
              <Section title="Материалы Ассоциации">
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Карточка описывает модель оборудования в целом. Контекст опубликованных материалов относится к
                  конкретному экземпляру, указанному в расследовании.
                </p>
                <div className="space-y-[8px]">
                  {associationInvestigations.map((investigation) => (
                    <LinkCard
                      href={`/investigations/${investigation.slug}`}
                      key={investigation.slug}
                      meta="Полный контекст, документы и статус"
                      title={investigation.title}
                    />
                  ))}
                  {associationNews.map((news) => (
                    <LinkCard
                      href={`/news/${news.slug}`}
                      key={news.slug}
                      meta="Редакционная публикация Ассоциации"
                      title={news.title}
                    />
                  ))}
                </div>
              </Section>
            )}
          </aside>
        </div>
      </div>

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/equipment", label: "Оборудование" },
          { href: `/equipment/${data.slug}`, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalDevice",
          name: data.title,
          url: absoluteUrl(`/equipment/${data.slug}`),
          ...(data.description ? { description: data.description } : {}),
          ...(data.manufacturer
            ? { manufacturer: { "@type": "Organization", name: data.manufacturer } }
            : {}),
          ...(data.images.length > 0 ? { image: data.images.map((i) => absoluteUrl(i)) } : {}),
          ...(data.country ? { countryOfOrigin: data.country } : {}),
          ...(data.specs.length > 0
            ? {
                additionalProperty: data.specs.map((spec) => ({
                  "@type": "PropertyValue",
                  name: spec.group ? `${spec.group}: ${spec.label}` : spec.label,
                  value: spec.value,
                })),
              }
            : {}),
        }}
      />
      {editorial?.faq && editorial.faq.length > 0 && <SchemaOrg data={faqPageJsonLd(editorial.faq)} />}
    </TemplateShell>
  );
}
