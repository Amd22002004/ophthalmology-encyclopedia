import { notFound } from "next/navigation";
import { RegulationDetail } from "@/components/regulations/regulation-detail";
import { SchemaOrg } from "@/components/seo/schema-org";
import { getRegulation } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await getRegulation(slug);
  if (!item) return {};
  return createPageMetadata({
    title: item.seoTitle || item.title,
    description: item.seoDescription || item.summary || item.title,
    path: `/regulations/${item.slug}`,
  });
}

export default async function RegulationPage({ params }: Props) {
  const { slug } = await params;
  const item = await getRegulation(slug);
  if (!item) notFound();
  const path = `/regulations/${item.slug}`;

  return (
    <>
      <RegulationDetail regulation={item} />
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/regulations", label: "Нормативная база" },
          { href: path, label: item.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "Legislation",
          "@id": `${absoluteUrl(path)}#legislation`,
          name: item.title,
          url: absoluteUrl(path),
          ...(item.summary ? { description: item.summary } : {}),
          ...(item.number ? { legislationIdentifier: item.number } : {}),
          ...(item.adoptedAt
            ? { dateCreated: item.adoptedAt.toISOString().slice(0, 10) }
            : {}),
          ...(item.jurisdiction ? { legislationJurisdiction: item.jurisdiction } : {}),
          ...(item.officialPublicationUrl ? { sameAs: item.officialPublicationUrl } : {}),
        }}
      />
    </>
  );
}
