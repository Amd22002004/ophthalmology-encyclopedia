import { RegulationsCatalog } from "@/components/regulations/regulations-catalog";
import { SchemaOrg } from "@/components/seo/schema-org";
import { getRegulations, getRegulationTopics } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 3600;
export const metadata = createPageMetadata({
  title: "Нормативная база для аудита медицинских организаций",
  description:
    "Официальные нормы РФ, периоды действия, требования, проверочные вопросы и первичные документы для нейтрального аудита медицинских организаций.",
  path: "/regulations",
});

function singleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function parseEffectiveDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const LEGAL_STATUSES = new Set(["IN_FORCE", "FUTURE", "EXPIRED"] as const);

export default async function RegulationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const topic = singleValue(params.topic);
  const statusValue = singleValue(params.status);
  const dateValue = singleValue(params.date);
  const legalStatus =
    statusValue && LEGAL_STATUSES.has(statusValue as "IN_FORCE" | "FUTURE" | "EXPIRED")
      ? (statusValue as "IN_FORCE" | "FUTURE" | "EXPIRED")
      : undefined;

  const [topics, regulations] = await Promise.all([
    getRegulationTopics(),
    getRegulations({
      topicSlug: topic,
      legalStatus,
      effectiveOn: parseEffectiveDate(dateValue),
    }),
  ]);

  return (
    <>
      <RegulationsCatalog
        activeDate={dateValue}
        activeStatus={legalStatus}
        activeTopic={topic}
        regulations={regulations}
        topics={topics}
      />
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/regulations", label: "Нормативная база" },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Нормативная база",
          description:
            "Нейтральный нормативный граф с периодами действия и документальными вопросами для проверки.",
          url: absoluteUrl("/regulations"),
          numberOfItems: regulations.length,
        }}
      />
    </>
  );
}
