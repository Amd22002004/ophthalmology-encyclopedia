import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getSuppliers } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("suppliers");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function SuppliersPage() {
  const items = await getSuppliers();
  return <CatalogLayout config={config} items={items} />;
}
