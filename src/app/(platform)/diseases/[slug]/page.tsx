import { notFound } from "next/navigation";
import { DiseaseTemplate } from "@/components/templates/disease-template";
import { getDisease } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const disease = await getDisease(slug);
  if (!disease) return {};
  return createPageMetadata({
    title: disease.title,
    description: disease.summary ?? disease.title,
    path: `/diseases/${slug}`,
  });
}

export default async function DiseasePage({ params }: Props) {
  const { slug } = await params;
  const disease = await getDisease(slug);
  if (!disease) notFound();
  return <DiseaseTemplate data={disease} />;
}
