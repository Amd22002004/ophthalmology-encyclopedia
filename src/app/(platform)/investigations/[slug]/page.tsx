import { notFound } from "next/navigation";
import { InvestigationTemplate } from "@/components/templates/investigation-template";
import { getInvestigation } from "@/lib/loaders";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const investigation = await getInvestigation(slug);
  if (!investigation) return {};

  const metadata = createPageMetadata({
    title: investigation.seoTitle || investigation.title,
    description: investigation.seoDescription || investigation.summary,
    path: "/investigations/" + investigation.slug,
  });

  const image = investigation.documents.find((document) => document.previewImageUrl)?.previewImageUrl;
  if (image) {
    const imageUrl = absoluteUrl(image);
    metadata.openGraph = { ...metadata.openGraph, images: [{ url: imageUrl }] };
    metadata.twitter = { ...metadata.twitter, card: "summary_large_image", images: [imageUrl] };
  }

  return metadata;
}

export default async function InvestigationPage({ params }: Props) {
  const { slug } = await params;
  const investigation = await getInvestigation(slug);
  if (!investigation) notFound();
  return <InvestigationTemplate data={investigation} />;
}
