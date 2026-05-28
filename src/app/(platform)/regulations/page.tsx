import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getRegulations } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("regulations");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function RegulationsPage() {
  const items = await getRegulations();
  return <CatalogLayout config={config} items={items} />;
}
