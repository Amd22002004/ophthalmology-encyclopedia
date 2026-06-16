import { notFound } from "next/navigation";
import { ClinicDbTemplate } from "@/components/templates/clinic-db-template";
import { getClinic } from "@/lib/loaders";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const clinic = await getClinic(slug);
  if (!clinic) return {};

  const title = clinic.seoTitle || clinic.title;
  const description =
    clinic.seoDescription ||
    (clinic.city
      ? `Офтальмологическая клиника в ${clinic.city}${clinic.region ? `, ${clinic.region}` : ""}`
      : "Офтальмологическая организация");

  const metadata = createPageMetadata({ title, description, path: `/clinics/${slug}` });

  if (clinic.seoKeywords) {
    metadata.keywords = clinic.seoKeywords;
  }

  const image = clinic.coverImageUrl ?? clinic.logoUrl;
  if (image) {
    const imageUrl = absoluteUrl(image);
    metadata.openGraph = { ...metadata.openGraph, images: [{ url: imageUrl }] };
    metadata.twitter = { ...metadata.twitter, card: "summary_large_image", images: [imageUrl] };
  }

  return metadata;
}

export default async function ClinicPage({ params }: Props) {
  const { slug } = await params;
  const clinic = await getClinic(slug);
  if (!clinic) notFound();
  return <ClinicDbTemplate data={clinic} />;
}
