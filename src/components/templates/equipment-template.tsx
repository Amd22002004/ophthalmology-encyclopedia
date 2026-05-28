import Link from "next/link";
import { EntityBlock } from "@/components/entity/entity-block";
import { RelatedBlock } from "@/components/entity/related-block";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { EquipmentDetail } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function EquipmentTemplate({ data }: { data: EquipmentDetail }) {
  const badges = [
    data.category?.title,
    data.supplier?.title,
  ].filter(Boolean) as string[];

  const procedures = data.procedures.map((r) => ({
    href: `/procedures/${r.procedure.slug}`,
    title: r.procedure.title,
  }));

  return (
    <TemplateShell
      badges={badges}
      breadcrumbs={[{ href: "/equipment", label: "Оборудование" }, { label: data.title }]}
      description={data.summary ?? ""}
      eyebrow={data.category?.title ?? "Оборудование"}
      title={data.title}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {data.description && (
            <EntityBlock title="Описание">{data.description}</EntityBlock>
          )}
          {data.supplier && (
            <EntityBlock title="Поставщик">
              <Link className="text-primary hover:underline" href={`/suppliers/${data.supplier.slug}`}>
                {data.supplier.title}
              </Link>
            </EntityBlock>
          )}
          {data.manuals.length > 0 && (
            <EntityBlock title="Документы и инструкции">
              <div className="space-y-1">
                {data.manuals.map((url) => (
                  <a
                    className="block text-primary hover:underline"
                    href={url}
                    key={url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {url.split("/").pop() ?? url}
                  </a>
                ))}
              </div>
            </EntityBlock>
          )}
        </div>
        <div className="space-y-5">
          <RelatedBlock
            empty="Связанные процедуры будут добавлены при наполнении раздела."
            items={procedures}
            title="Связанные процедуры"
          />
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
          "@type": "Product",
          name: data.title,
          url: absoluteUrl(`/equipment/${data.slug}`),
        }}
      />
    </TemplateShell>
  );
}
