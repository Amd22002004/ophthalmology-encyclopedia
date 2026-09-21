import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { EntityBlock } from "@/components/entity/entity-block";
import { RelatedBlock } from "@/components/entity/related-block";
import { DiseaseFaq } from "@/components/disease/disease-faq";
import { ProcedureSourceList } from "@/components/procedure/procedure-source-list";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import { getProcedureContent, type ProcedureContent } from "@/lib/procedure-content";
import type { ProcedureDetail } from "@/lib/loaders";
import { doctorFullName } from "@/lib/loaders";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  faqPageJsonLd,
  medicalProcedureJsonLd,
  procedureWebPageJsonLd,
} from "@/lib/seo";

type ProcedureSectionProps = {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
  children?: ReactNode;
};

function ProcedureSection({ id, title, paragraphs = [], items = [], children }: ProcedureSectionProps) {
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

const comparisonMethods = [
  {
    slug: "smile-pro",
    title: "SMILE Pro",
    principle: "Извлечение лентикулы",
    flap: "Нет классического flap",
    laser: "Фемтосекундный",
  },
  {
    slug: "femto-lasik",
    title: "FEMTO-LASIK",
    principle: "Flap и абляция стромы",
    flap: "Да",
    laser: "Фемтосекундный + эксимерный",
  },
  {
    slug: "lasik",
    title: "LASIK",
    principle: "Flap и абляция стромы",
    flap: "Да; зависит от технологии",
    laser: "Зависит от техники",
  },
] as const;

function ProcedureComparison() {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-5" aria-labelledby="comparison-title">
      <div>
        <h2 id="comparison-title" className="text-2xl font-semibold tracking-tight">
          Сравнение методов лазерной коррекции зрения
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Таблица описывает различия техники. Она не устанавливает превосходство одного метода над другим.
        </p>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-[680px] w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-semibold">Метод</th>
              <th className="px-3 py-3 font-semibold">Основной принцип</th>
              <th className="px-3 py-3 font-semibold">Flap</th>
              <th className="px-3 py-3 font-semibold">Основной лазерный этап</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {comparisonMethods.map((method) => (
              <tr key={method.slug}>
                <th className="px-3 py-3 font-medium text-foreground">
                  <Link href={`/procedures/${method.slug}`} className="text-primary hover:underline">
                    {method.title}
                  </Link>
                </th>
                <td className="px-3 py-3 text-muted-foreground">{method.principle}</td>
                <td className="px-3 py-3 text-muted-foreground">{method.flap}</td>
                <td className="px-3 py-3 text-muted-foreground">{method.laser}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProcedureGraphSidebar({ data }: { data: ProcedureDetail }) {
  const diseases = data.diseases.map((r) => ({
    href: `/diseases/${r.disease.slug}`,
    title: r.disease.title,
  }));
  const doctors = data.doctors.map((r) => ({
    href: `/doctors/${r.doctor.slug}`,
    title: doctorFullName(r.doctor),
  }));
  const clinics = data.clinics.map((r) => ({
    href: `/clinics/${r.clinic.slug}`,
    title: r.clinic.title,
    meta: r.clinic.city ?? undefined,
  }));
  const equipment = data.equipment.map((r) => ({
    href: `/equipment/${r.equipment.slug}`,
    title: r.equipment.title,
  }));
  const publications = data.publications.map((r) => ({
    href: `/publications/${r.publication.slug}`,
    title: r.publication.title,
    meta: [r.publication.publicationType, r.publication.authorName].filter(Boolean).join(" · "),
  }));
  const scientificWorks = data.scientificWorks
    .filter((r) => r.work.slug)
    .map((r) => ({
      href: `/publications/${r.work.slug}`,
      title: r.work.title,
      meta: [r.work.type, doctorFullName(r.work.doctor), r.work.year].filter(Boolean).join(" · "),
    }));
  const investigations = data.investigations.map((r) => ({
    href: `/investigations/${r.investigation.slug}`,
    title: r.investigation.title,
    meta: r.investigation.status,
  }));

  return (
    <aside className="space-y-5" aria-label="Связи процедуры">
      {diseases.length > 0 && <RelatedBlock empty="" items={diseases} title="Заболевания" />}
      {doctors.length > 0 && <RelatedBlock empty="" items={doctors} title="Врачи" />}
      {clinics.length > 0 && (
        <RelatedBlock empty="" items={clinics} title="Клиники, связанные напрямую" />
      )}
      {equipment.length > 0 && <RelatedBlock empty="" items={equipment} title="Оборудование" />}
      {publications.length > 0 && <RelatedBlock empty="" items={publications} title="Публикации" />}
      {scientificWorks.length > 0 && (
        <RelatedBlock empty="" items={scientificWorks} title="Научные работы" />
      )}
      {investigations.length > 0 && (
        <RelatedBlock empty="" items={investigations} title="Расследования Ассоциации" />
      )}
    </aside>
  );
}

function ProcedureDirectDiseaseLinks({ data }: { data: ProcedureDetail }) {
  if (data.diseases.length === 0) return null;

  return (
    <section className="rounded-lg border bg-card p-5" aria-labelledby="procedure-diseases-title">
      <h2 id="procedure-diseases-title" className="text-lg font-semibold">
        Применяется при
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.diseases.map((relation) => (
          <Link
            key={relation.disease.slug}
            href={`/diseases/${relation.disease.slug}`}
            className="rounded-md border px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
          >
            {relation.disease.title}
          </Link>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Показаны только заболевания, связанные с процедурой напрямую в графе энциклопедии.
      </p>
    </section>
  );
}

function ProcedureRichTemplate({ data, editorial }: { data: ProcedureDetail; editorial: ProcedureContent }) {
  const path = `/procedures/${data.slug}`;
  const badges = data.category?.title ? [data.category.title] : [];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ href: "/procedures", label: "Процедуры" }, { label: editorial.title }]} />

      <header className="overflow-hidden rounded-lg border bg-card">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
          <div className="flex flex-col justify-center p-5 sm:p-7">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              {data.category?.title ?? "Диагностика и лечение"}
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
              Схематичная иллюстрация принципа метода; не заменяет консультацию и диагностику.
            </figcaption>
          </figure>
        </div>
      </header>

      <ProcedureDirectDiseaseLinks data={data} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="min-w-0 space-y-5">
          <ProcedureSection id="definition" title="Что такое метод" paragraphs={editorial.definition} />
          <ProcedureSection id="principle" title="Принцип действия" paragraphs={editorial.principle} />
          <ProcedureSection id="steps" title="Этапы процедуры">
            <ol className="space-y-3">
              {editorial.steps.map((step, index) => (
                <li key={step.title} className="rounded-md border p-3">
                  <h3 className="font-medium text-foreground">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </ProcedureSection>
          <ProcedureSection id="applications" title="При каких нарушениях зрения применяется" items={editorial.applications} />
          <ProcedureSection id="features" title="Особенности метода" items={editorial.features} />
          <ProcedureSection id="limitations" title="Ограничения и противопоказания" items={editorial.limitations} />
          <ProcedureSection id="preparation" title="Подготовка" items={editorial.preparation} />
          <ProcedureSection id="recovery" title="Восстановление" items={editorial.recovery} />
          <ProcedureSection id="risks" title="Возможные риски и осложнения" items={editorial.risks} />
          {editorial.showComparison ? <ProcedureComparison /> : null}
          <DiseaseFaq items={editorial.faq} />
          <ProcedureSourceList sources={editorial.sources} />
        </article>
        <ProcedureGraphSidebar data={data} />
      </div>

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/procedures", label: "Процедуры" },
          { href: path, label: editorial.title },
        ])}
      />
      <SchemaOrg
        data={medicalProcedureJsonLd({
          title: editorial.title,
          description: editorial.summary,
          path,
          image: editorial.image.src,
        })}
      />
      <SchemaOrg
        data={procedureWebPageJsonLd({
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

function ProcedureFallbackTemplate({ data }: { data: ProcedureDetail }) {
  const badges = data.category?.title ? [data.category.title] : [];
  const diseases = data.diseases.map((r) => ({
    href: `/diseases/${r.disease.slug}`,
    title: r.disease.title,
  }));
  const doctors = data.doctors.map((r) => ({
    href: `/doctors/${r.doctor.slug}`,
    title: doctorFullName(r.doctor),
  }));
  const equipment = data.equipment.map((r) => ({
    href: `/equipment/${r.equipment.slug}`,
    title: r.equipment.title,
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
      breadcrumbs={[{ href: "/procedures", label: "Процедуры" }, { label: data.title }]}
      description={data.summary ?? ""}
      eyebrow={data.category?.title ?? "Диагностика и лечение"}
      title={data.title}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {data.description && <EntityBlock title="Описание">{data.description}</EntityBlock>}
        </div>
        <div className="space-y-5">
          <RelatedBlock
            empty="Заболевания, при которых применяется процедура, пока не добавлены."
            items={diseases}
            title="Заболевания"
          />
          <RelatedBlock
            empty="Врачи, выполняющие данную процедуру, пока не добавлены."
            items={doctors}
            title="Врачи"
          />
          {scientificWorks.length > 0 && (
            <RelatedBlock empty="" items={scientificWorks} title="Научные работы" />
          )}
          <RelatedBlock
            empty="Используемое оборудование будет связано при наполнении раздела."
            items={equipment}
            title="Оборудование"
          />
          {investigations.length > 0 && (
            <RelatedBlock empty="" items={investigations} title="Расследования Ассоциации" />
          )}
        </div>
      </div>
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/procedures", label: "Процедуры" },
          { href: `/procedures/${data.slug}`, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalProcedure",
          name: data.title,
          url: absoluteUrl(`/procedures/${data.slug}`),
        }}
      />
    </TemplateShell>
  );
}

export function ProcedureTemplate({ data }: { data: ProcedureDetail }) {
  const editorial = getProcedureContent(data.slug);
  return editorial ? (
    <ProcedureRichTemplate data={data} editorial={editorial} />
  ) : (
    <ProcedureFallbackTemplate data={data} />
  );
}
