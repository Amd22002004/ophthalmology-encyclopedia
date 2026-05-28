import { CatalogLayout } from "@/components/catalog/catalog-layout";
import { getCatalogConfig } from "@/lib/content-model";
import { getClinics } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

const baseConfig = getCatalogConfig("clinics");
const config = {
  ...baseConfig,
  title: "Клиники по ОМС",
  path: "/clinics/oms",
  description: "Клиники, работающие по системе обязательного медицинского страхования.",
  emptyTitle: "Клиники по ОМС пока не добавлены",
  emptyDescription: "Раздел покажет клиники с активным статусом ОМС после наполнения каталога.",
};

export const revalidate = 3600;
export const metadata = createPageMetadata({
  title: "Клиники по ОМС",
  description: config.description,
  path: "/clinics/oms",
});

export default async function ClinicsOmsPage() {
  const items = await getClinics({ omsEnabled: true });
  return <CatalogLayout config={config} items={items} />;
}
