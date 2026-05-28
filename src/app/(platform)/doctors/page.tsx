import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getDoctors } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("doctors");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function DoctorsPage() {
  const items = await getDoctors();
  return <CatalogLayout config={config} items={items} />;
}
