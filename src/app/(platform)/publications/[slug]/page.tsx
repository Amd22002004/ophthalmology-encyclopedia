import { notFound } from "next/navigation";
import { PublicationTemplate } from "@/components/templates/publication-template";
import { ScientificWorkTemplate } from "@/components/templates/scientific-work-template";
import { getPublication, getScientificWork, hasScientificWorkSlug } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const work = await getScientificWork(slug);
  if (work) {
    return createPageMetadata({
      title: work.seoTitle ?? work.title,
      description: work.seoDescription ?? work.summary?.slice(0, 160) ?? work.title,
      path: `/publications/${slug}`,
      image: work.images[0] ?? null,
      absoluteTitle: Boolean(work.seoTitle),
    });
  }

  if (await hasScientificWorkSlug(slug)) return {};

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

  // Научные работы (ScientificWork) — основной тип контента раздела.
  const work = await getScientificWork(slug);
  if (work) return <ScientificWorkTemplate data={work} />;

  if (await hasScientificWorkSlug(slug)) notFound();

  // Редакционные материалы (Publication) — второй тип, живёт на том же маршруте.
  const pub = await getPublication(slug);
  if (!pub) notFound();
  return <PublicationTemplate data={pub} />;
}
