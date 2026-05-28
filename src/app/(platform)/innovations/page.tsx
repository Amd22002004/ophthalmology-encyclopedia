import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getInnovations } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("innovations");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function InnovationsPage() {
  const items = await getInnovations();
  return <CatalogLayout config={config} items={items} />;
}
