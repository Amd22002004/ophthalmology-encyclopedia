import { notFound } from "next/navigation";
import { EquipmentTemplate } from "@/components/templates/equipment-template";
import { getEquipmentItem } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await getEquipmentItem(slug);
  if (!item) return {};
  return createPageMetadata({
    title: `${item.title} — характеристики, применение и документация`,
    description: item.summary ?? item.title,
    path: `/equipment/${slug}`,
    image: item.images[0],
  });
}

export default async function EquipmentEntityPage({ params }: Props) {
  const { slug } = await params;
  const item = await getEquipmentItem(slug);
  if (!item) notFound();
  return <EquipmentTemplate data={item} />;
}
