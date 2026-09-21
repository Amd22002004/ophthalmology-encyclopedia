import Link from "next/link";
import { EntityHeader } from "@/components/entity/entity-header";
import { SchemaOrg } from "@/components/seo/schema-org";
import { getNews } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = createPageMetadata({
  title: "Новости",
  description: "Новости Ассоциации и отраслевые обновления с переходом к полным первоисточникам и расследованиям.",
  path: "/news",
});

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default async function NewsPage() {
  const news = await getNews();

  return (
    <div className="space-y-5">
      <EntityHeader
        description="Короткие публикации Ассоциации с переходом к полным материалам, документам и расследованиям."
        eyebrow="Новости Ассоциации"
        title="Новости"
      />

      {news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => (
            <article className="rounded-lg border bg-card p-5" key={item.slug}>
              {item.publishedAt && (
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{formatDate(item.publishedAt)}</p>
              )}
              <h2 className="mt-2 text-lg font-semibold">
                <Link className="hover:text-primary hover:underline" href={"/news/" + item.slug}>
                  {item.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link className="text-sm font-semibold text-primary hover:underline" href={"/news/" + item.slug}>
                  Читать новость →
                </Link>
                {item.investigationSlugs.map((investigationSlug) => (
                  <Link
                    className="text-sm font-semibold text-primary hover:underline"
                    href={"/investigations/" + investigationSlug}
                    key={investigationSlug}
                  >
                    Полное расследование →
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">Новостей пока нет.</p>
      )}

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/news", label: "Новости" },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Новости Ассоциации",
          description: "Короткие публикации Ассоциации офтальмологических клиник.",
          url: absoluteUrl("/news"),
        }}
      />
    </div>
  );
}
