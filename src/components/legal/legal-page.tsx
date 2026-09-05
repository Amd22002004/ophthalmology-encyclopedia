import Link from "next/link";
import { EntityBlock } from "@/components/entity/entity-block";
import { EntityHeader } from "@/components/entity/entity-header";
import { SchemaOrg } from "@/components/seo/schema-org";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { legalApprovalNotice, legalOperator, legalSources } from "@/lib/legal";

export type LegalSection = { title: string; paragraphs: readonly string[] };

export function LegalPage({
  title,
  eyebrow,
  description,
  path,
  sections,
}: {
  title: string;
  eyebrow: string;
  description: string;
  path: string;
  sections: readonly LegalSection[];
}) {
  return (
    <div className="space-y-5">
      <EntityHeader
        badges={["Правовая информация", "Требует утверждения"]}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />

      <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="note">
        <p className="font-semibold">{legalApprovalNotice}</p>
        <p className="mt-2">Публичные реквизиты оператора в этом документе взяты из предоставленных материалов и не дополнялись предположениями.</p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <EntityBlock title="Оператор">
          <dl className="space-y-2">
            <div><dt className="font-medium text-foreground">Наименование</dt><dd>{legalOperator.name}</dd></div>
            <div><dt className="font-medium text-foreground">ОГРН / ИНН / КПП</dt><dd>{legalOperator.ogrn} / {legalOperator.inn} / {legalOperator.kpp}</dd></div>
            <div><dt className="font-medium text-foreground">ОКПО</dt><dd>{legalOperator.okpo}</dd></div>
            <div><dt className="font-medium text-foreground">Адрес</dt><dd>{legalOperator.address}</dd></div>
            <div><dt className="font-medium text-foreground">Email</dt><dd><a className="text-primary underline-offset-4 hover:underline" href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a></dd></div>
          </dl>
        </EntityBlock>
        <EntityBlock title="Навигация по документам">
          <div className="space-y-2">
            <Link className="block text-primary underline-offset-4 hover:underline" href="/privacy-policy">Политика обработки персональных данных →</Link>
            <Link className="block text-primary underline-offset-4 hover:underline" href="/personal-data-consent">Согласие на обработку персональных данных →</Link>
            <Link className="block text-primary underline-offset-4 hover:underline" href="/cookies">Использование cookies →</Link>
            <Link className="block text-primary underline-offset-4 hover:underline" href="/appeal">Подать обращение →</Link>
          </div>
        </EntityBlock>
      </section>

      <div className="space-y-5">
        {sections.map((section) => (
          <EntityBlock key={section.title} title={section.title}>
            <div className="space-y-3">
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </EntityBlock>
        ))}
      </div>

      <EntityBlock title="Официальные источники для юридической проверки">
        <ul className="list-disc space-y-2 pl-5">
          {legalSources.map((source) => <li key={source.href}><a className="text-primary underline-offset-4 hover:underline" href={source.href} rel="noreferrer" target="_blank">{source.label} ↗</a></li>)}
        </ul>
      </EntityBlock>

      <SchemaOrg data={breadcrumbJsonLd([{ href: "/", label: "Главная" }, { href: path, label: title }])} />
      <SchemaOrg data={{ "@context": "https://schema.org", "@type": "WebPage", name: title, description, url: absoluteUrl(path) }} />
    </div>
  );
}

