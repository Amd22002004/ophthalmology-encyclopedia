import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getClinics } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("clinics");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function ClinicsPage() {
  const items = await getClinics();
  return <CatalogLayout config={config} items={items} />;
}
