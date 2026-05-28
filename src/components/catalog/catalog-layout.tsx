import type { CatalogConfig } from "@/lib/content-model";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EntityHeader } from "@/components/entity/entity-header";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogGrid, type CatalogGridItem } from "@/components/catalog/catalog-grid";
import { SchemaOrg } from "@/components/seo/schema-org";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function CatalogLayout({
  config,
  items = [],
}: {
  config: CatalogConfig;
  items?: CatalogGridItem[];
}) {
  const breadcrumbs = [
    { href: "/", label: "Главная" },
    { href: config.path, label: config.title },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: config.title }]} />
      <EntityHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
      />
      <CatalogFilters placeholder={`Поиск в разделе: ${config.singular.toLowerCase()}`} />
      <CatalogGrid
        emptyDescription={config.emptyDescription}
        emptyTitle={config.emptyTitle}
        items={items}
      />
      <SchemaOrg data={breadcrumbJsonLd(breadcrumbs)} />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: config.title,
          description: config.description,
          url: absoluteUrl(config.path),
          about: config.schemaType,
        }}
      />
    </div>
  );
}
