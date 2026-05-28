import { notFound } from "next/navigation";
import { ClinicTemplate } from "@/components/templates/clinic-template";
import { getClinic } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const clinic = await getClinic(slug);
  if (!clinic) return {};
  return createPageMetadata({
    title: clinic.title,
    description: clinic.description ?? clinic.title,
    path: `/clinics/${slug}`,
  });
}

export default async function ClinicPage({ params }: Props) {
  const { slug } = await params;
  const clinic = await getClinic(slug);
  if (!clinic) notFound();
  return <ClinicTemplate data={clinic} />;
}
