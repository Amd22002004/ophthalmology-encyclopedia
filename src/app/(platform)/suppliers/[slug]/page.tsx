import { notFound } from "next/navigation";
import { SupplierTemplate } from "@/components/templates/supplier-template";
import { getSupplier } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supplier = await getSupplier(slug);
  if (!supplier) return {};
  return createPageMetadata({
    title: supplier.title,
    description: supplier.description ?? supplier.title,
    path: `/suppliers/${slug}`,
  });
}

export default async function SupplierPage({ params }: Props) {
  const { slug } = await params;
  const supplier = await getSupplier(slug);
  if (!supplier) notFound();
  return <SupplierTemplate data={supplier} />;
}
