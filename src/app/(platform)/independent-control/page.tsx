import { EntityHeader } from "@/components/entity/entity-header";
import { IndependentControlMethodologies } from "@/components/independent-control/independent-control-methodologies";
import { SchemaOrg } from "@/components/seo/schema-org";
import { getIndependentControlMethodologies } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

const title = "Независимая оценка качества условий";
const description =
  "Рабочая методика независимой оценки: проверяемые критерии, вопросы, первичные документы, применимые нормы и доказательные статусы без автоматических выводов о нарушениях.";

export const revalidate = 3600;

export const metadata = createPageMetadata({
  title,
  description,
  path: "/independent-control",
});

export default async function IndependentControlPage() {
  const methodologies = await getIndependentControlMethodologies();

  return (
    <div className="space-y-5">
      <EntityHeader
        description="Бланк наблюдения рассматривается как методика и рабочий инструмент оценки, а не как закон и не как самостоятельное доказательство нарушения. Ниже показано, что именно и каким первичным документом можно проверять."
        eyebrow="Методика и чек-лист"
        title={title}
      />

      <IndependentControlMethodologies methodologies={methodologies} />

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/independent-control", label: "Независимая оценка" },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          description,
          url: absoluteUrl("/independent-control"),
          mainEntity: methodologies.map((methodology) => ({
            "@type": "DigitalDocument",
            name: methodology.title,
            description: methodology.summary,
            url: absoluteUrl("/independent-control"),
          })),
        }}
      />
    </div>
  );
}
