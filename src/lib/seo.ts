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

export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function clinicJsonLd(clinic: {
  slug: string;
  title: string;
  legalName: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  phones: string[];
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  vkUrl: string | null;
  telegramUrl: string | null;
  youtubeUrl: string | null;
  foundedYear: number | null;
}) {
  const url = absoluteUrl(`/clinics/${clinic.slug}`);

  const sameAs = [clinic.website, clinic.vkUrl, clinic.telegramUrl, clinic.youtubeUrl].filter(
    (value): value is string => Boolean(value),
  );

  const address =
    clinic.address || clinic.city || clinic.region
      ? {
          "@type": "PostalAddress",
          ...(clinic.address ? { streetAddress: clinic.address } : {}),
          ...(clinic.city ? { addressLocality: clinic.city } : {}),
          ...(clinic.region ? { addressRegion: clinic.region } : {}),
          addressCountry: "RU",
        }
      : undefined;

  const geo =
    clinic.latitude != null && clinic.longitude != null
      ? { "@type": "GeoCoordinates", latitude: clinic.latitude, longitude: clinic.longitude }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": ["MedicalOrganization", "MedicalClinic", "LocalBusiness"],
    "@id": `${url}#organization`,
    name: clinic.title,
    ...(clinic.legalName && clinic.legalName !== clinic.title
      ? { legalName: clinic.legalName }
      : {}),
    url,
    ...(clinic.description ? { description: clinic.description } : {}),
    ...(clinic.logoUrl ? { logo: absoluteUrl(clinic.logoUrl) } : {}),
    ...(clinic.coverImageUrl ? { image: absoluteUrl(clinic.coverImageUrl) } : {}),
    ...(address ? { address } : {}),
    ...(geo ? { geo } : {}),
    ...(clinic.phones.length > 0 ? { telephone: clinic.phones[0] } : {}),
    ...(clinic.email ? { email: clinic.email } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(clinic.foundedYear ? { foundingDate: String(clinic.foundedYear) } : {}),
    medicalSpecialty: "Ophthalmologic",
  };
}
