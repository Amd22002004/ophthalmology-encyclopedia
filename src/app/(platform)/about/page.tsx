import { AssociationAboutPage } from "@/components/about/association-about-page";
import { SchemaOrg } from "@/components/seo/schema-org";
import { getClinicsCatalog, getDoctor, getEntityCounts } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = createPageMetadata({
  title: "Об Ассоциации офтальмологических клиник",
  description:
    "Миссия, проекты, участники и направления работы Ассоциации офтальмологических клиник — профессионального сообщества клиник, врачей, экспертов и партнёров.",
  path: "/about",
  image: "/images/about-association-workspace.png",
  imageAlt: "Профессиональная офтальмологическая среда и научные материалы",
  imageWidth: 1536,
  imageHeight: 1024,
});

export default async function AboutPage() {
  const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());
  const [countsResult, clinicsResult, doctorResult] = await Promise.allSettled([
    hasDatabase ? getEntityCounts() : Promise.resolve(null),
    hasDatabase ? getClinicsCatalog() : Promise.resolve([]),
    hasDatabase ? getDoctor("ostroverhov-aleksandr-ivanovich") : Promise.resolve(null),
  ]);

  const counts = countsResult.status === "fulfilled" ? countsResult.value : null;
  const clinics = clinicsResult.status === "fulfilled" ? clinicsResult.value : [];
  const doctor = doctorResult.status === "fulfilled" ? doctorResult.value : null;

  return (
    <>
      <AssociationAboutPage counts={counts} clinics={clinics} doctor={doctor} />
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/about", label: "Об Ассоциации" },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": `${absoluteUrl("/about")}#organization`,
          name: "Ассоциация офтальмологических клиник",
          description:
            "Профессиональное сообщество клиник, врачей, экспертов и партнёров в области офтальмологии.",
          url: absoluteUrl("/about"),
          email: "aok@oftalmologia.pro",
        }}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Об Ассоциации офтальмологических клиник",
          description:
            "Миссия, проекты, участники и направления работы Ассоциации офтальмологических клиник.",
          url: absoluteUrl("/about"),
          inLanguage: "ru-RU",
          about: { "@id": `${absoluteUrl("/about")}#organization` },
          primaryImageOfPage: absoluteUrl("/images/about-association-workspace.png"),
        }}
      />
    </>
  );
}
