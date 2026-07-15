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

export function ScientificWorkTemplate({ data }: { data: ScientificWorkDetail }) {
  const authorName = doctorFullName(data.doctor);
  const badges = [data.type, data.year ? String(data.year) : null, data.speciality].filter(
    Boolean,
  ) as string[];
  const supervisor = data.supervisor ? parseSupervisor(data.supervisor) : null;
  const org = data.organization ? parseOrganization(data.organization) : null;
  const summaryParagraphs = data.summary ? splitIntoParagraphs(data.summary) : [];
  const clinics = data.doctor.clinics.map((r) => r.clinic);

  return (
    <TemplateShell
      badges={badges}
      breadcrumbs={[{ href: "/publications", label: "Научные работы" }, { label: data.title }]}
      // Описание не дублируем в шапке — полный текст ниже, в блоке «Аннотация»
      description={[authorName, data.organization].filter(Boolean).join(" · ")}
      eyebrow="Научная деятельность"
      title={data.title}
    >
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          {/* ── Информационный блок ── */}
          <Section title="О работе">
            <div className="grid gap-[16px] sm:grid-cols-2">
              <InfoField label="Автор">
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
                <p className="font-semibold">«{data.title}»</p>
              </InfoField>

              {org && (
                <InfoField label="Место защиты">
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
                <InfoField label="Специальность ВАК">
                  <p>{data.speciality}</p>
                </InfoField>
              )}

              {data.publicationCount != null && data.publicationCount > 0 && (
                <InfoField label="Публикации по теме">
                  <p className="font-semibold">{data.publicationCount} публикаций</p>
                </InfoField>
              )}
            </div>
          </Section>

          {/* ── Аннотация ── */}
          {summaryParagraphs.length > 0 && (
            <div className="rounded-[11px] border-l-[3px] border-primary bg-primary/[0.04] p-[16px_18px]">
              <h2 className="mb-[10px] text-[12px] font-bold uppercase tracking-[0.06em] text-primary">
                Аннотация
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

          {/* ── Научная новизна ── */}
          {data.novelty.length > 0 && (
            <Section title="Научная новизна">
              <div className="space-y-[8px]">
                {data.novelty.map((n) => (
                  <NoveltyCard key={n} text={n} />
                ))}
              </div>
            </Section>
          )}

          {/* ── Практическая значимость ── */}
          {data.practicalValue.length > 0 && (
            <Section title="Практическая значимость">
              <div className="space-y-[8px]">
                {data.practicalValue.map((p) => (
                  <PracticalCard key={p} text={p} />
                ))}
              </div>
            </Section>
          )}

          {/* ── Основные результаты ── */}
          {data.results.length > 0 && (
            <Section title="Основные результаты">
              <div className="grid gap-[10px] sm:grid-cols-2">
                {data.results.map((r) => (
                  <ResultCard key={r} text={r} />
                ))}
              </div>
            </Section>
          )}

          {/* ── Документы ── */}
          {(data.abstractUrl || data.pdfUrl) && (
            <Section title="Документы исследования">
              <div className="grid gap-[10px] sm:grid-cols-2">
                {data.abstractUrl && (
                  <DocCard
                    description="PDF · Краткое изложение диссертации"
                    href={data.abstractUrl}
                    title="Автореферат"
                  />
                )}
                {data.pdfUrl && (
                  <DocCard
                    description="PDF · Полный текст научной работы"
                    href={data.pdfUrl}
                    title="Диссертация"
                  />
                )}
              </div>
            </Section>
          )}
        </main>

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
          "@type": "ScholarlyArticle",
          headline: data.title,
          url: absoluteUrl(`/publications/${data.slug}`),
          author: {
            "@type": "Person",
            name: authorName,
            url: absoluteUrl(`/doctors/${data.doctor.slug}`),
          },
          ...(data.summary ? { abstract: data.summary } : {}),
          ...(data.year != null ? { datePublished: String(data.year) } : {}),
          ...(data.organization
            ? { publisher: { "@type": "Organization", name: data.organization } }
            : {}),
        }}
      />
    </TemplateShell>
  );
}
