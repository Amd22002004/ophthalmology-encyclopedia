import type { Metadata } from "next";
import { CooperationLanding } from "@/components/cooperation/cooperation-landing";
import { SchemaOrg } from "@/components/seo/schema-org";
import { getClinics } from "@/lib/loaders";
import { cooperationTrackingFromSearchParams, type CooperationSearchParams } from "@/lib/cooperation/page-data";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

const pageTitle = "Сотрудничество — Ассоциация офтальмологических клиник";
const pageDescription = "Ассоциация создаёт профессиональную среду для врачей, клиник и технологических партнёров: обмена клиническим опытом, развития специалистов и внедрения современных технологий в офтальмологии.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/cooperation" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/cooperation",
    type: "website",
  },
};

export default async function CooperationPage({ searchParams }: { searchParams: Promise<CooperationSearchParams> }) {
  const tracking = cooperationTrackingFromSearchParams(await searchParams, "/cooperation", pageTitle);
  const clinicItems = await getClinics({ take: 100 });
  return <><CooperationLanding clinics={clinicItems.map((clinic) => ({ title: clinic.title, description: clinic.description }))} tracking={tracking} /><SchemaOrg data={breadcrumbJsonLd([{ href: "/", label: "Главная" }, { href: "/cooperation", label: "Сотрудничество" }])} /><SchemaOrg data={{ "@context": "https://schema.org", "@type": "WebPage", name: pageTitle, description: pageDescription, url: absoluteUrl("/cooperation"), inLanguage: "ru-RU" }} /></>;
}
