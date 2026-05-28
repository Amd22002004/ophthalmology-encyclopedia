import { notFound } from "next/navigation";
import { PublicationTemplate } from "@/components/templates/publication-template";
import { getPublication } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const pub = await getPublication(slug);
  if (!pub) return {};
  return createPageMetadata({
    title: pub.title,
    description: pub.abstract?.slice(0, 160) ?? pub.title,
    path: `/publications/${slug}`,
  });
}

export default async function PublicationPage({ params }: Props) {
  const { slug } = await params;
  const pub = await getPublication(slug);
  if (!pub) notFound();
  return <PublicationTemplate data={pub} />;
}
