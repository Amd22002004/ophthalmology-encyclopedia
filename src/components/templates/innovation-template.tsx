import Image from "next/image";
import type { ReactNode } from "react";
import { EntityBlock } from "@/components/entity/entity-block";
import { DiseaseFaq } from "@/components/disease/disease-faq";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SchemaOrg } from "@/components/seo/schema-org";
import { GenericEntityTemplate } from "@/components/templates/generic-entity-template";
import type { InnovationContent } from "@/lib/innovation-content";
import { getInnovationContent } from "@/lib/innovation-content";
import type { InnovationDetail } from "@/lib/loaders";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  innovationWebPageJsonLd,
  medicalDeviceJsonLd,
} from "@/lib/seo";

type InnovationSectionProps = {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
  children?: ReactNode;
};

function InnovationSection({
  id,
  title,
  paragraphs = [],
  items = [],
  children,
}: InnovationSectionProps) {
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

function InnovationSources({ sources }: { sources: InnovationContent["sources"] }) {
  const labels: Record<string, string> = {
    definition: "определение",
    technology: "технология",
    candidateSelection: "подбор пациентов",
    features: "особенности",
    limitations: "ограничения",
    comparison: "сравнение",
    faq: "FAQ",
  };

  return (
    <section className="space-y-4 rounded-lg border bg-card p-5" aria-labelledby="sources-title">
      <div>
        <h2 id="sources-title" className="text-2xl font-semibold tracking-tight">
          Источники
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Источники сохранены в редакционной структуре страницы с датой обращения и указанием разделов, для которых они использованы.
        </p>
      </div>
      <ol className="space-y-3">
        {sources.map((source) => (
          <li key={source.url} className="rounded-md border p-3">
            <a
              className="font-medium text-primary hover:underline"
              href={source.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {source.name}
            </a>
            <div className="mt-1 text-xs leading-5 text-muted-foreground">
              Обращение: {source.accessedAt}. Разделы: {source.sections.map((section) => labels[section]).join(", ")}.
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function InnovationHero({ editorial }: { editorial: InnovationContent }) {
  const hero = editorial.images.find((image) => image.key === "hero");

  return (
    <header className="overflow-hidden rounded-lg border bg-card">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
        <div className="flex flex-col justify-center p-5 sm:p-7">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">
            {editorial.eyebrow}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {editorial.title}
          </h1>
          <p className="mt-2 text-base font-medium text-foreground">{editorial.subtitle}</p>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            {editorial.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-md border px-2.5 py-1">{editorial.type}</span>
            <span className="rounded-md border px-2.5 py-1">Производитель: {editorial.manufacturer}</span>
          </div>
        </div>
        {hero ? (
          <figure className="relative min-h-[240px] border-t bg-muted/30 lg:min-h-0 lg:border-l lg:border-t-0">
            <Image
              src={hero.src}
              alt={hero.alt}
              width={hero.width}
              height={hero.height}
              sizes="(max-width: 1024px) 100vw, 420px"
              className="h-full w-full object-cover"
              priority
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-background/85 px-3 py-2 text-xs text-muted-foreground">
              {hero.caption} Иллюстрация редакции; не заменяет диагностику.
            </figcaption>
          </figure>
        ) : null}
      </div>
    </header>
  );
}

function InnovationDistances({ editorial }: { editorial: InnovationContent }) {
  const image = editorial.images.find((item) => item.key === "distances");
  return (
    <div className="space-y-4">
      {image ? (
        <figure className="overflow-hidden rounded-md border bg-muted/20">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 1280px) 100vw, 760px"
            loading="eager"
            className="h-auto w-full"
          />
          <figcaption className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground">
            {image.caption} Иллюстрация объясняет принцип, а не индивидуальный результат.
          </figcaption>
        </figure>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {editorial.focalDistances.map((distance) => (
          <div key={distance.title} className="rounded-md border p-3">
            <h3 className="font-medium text-foreground">{distance.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{distance.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InnovationTechnology({ editorial }: { editorial: InnovationContent }) {
  const image = editorial.images.find((item) => item.key === "enlightenNxt");
  return (
    <InnovationSection id="technology" title="ENLIGHTEN NXT: оптическая технология PanOptix Pro">
      <div className="space-y-4">
        {editorial.technology.map((block) => (
          <div key={block.title} className="space-y-2">
            <h3 className="font-medium text-foreground">{block.title}</h3>
            {block.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
        {image ? (
          <figure className="overflow-hidden rounded-md border bg-muted/20">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 1280px) 100vw, 760px"
              loading="eager"
              className="h-auto w-full"
            />
            <figcaption className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground">
              {image.caption} Это редакционная схема, а не копия фирменной инфографики.
            </figcaption>
          </figure>
        ) : null}
      </div>
    </InnovationSection>
  );
}

function InnovationComparison({ rows }: { rows: InnovationContent["comparison"] }) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-5" aria-labelledby="comparison-title">
      <div>
        <h2 id="comparison-title" className="text-2xl font-semibold tracking-tight">
          PanOptix и PanOptix Pro: оптическое сравнение
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Значения приведены по данным производителя и относятся к оптическим, лабораторным и симуляторным исследованиям; они не являются индивидуальным прогнозом результата операции.
        </p>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-[640px] w-full text-left text-sm">
          <caption className="sr-only">Сравнение использования световой энергии и светорассеяния</caption>
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th scope="col" className="px-3 py-3 font-semibold">Параметр</th>
              <th scope="col" className="px-3 py-3 font-semibold">PanOptix</th>
              <th scope="col" className="px-3 py-3 font-semibold">PanOptix Pro</th>
              <th scope="col" className="px-3 py-3 font-semibold">Контекст</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.metric}>
                <th scope="row" className="px-3 py-3 font-medium text-foreground">{row.metric}</th>
                <td className="px-3 py-3 text-muted-foreground">{row.previous}</td>
                <td className="px-3 py-3 text-muted-foreground">{row.pro}</td>
                <td className="px-3 py-3 text-muted-foreground">{row.context}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InnovationSidebar({ editorial }: { editorial: InnovationContent }) {
  return (
    <aside className="space-y-5" aria-label="Контекст инновации">
      <EntityBlock title="Производитель">
        <p className="font-medium text-foreground">{editorial.manufacturer}</p>
        <p className="mt-2 text-sm leading-6">
          Производитель указан в официальных источниках страницы. Прямой сущности производителя или связи Innovation с Supplier в текущей схеме нет, поэтому ссылка на отдельную карточку не создаётся.
        </p>
      </EntityBlock>
      <EntityBlock title="Граница графа знаний">
        <p>
          В текущей модели Innovation нет прямых связей с заболеваниями, процедурами, клиниками, врачами и публикациями. Эти блоки не добавляются автоматически и появятся только после отдельного подтверждённого отношения в БД.
        </p>
      </EntityBlock>
    </aside>
  );
}

function InnovationRichTemplate({
  data,
  editorial,
}: {
  data: InnovationDetail;
  editorial: InnovationContent;
}) {
  const path = `/innovations/${data.slug}`;

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ href: "/innovations", label: "Инновации" }, { label: editorial.title }]} />
      <InnovationHero editorial={editorial} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="min-w-0 space-y-5">
          <InnovationSection id="definition" title="Что такое Clareon PanOptix Pro" paragraphs={editorial.definition}>
            <InnovationDistances editorial={editorial} />
          </InnovationSection>
          <InnovationTechnology editorial={editorial} />
          <InnovationSection id="candidate-selection" title="Кому может рассматриваться такая ИОЛ" items={editorial.candidateSelection} />
          <InnovationSection id="features" title="Особенности PanOptix Pro">
            <div className="grid gap-3 sm:grid-cols-2">
              {editorial.features.map((feature) => (
                <div key={feature.title} className="rounded-md border p-3">
                  <h3 className="font-medium text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </InnovationSection>
          <InnovationComparison rows={editorial.comparison} />
          <InnovationSection id="limitations" title="Что важно учитывать" items={editorial.limitations}>
            <div className="border-t pt-3">
              <h3 className="font-medium text-foreground">Индивидуальный подбор</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
                {editorial.decisionMaking.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </InnovationSection>
          <DiseaseFaq items={editorial.faq} />
          <InnovationSources sources={editorial.sources} />
        </article>
        <InnovationSidebar editorial={editorial} />
      </div>

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/innovations", label: "Инновации" },
          { href: path, label: editorial.title },
        ])}
      />
      <SchemaOrg
        data={medicalDeviceJsonLd({
          title: editorial.title,
          description: editorial.summary,
          path,
          image: editorial.images[0]?.src,
          manufacturer: editorial.manufacturer,
        })}
      />
      <SchemaOrg
        data={innovationWebPageJsonLd({
          title: editorial.seo.title,
          description: editorial.seo.description,
          path,
          image: editorial.images[0]?.src,
        })}
      />
      {editorial.faq.length > 0 ? <SchemaOrg data={faqPageJsonLd(editorial.faq)} /> : null}
    </div>
  );
}

export function InnovationTemplate({ data }: { data: InnovationDetail }) {
  const editorial = getInnovationContent(data.slug);
  return editorial ? (
    <InnovationRichTemplate data={data} editorial={editorial} />
  ) : (
    <GenericEntityTemplate kind="innovations" data={data} />
  );
}
