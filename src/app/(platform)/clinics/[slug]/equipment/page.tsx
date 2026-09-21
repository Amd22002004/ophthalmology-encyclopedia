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
    title: `Оборудование ${clinic.title} — модели и документы`,
    description: `Модели оборудования и опубликованные документы, связанные с ${clinic.title}. Отдельно показаны каталожные связи и материалы проверки конкретных объектов.`,
    path: `/clinics/${slug}/equipment`,
  });
}

export default async function ClinicEquipmentPage({ params }: Props) {
  const { slug } = await params;
  const clinic = await getClinic(slug);
  if (!clinic || clinic.investigations.length === 0) notFound();
  return <ClinicResourceTemplate data={clinic} kind="equipment" />;
}
