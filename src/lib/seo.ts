import type { Metadata } from "next";
import type { CatalogConfig, EntityKind } from "@/lib/content-model";
import { catalogConfigs } from "@/lib/content-model";
import { slugToTitle } from "@/lib/slug";

export const siteName = "Офтальмологическая энциклопедия";
export const siteDescription =
  "Профессиональная SEO-ориентированная энциклопедия и directory-платформа по офтальмологии.";

export function absoluteUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
      locale: "ru_RU",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function createCatalogMetadata(config: CatalogConfig): Metadata {
  return createPageMetadata({
    title: config.title,
    description: config.description,
    path: config.path,
  });
}

export function createEntityMetadata(kind: EntityKind, slug: string): Metadata {
  const config = catalogConfigs[kind];
  const title = `${config.singular}: ${slugToTitle(slug)}`;

  return createPageMetadata({
    title,
    description: `${config.singular} в структуре отраслевой офтальмологической энциклопедии. Страница готова для связей, metadata и structured data.`,
    path: `${config.path}/${slug}`,
  });
}

export function breadcrumbJsonLd(items: { href: string; label: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}
