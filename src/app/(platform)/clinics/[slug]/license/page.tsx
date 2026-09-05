import { notFound } from "next/navigation";
import { ClinicResourceTemplate } from "@/components/templates/clinic-resource-template";
import { getClinic } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const clinic = await getClinic(slug);
  if (!clinic || clinic.investigations.length === 0) return {};
  return createPageMetadata({
    title: `Лицензия ${clinic.title} — сведения и границы проверки`,
    description: `Лицензионные сведения ${clinic.title}, доступные в карточке клиники, и нейтральное описание границ опубликованной проверки.`,
    path: `/clinics/${slug}/license`,
  });
}

export default async function ClinicLicensePage({ params }: Props) {
  const { slug } = await params;
  const clinic = await getClinic(slug);
  if (!clinic || clinic.investigations.length === 0) notFound();
  return <ClinicResourceTemplate data={clinic} kind="license" />;
}
