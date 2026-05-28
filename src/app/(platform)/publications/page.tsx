import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getPublications } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("publications");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function PublicationsPage() {
  const items = await getPublications();
  return <CatalogLayout config={config} items={items} />;
}
