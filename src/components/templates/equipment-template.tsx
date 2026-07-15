import { UserRound } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { EquipmentDetail } from "@/lib/loaders";
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
                alt={data.title}
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
          <main className="space-y-4">
            {data.description && (
              <Section title="Описание">
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-foreground/80">
                  {data.description}
                </p>
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={data.title}
                      className="aspect-[4/3] w-full rounded-[10px] border border-[#d8e3e1] object-cover"
                      decoding="async"
                      key={src}
                      loading="lazy"
                      src={src}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* ── Документы ── */}
            {data.manuals.length > 0 && (
              <Section title="Документы">
                <div className="flex flex-wrap gap-[8px]">
                  {data.manuals.map((url) => (
                    <a
                      className="inline-flex items-center gap-[6px] rounded-[8px] border border-[#d8e3e1] bg-background px-[10px] py-[6px] text-[12.5px] font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                      href={url}
                      key={url}
                      rel="noopener"
                      target="_blank"
                    >
                      <span aria-hidden>📄</span>
                      Брошюра производителя{" "}
                      <span className="font-normal text-muted-foreground">(PDF)</span>
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </main>

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
        }}
      />
    </TemplateShell>
  );
}
