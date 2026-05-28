import Link from "next/link";
import { EntityBlock } from "@/components/entity/entity-block";
import { RelatedBlock } from "@/components/entity/related-block";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { PublicationDetail } from "@/lib/loaders";
import { doctorFullName } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function PublicationTemplate({ data }: { data: PublicationDetail }) {
  const authorName = data.doctor ? doctorFullName(data.doctor) : data.authorName;
  const year = data.publishedAt ? new Date(data.publishedAt).getFullYear() : null;

  const badges = [
    data.publicationType,
    year ? String(year) : null,
  ].filter(Boolean) as string[];

  const diseases = data.diseases.map((r) => ({
    href: `/diseases/${r.disease.slug}`,
    title: r.disease.title,
  }));
  const procedures = data.procedures.map((r) => ({
    href: `/procedures/${r.procedure.slug}`,
    title: r.procedure.title,
  }));

  return (
    <TemplateShell
      badges={badges}
      breadcrumbs={[{ href: "/publications", label: "Публикации" }, { label: data.title }]}
      description={data.abstract?.slice(0, 200) ?? ""}
      eyebrow={data.publicationType ?? "Научная публикация"}
      title={data.title}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {data.abstract && (
            <EntityBlock title="Аннотация">{data.abstract}</EntityBlock>
          )}
          {data.content && (
            <EntityBlock title="Полный текст">{data.content}</EntityBlock>
          )}
          {data.doctor && (
            <EntityBlock title="Автор">
              <Link className="text-primary hover:underline" href={`/doctors/${data.doctor.slug}`}>
                {doctorFullName(data.doctor)}
              </Link>
            </EntityBlock>
          )}
          {!data.doctor && authorName && (
            <EntityBlock title="Автор">{authorName}</EntityBlock>
          )}
        </div>
        <div className="space-y-5">
          <RelatedBlock
            empty="Связанные заболевания будут добавлены при наполнении."
            items={diseases}
            title="Заболевания"
          />
          <RelatedBlock
            empty="Связанные процедуры будут добавлены при наполнении."
            items={procedures}
            title="Процедуры"
          />
        </div>
      </div>
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/publications", label: "Публикации" },
          { href: `/publications/${data.slug}`, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "ScholarlyArticle",
          headline: data.title,
          url: absoluteUrl(`/publications/${data.slug}`),
          ...(authorName ? { author: { "@type": "Person", name: authorName } } : {}),
        }}
      />
    </TemplateShell>
  );
}
