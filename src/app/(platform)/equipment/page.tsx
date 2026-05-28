import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getEquipmentList } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("equipment");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function EquipmentPage() {
  const items = await getEquipmentList();
  return <CatalogLayout config={config} items={items} />;
}
