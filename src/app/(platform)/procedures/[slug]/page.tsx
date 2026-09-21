import { notFound } from "next/navigation";
import { ProcedureTemplate } from "@/components/templates/procedure-template";
import { getProcedure } from "@/lib/loaders";
import { getProcedureContent } from "@/lib/procedure-content";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const procedure = await getProcedure(slug);
  if (!procedure) return {};
  const editorial = getProcedureContent(slug);
  return createPageMetadata({
    title: editorial?.seo.title ?? procedure.title,
    description: editorial?.seo.description ?? procedure.summary ?? procedure.title,
    path: `/procedures/${slug}`,
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

export default async function ProcedurePage({ params }: Props) {
  const { slug } = await params;
  const procedure = await getProcedure(slug);
  if (!procedure) notFound();
  return <ProcedureTemplate data={procedure} />;
}
