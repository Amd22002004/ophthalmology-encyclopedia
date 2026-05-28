import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getGuidelines } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("guidelines");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function GuidelinesPage() {
  const items = await getGuidelines();
  return <CatalogLayout config={config} items={items} />;
}
