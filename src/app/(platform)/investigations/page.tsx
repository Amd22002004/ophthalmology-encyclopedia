import Link from "next/link";
import { AppealInvitation } from "@/components/appeals/appeal-invitation";
import { EntityHeader } from "@/components/entity/entity-header";
import { SchemaOrg } from "@/components/seo/schema-org";
import { getInvestigations } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = createPageMetadata({
  title: "Расследования",
  description:
    "Опубликованные расследования Ассоциации: документы, хронология, связи с карточками клиник и оборудования, а также статус рассмотрения.",
  path: "/investigations",
});

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default async function InvestigationsPage() {
  const investigations = await getInvestigations();

  return (
    <div className="space-y-5">
      <EntityHeader
        description="Доказательные материалы Ассоциации: первичные документы, хронология, связанные карточки и статус каждого расследования."
        eyebrow="Расследования"
        title="Расследования"
      />

      <AppealInvitation
        compact
        description="Передайте информацию или документы по опубликованному расследованию либо направьте общее обращение."
        title="Сообщить о возможном случае"
      />

      {investigations.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {investigations.map((investigation) => (
            <article className="rounded-lg border bg-card p-5" key={investigation.slug}>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Расследование Ассоциации</p>
              <h2 className="mt-2 text-lg font-semibold">
                <Link className="hover:text-primary hover:underline" href={"/investigations/" + investigation.slug}>
                  {investigation.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{investigation.summary}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{investigation.status}</span>
                {investigation.publishedAt && <span>Опубликовано: {formatDate(investigation.publishedAt)}</span>}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Связано: клиник — {investigation.clinicCount}, оборудования — {investigation.equipmentCount}, обращений — {investigation.appealCount}
              </p>
              <Link
                className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
                href={"/investigations/" + investigation.slug}
              >
                Открыть материал →
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
          Опубликованных расследований пока нет.
        </p>
      )}

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/investigations", label: "Расследования" },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Расследования",
          description:
            "Опубликованные расследования Ассоциации офтальмологических клиник с документами и статусами.",
          url: absoluteUrl("/investigations"),
        }}
      />
    </div>
  );
}
