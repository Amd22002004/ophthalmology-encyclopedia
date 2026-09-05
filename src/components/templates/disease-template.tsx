import Image from "next/image";
import Link from "next/link";
import { EntityBlock } from "@/components/entity/entity-block";
import { RelatedBlock } from "@/components/entity/related-block";
import { DiseaseFaq } from "@/components/disease/disease-faq";
import { DiseaseSourceList } from "@/components/disease/disease-source-list";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { DiseaseContent } from "@/lib/disease-content";
import type { DiseaseDetail } from "@/lib/loaders";
import { doctorFullName } from "@/lib/loaders";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  diseaseConditionJsonLd,
  diseaseWebPageJsonLd,
  faqPageJsonLd,
} from "@/lib/seo";

type DiseaseSectionProps = {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
  children?: React.ReactNode;
};

function DiseaseSection({ id, title, paragraphs = [], items = [], children }: DiseaseSectionProps) {
  if (paragraphs.length === 0 && items.length === 0 && !children) return null;

  return (
    <section className="space-y-3 rounded-lg border bg-card p-5" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
          {paragraph}
        </p>
      ))}
      {items.length > 0 ? (
        <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {children}
    </section>
  );
}

function DiseaseGraphSidebar({ data }: { data: DiseaseDetail }) {
  const doctors = data.doctors.map((r) => ({
    href: `/doctors/${r.doctor.slug}`,
    title: doctorFullName(r.doctor),
  }));
  const clinics = data.clinics.map((r) => ({
    href: `/clinics/${r.clinic.slug}`,
    title: r.clinic.title,
    meta: r.clinic.city ?? undefined,
  }));
  const scientificWorkAuthors = Array.from(
    new Map(
      data.scientificWorks
        .map((r) => r.work.doctor)
        .filter((doctor) => doctor.slug)
        .map((doctor) => [doctor.slug, doctor] as const),
    ).values(),
  ).map((doctor) => ({
    href: `/doctors/${doctor.slug}`,
    title: doctorFullName(doctor),
    meta: "Автор связанной научной работы",
  }));
  const guidelines = data.guidelines.map((r) => ({
    href: `/guidelines/${r.guideline.slug}`,
    title: r.guideline.title,
  }));
  const publications = data.publications.map((r) => ({
    href: `/publications/${r.publication.slug}`,
    title: r.publication.title,
  }));
  const procedures = data.procedures.map((r) => ({
    href: `/procedures/${r.procedure.slug}`,
    title: r.procedure.title,
  }));
  const equipment = data.equipment.map((r) => ({
    href: `/equipment/${r.equipment.slug}`,
    title: r.equipment.title,
    meta: r.equipment.manufacturer ?? undefined,
  }));
  const investigations = data.investigations.map((r) => ({
    href: `/investigations/${r.investigation.slug}`,
    title: r.investigation.title,
    meta: r.investigation.status,
  }));
  const scientificWorks = data.scientificWorks
    .filter((r) => r.work.slug)
    .map((r) => ({
      href: `/publications/${r.work.slug}`,
      title: r.work.title,
      meta: [r.work.type, doctorFullName(r.work.doctor), r.work.year].filter(Boolean).join(" · "),
    }));

  return (
    <aside className="space-y-5" aria-label="Связи заболевания">
      {doctors.length > 0 && <RelatedBlock empty="" items={doctors} title="Врачи" />}
      {clinics.length > 0 && (
        <RelatedBlock empty="" items={clinics} title="Клиники, связанные напрямую" />
      )}
      {scientificWorkAuthors.length > 0 && (
        <RelatedBlock empty="" items={scientificWorkAuthors} title="Авторы научных работ" />
      )}
      {guidelines.length > 0 && (
        <RelatedBlock empty="" items={guidelines} title="Клинические рекомендации" />
      )}
      {publications.length > 0 && (
        <RelatedBlock empty="" items={publications} title="Публикации" />
      )}
      {procedures.length > 0 && <RelatedBlock empty="" items={procedures} title="Процедуры" />}
      {scientificWorks.length > 0 && (
        <RelatedBlock empty="" items={scientificWorks} title="Научные работы" />
      )}
      {equipment.length > 0 && <RelatedBlock empty="" items={equipment} title="Оборудование" />}
      {investigations.length > 0 && (
        <RelatedBlock empty="" items={investigations} title="Расследования Ассоциации" />
      )}
    </aside>
  );
}

function DiseaseRichTemplate({ data, editorial }: { data: DiseaseDetail; editorial: DiseaseContent }) {
  const path = `/diseases/${data.slug}`;
  const badges = [data.icdCode ? `МКБ: ${data.icdCode}` : null].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ href: "/diseases", label: "Заболевания" }, { label: editorial.title }]} />

      <header className="overflow-hidden rounded-lg border bg-card">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
          <div className="flex flex-col justify-center p-5 sm:p-7">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              {data.category?.title ?? "Заболевание органа зрения"}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {editorial.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
              {editorial.summary}
            </p>
            {badges.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                {badges.map((badge) => (
                  <span key={badge} className="rounded-md border px-2.5 py-1">
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <figure className="relative min-h-[240px] border-t bg-muted/30 lg:min-h-0 lg:border-l lg:border-t-0">
            <Image
              src={editorial.image.src}
              alt={editorial.image.alt}
              width={editorial.image.width}
              height={editorial.image.height}
              sizes="(max-width: 1024px) 100vw, 420px"
              className="h-full w-full object-cover"
              preload
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-background/85 px-3 py-2 text-xs text-muted-foreground">
              Схематичная иллюстрация; не заменяет диагностику.
            </figcaption>
          </figure>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="min-w-0 space-y-5">
          <DiseaseSection id="definition" title="Определение" paragraphs={editorial.definition} />
          <DiseaseSection id="causes" title="Причины" items={editorial.causes} />
          <DiseaseSection id="risk-factors" title="Факторы риска" items={editorial.riskFactors} />
          <DiseaseSection id="symptoms" title="Симптомы" items={editorial.symptoms} />
          <DiseaseSection id="types" title="Формы" items={editorial.types} />
          <DiseaseSection id="diagnosis" title="Диагностика" paragraphs={editorial.diagnosis}>
            {editorial.diagnosticMethods.length > 0 ? (
              <div className="space-y-3">
                {editorial.diagnosticMethods.map((method) => (
                  <div key={method.label} className="rounded-md border p-3">
                    <h3 className="font-medium text-foreground">{method.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{method.description}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </DiseaseSection>
          <DiseaseSection id="treatment" title="Лечение" items={editorial.treatment}>
            {editorial.treatmentGroups.length > 0 ? (
              <div className="space-y-4">
                {editorial.treatmentGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="font-medium text-foreground">{group.title}</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-muted-foreground">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </DiseaseSection>
          <DiseaseSection id="prognosis" title="Наблюдение и прогноз" items={editorial.prognosis} />
          <DiseaseSection id="prevention" title="Профилактика" items={editorial.prevention} />
          <DiseaseSection
            id="when-to-see-doctor"
            title="Когда обращаться к врачу"
            items={editorial.whenToSeeDoctor}
          />

          <DiseaseFaq items={editorial.faq} />

          {data.relatedDiseases.length > 0 ? (
            <section className="space-y-4" aria-labelledby="related-diseases-title">
              <h2 id="related-diseases-title" className="text-2xl font-semibold tracking-tight">
                Связанные заболевания
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.relatedDiseases.map((relatedDisease) => (
                  <Link
                    key={relatedDisease.slug}
                    href={`/diseases/${relatedDisease.slug}`}
                    className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <span className="font-medium">{relatedDisease.title}</span>
                    {relatedDisease.summary ? (
                      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                        {relatedDisease.summary}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <DiseaseSourceList sources={editorial.sources} />
        </article>
        <DiseaseGraphSidebar data={data} />
      </div>

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/diseases", label: "Заболевания" },
          { href: path, label: editorial.title },
        ])}
      />
      <SchemaOrg
        data={diseaseConditionJsonLd({
          title: editorial.title,
          description: editorial.summary,
          aliases: editorial.aliases,
          category: data.category?.title,
          path,
          icdCode: data.icdCode,
        })}
      />
      <SchemaOrg
        data={diseaseWebPageJsonLd({
          title: editorial.seo.title,
          description: editorial.seo.description,
          path,
          image: editorial.image.src,
        })}
      />
      {editorial.faq.length > 0 ? <SchemaOrg data={faqPageJsonLd(editorial.faq)} /> : null}
    </div>
  );
}

function DiseaseFallbackTemplate({ data }: { data: DiseaseDetail }) {
  const badges = [data.category?.title, data.icdCode ? `МКБ: ${data.icdCode}` : null].filter(Boolean) as string[];

  const doctors = data.doctors.map((r) => ({
    href: `/doctors/${r.doctor.slug}`,
    title: doctorFullName(r.doctor),
  }));
  const scientificWorkAuthors = Array.from(
    new Map(
      data.scientificWorks
        .map((r) => r.work.doctor)
        .filter((doctor) => doctor.slug)
        .map((doctor) => [doctor.slug, doctor] as const),
    ).values(),
  ).map((doctor) => ({
    href: `/doctors/${doctor.slug}`,
    title: doctorFullName(doctor),
    meta: "Автор связанной научной работы",
  }));
  const guidelines = data.guidelines.map((r) => ({
    href: `/guidelines/${r.guideline.slug}`,
    title: r.guideline.title,
  }));
  const publications = data.publications.map((r) => ({
    href: `/publications/${r.publication.slug}`,
    title: r.publication.title,
  }));
  const procedures = data.procedures.map((r) => ({
    href: `/procedures/${r.procedure.slug}`,
    title: r.procedure.title,
  }));
  const equipment = data.equipment.map((r) => ({
    href: `/equipment/${r.equipment.slug}`,
    title: r.equipment.title,
    meta: r.equipment.manufacturer ?? undefined,
  }));
  const investigations = data.investigations.map((r) => ({
    href: `/investigations/${r.investigation.slug}`,
    title: r.investigation.title,
    meta: r.investigation.status,
  }));
  const scientificWorks = data.scientificWorks
    .filter((r) => r.work.slug)
    .map((r) => ({
      href: `/publications/${r.work.slug}`,
      title: r.work.title,
      meta: [r.work.type, doctorFullName(r.work.doctor), r.work.year].filter(Boolean).join(" · "),
    }));

  return (
    <TemplateShell
      badges={badges}
      breadcrumbs={[{ href: "/diseases", label: "Заболевания" }, { label: data.title }]}
      description={data.summary ?? ""}
      eyebrow={data.category?.title ?? "Заболевание органа зрения"}
      title={data.title}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {data.description && <EntityBlock title="Описание">{data.description}</EntityBlock>}
          {data.symptoms.length > 0 && (
            <EntityBlock title="Симптомы">
              <ul className="list-disc space-y-1 pl-4">
                {data.symptoms.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </EntityBlock>
          )}
          {data.diagnostics && <EntityBlock title="Диагностика">{data.diagnostics}</EntityBlock>}
          {data.treatment && <EntityBlock title="Лечение и коррекция">{data.treatment}</EntityBlock>}
        </div>
        <div className="space-y-5">
          {doctors.length > 0 && <RelatedBlock empty="" items={doctors} title="Врачи" />}
          {scientificWorkAuthors.length > 0 && (
            <RelatedBlock empty="" items={scientificWorkAuthors} title="Авторы научных работ" />
          )}
          {guidelines.length > 0 && (
            <RelatedBlock empty="" items={guidelines} title="Клинические рекомендации" />
          )}
          {publications.length > 0 && <RelatedBlock empty="" items={publications} title="Публикации" />}
          {procedures.length > 0 && <RelatedBlock empty="" items={procedures} title="Процедуры" />}
          {scientificWorks.length > 0 && (
            <RelatedBlock empty="" items={scientificWorks} title="Научные работы" />
          )}
          {equipment.length > 0 && <RelatedBlock empty="" items={equipment} title="Оборудование" />}
          {investigations.length > 0 && (
            <RelatedBlock empty="" items={investigations} title="Расследования Ассоциации" />
          )}
        </div>
      </div>
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/diseases", label: "Заболевания" },
          { href: `/diseases/${data.slug}`, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalCondition",
          name: data.title,
          url: absoluteUrl(`/diseases/${data.slug}`),
          ...(data.icdCode
            ? { code: { "@type": "MedicalCode", codeValue: data.icdCode, codingSystem: "ICD-10" } }
            : {}),
        }}
      />
    </TemplateShell>
  );
}

export function DiseaseTemplate({ data }: { data: DiseaseDetail }) {
  return data.editorial ? (
    <DiseaseRichTemplate data={data} editorial={data.editorial} />
  ) : (
    <DiseaseFallbackTemplate data={data} />
  );
}
