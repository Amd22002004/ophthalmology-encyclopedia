import { notFound } from "next/navigation";
import { GenericEntityTemplate } from "@/components/templates/generic-entity-template";
import { getGuideline } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await getGuideline(slug);
  if (!item) return {};
  return createPageMetadata({
    title: item.title,
    description: item.summary ?? item.title,
    path: `/guidelines/${slug}`,
  });
}

export default async function GuidelinePage({ params }: Props) {
  const { slug } = await params;
  const item = await getGuideline(slug);
  if (!item) notFound();
  return <GenericEntityTemplate kind="guidelines" data={item} />;
}
