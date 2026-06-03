import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EntityHeader } from "@/components/entity/entity-header";
import { SchemaOrg } from "@/components/seo/schema-org";
import { ClinicsFilteredGrid } from "@/components/catalog/clinics-filtered-grid";
import { getCatalogConfig } from "@/lib/content-model";
import { CLINICS } from "@/lib/clinics-data";
import { absoluteUrl, breadcrumbJsonLd, createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("clinics");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default function ClinicsPage() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: config.title }]} />
      <EntityHeader
        description={config.description}
        eyebrow={config.eyebrow}
        title={config.title}
      />
      <ClinicsFilteredGrid clinics={CLINICS} />
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: config.path, label: config.title },
        ])}
      />
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
