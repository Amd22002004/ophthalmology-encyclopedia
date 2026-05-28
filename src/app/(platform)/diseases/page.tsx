import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getDiseases } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("diseases");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function DiseasesPage() {
  const items = await getDiseases();
  return <CatalogLayout config={config} items={items} />;
}
