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
    title: `Документы ${clinic.title} — лицензия и материалы проверки`,
    description: `Опубликованные документы, ответы организаций и материалы проверки, связанные с ${clinic.title}.`,
    path: `/clinics/${slug}/documents`,
  });
}

export default async function ClinicDocumentsPage({ params }: Props) {
  const { slug } = await params;
  const clinic = await getClinic(slug);
  if (!clinic || clinic.investigations.length === 0) notFound();
  return <ClinicResourceTemplate data={clinic} kind="documents" />;
}
