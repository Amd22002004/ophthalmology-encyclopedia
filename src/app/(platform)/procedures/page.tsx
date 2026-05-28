import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getProcedures } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("procedures");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function ProceduresPage() {
  const items = await getProcedures();
  return <CatalogLayout config={config} items={items} />;
}
