import { notFound } from "next/navigation";
import { DiseaseTemplate } from "@/components/templates/disease-template";
import { getDiseaseContent } from "@/lib/disease-content";
import { getDisease } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const disease = await getDisease(slug);
  if (!disease) return {};
  const editorial = getDiseaseContent(slug);
  return createPageMetadata({
    title: editorial?.seo.title ?? disease.title,
    description: editorial?.seo.description ?? disease.summary ?? disease.title,
    path: `/diseases/${slug}`,
    ...(editorial
      ? {
          image: editorial.image.src,
          imageAlt: editorial.image.alt,
          imageWidth: editorial.image.width,
          imageHeight: editorial.image.height,
          absoluteTitle: true,
          robots: { index: true, follow: true },
        }
      : {}),
  });
}

export default async function DiseasePage({ params }: Props) {
  const { slug } = await params;
  const disease = await getDisease(slug);
  if (!disease) notFound();
  return <DiseaseTemplate data={disease} />;
}
