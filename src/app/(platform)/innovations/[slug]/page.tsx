import { notFound } from "next/navigation";
import { InnovationTemplate } from "@/components/templates/innovation-template";
import { getInnovation } from "@/lib/loaders";
import { getInnovationContent } from "@/lib/innovation-content";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await getInnovation(slug);
  if (!item) return {};
  const editorial = getInnovationContent(slug);
  return createPageMetadata({
    title: editorial?.seo.title ?? item.title,
    description: editorial?.seo.description ?? item.summary ?? item.title,
    path: `/innovations/${slug}`,
    ...(editorial
      ? {
          image: editorial.images[0]?.src,
          imageAlt: editorial.images[0]?.alt,
          imageWidth: editorial.images[0]?.width,
          imageHeight: editorial.images[0]?.height,
          absoluteTitle: true,
          robots: { index: true, follow: true },
        }
      : {}),
  });
}

export default async function InnovationPage({ params }: Props) {
  const { slug } = await params;
  const item = await getInnovation(slug);
  if (!item) notFound();
  return <InnovationTemplate data={item} />;
}
