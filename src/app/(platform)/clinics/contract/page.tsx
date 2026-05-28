import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getClinics } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

const baseConfig = getCatalogConfig("clinics");
const config = {
  ...baseConfig,
  title: "Договорные клиники",
  path: "/clinics/contract",
  description: "Клиники, работающие на договорной основе без ОМС.",
  emptyTitle: "Договорные клиники пока не добавлены",
  emptyDescription: "Раздел покажет клиники на договорной основе после наполнения каталога.",
};

export const revalidate = 3600;
export const metadata = createPageMetadata({
  title: "Договорные клиники",
  description: config.description,
  path: "/clinics/contract",
});

export default async function ClinicsContractPage() {
  const items = await getClinics({ contractBased: true });
  return <CatalogLayout config={config} items={items} />;
}
