import { notFound } from "next/navigation";
import { ClinicStaticTemplate } from "@/components/templates/clinic-static-template";
import { getClinicBySlug, getAllClinicSlugs } from "@/lib/clinics-data";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllClinicSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const clinic = getClinicBySlug(slug);
  if (!clinic) return {};
  return createPageMetadata({
    title: clinic.title,
    description: `${clinic.clinicType === "centre" ? "Центр микрохирургии глаза" : "Офтальмологическая организация"} в ${clinic.city}`,
    path: `/clinics/${slug}`,
  });
}

export default async function ClinicPage({ params }: Props) {
  const { slug } = await params;
  const clinic = getClinicBySlug(slug);
  if (!clinic) notFound();
  return <ClinicStaticTemplate data={clinic} />;
}
