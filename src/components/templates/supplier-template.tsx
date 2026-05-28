import { EntityBlock } from "@/components/entity/entity-block";
import { RelatedBlock } from "@/components/entity/related-block";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { SupplierDetail } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function SupplierTemplate({ data }: { data: SupplierDetail }) {
  const categoryTitles = data.categories.map((r) => r.category.title);
  const equipment = data.equipment.map((r) => ({
    href: `/equipment/${r.slug}`,
    title: r.title,
    meta: r.summary?.slice(0, 60),
  }));

  return (
    <TemplateShell
      badges={categoryTitles.slice(0, 3)}
      breadcrumbs={[{ href: "/suppliers", label: "Поставщики" }, { label: data.title }]}
      description={data.description ?? ""}
      eyebrow="Поставщик"
      title={data.title}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {data.description && (
            <EntityBlock title="Описание">{data.description}</EntityBlock>
          )}
          {(data.phone || data.email || data.website) && (
            <EntityBlock title="Контакты">
              <div className="space-y-1">
                {data.phone && <div>Тел.: {data.phone}</div>}
                {data.email && <div>Email: {data.email}</div>}
                {data.website && (
                  <a
                    className="text-primary hover:underline"
                    href={data.website}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {data.website}
                  </a>
                )}
              </div>
            </EntityBlock>
          )}
        </div>
        <div className="space-y-5">
          <RelatedBlock
            empty="Оборудование этого поставщика пока не опубликовано."
            items={equipment}
            title="Оборудование"
          />
        </div>
      </div>
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/suppliers", label: "Поставщики" },
          { href: `/suppliers/${data.slug}`, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: data.title,
          url: absoluteUrl(`/suppliers/${data.slug}`),
        }}
      />
    </TemplateShell>
  );
}
