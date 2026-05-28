import { EntityBlock } from "@/components/entity/entity-block";
import { RelatedBlock } from "@/components/entity/related-block";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { EntityKind } from "@/lib/content-model";
import { catalogConfigs } from "@/lib/content-model";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export type GenericEntityData = {
  slug: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  sourceUrl?: string | null;
  publishedAt?: Date | null;
  period?: string | null;
  documentType?: string | null;
  effectiveFrom?: Date | null;
  diseases?: { disease: { slug: string; title: string } }[];
};

export function GenericEntityTemplate({
  kind,
  data,
}: {
  kind: EntityKind;
  data: GenericEntityData;
}) {
  const config = catalogConfigs[kind];

  const metaBadges: string[] = [];
  if (data.documentType) metaBadges.push(data.documentType);
  if (data.period) metaBadges.push(data.period);
  if (data.publishedAt) metaBadges.push(String(new Date(data.publishedAt).getFullYear()));
  if (data.effectiveFrom) metaBadges.push(`с ${new Date(data.effectiveFrom).toLocaleDateString("ru-RU")}`);

  const relatedDiseases = (data.diseases ?? []).map((r) => ({
    href: `/diseases/${r.disease.slug}`,
    title: r.disease.title,
  }));

  return (
    <TemplateShell
      badges={metaBadges}
      breadcrumbs={[{ href: config.path, label: config.title }, { label: data.title }]}
      description={data.summary ?? ""}
      eyebrow={config.singular}
      title={data.title}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {data.summary && (
            <EntityBlock title="Аннотация">{data.summary}</EntityBlock>
          )}
          {data.content && (
            <EntityBlock title="Содержание">{data.content}</EntityBlock>
          )}
          {data.sourceUrl && (
            <EntityBlock title="Источник">
              <a
                className="text-primary hover:underline"
                href={data.sourceUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {data.sourceUrl}
              </a>
            </EntityBlock>
          )}
        </div>
        <div className="space-y-5">
          {kind === "guidelines" && (
            <RelatedBlock
              empty="Заболевания, к которым применяется данная рекомендация, пока не связаны."
              items={relatedDiseases}
              title="Заболевания"
            />
          )}
        </div>
      </div>
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: config.path, label: config.title },
          { href: `${config.path}/${data.slug}`, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": config.schemaType,
          name: data.title,
          url: absoluteUrl(`${config.path}/${data.slug}`),
        }}
      />
    </TemplateShell>
  );
}
