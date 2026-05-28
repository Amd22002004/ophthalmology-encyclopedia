import { notFound } from "next/navigation";
import { ProcedureTemplate } from "@/components/templates/procedure-template";
import { getProcedure } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const procedure = await getProcedure(slug);
  if (!procedure) return {};
  return createPageMetadata({
    title: procedure.title,
    description: procedure.summary ?? procedure.title,
    path: `/procedures/${slug}`,
  });
}

export default async function ProcedurePage({ params }: Props) {
  const { slug } = await params;
  const procedure = await getProcedure(slug);
  if (!procedure) notFound();
  return <ProcedureTemplate data={procedure} />;
}
