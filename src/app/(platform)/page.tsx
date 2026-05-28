import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { EntityCard } from "@/components/entity/entity-card";
import { SchemaOrg } from "@/components/seo/schema-org";
import { audienceHubs, catalogConfigs } from "@/lib/content-model";
import {
  getDiseaseCategories,
  getEntityCounts,
} from "@/lib/loaders";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = createPageMetadata({
  title: "Офтальмологическая энциклопедия",
  description:
    "Профессиональный справочник по офтальмологии: заболевания, процедуры, врачи, клиники, поставщики, оборудование, публикации и нормативные материалы.",
  path: "/",
});

const allCatalogs = Object.values(catalogConfigs);

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-semibold tabular-nums">{value.toLocaleString("ru-RU")}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default async function HomePage() {
  const [counts, diseaseCategories] = await Promise.all([
    getEntityCounts(),
    getDiseaseCategories(),
  ]);

  return (
    <div className="space-y-6">
      {/* Editorial header */}
      <header className="rounded-lg border bg-card p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Офтальмология · Профессиональный справочник
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Офтальмологическая энциклопедия
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Отраслевой индекс заболеваний органа зрения, диагностических и
              лечебных процедур, профилей специалистов, клиник, поставщиков
              оборудования, клинических рекомендаций и научных публикаций.
            </p>
          </div>
          <form action="/search" className="rounded-lg border bg-background p-4">
            <label className="text-sm font-medium" htmlFor="home-search">
              Поиск по энциклопедии
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                className="flex-1"
                id="home-search"
                name="q"
                placeholder="Болезнь, врач, клиника, оборудование…"
              />
              <Button type="submit" variant="default">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Полнотекстовый поиск по всем разделам
            </p>
          </form>
        </div>

        {/* Stats bar */}
        <Separator className="my-4" />
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-7">
          <StatItem label="заболеваний" value={counts.diseases} />
          <StatItem label="процедур" value={counts.procedures} />
          <StatItem label="врачей" value={counts.doctors} />
          <StatItem label="клиник" value={counts.clinics} />
          <StatItem label="поставщиков" value={counts.suppliers} />
          <StatItem label="единиц оборудования" value={counts.equipment} />
          <StatItem label="публикаций" value={counts.publications} />
        </div>
      </header>

      {/* Audience hubs */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Разделы по аудитории
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {audienceHubs.map((hub) => (
            <EntityCard key={hub.href} {...hub} />
          ))}
        </div>
      </section>

      {/* Disease categories taxonomy grid */}
      {diseaseCategories.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Категории заболеваний
            </h2>
            <Link className="text-sm text-primary hover:underline" href="/diseases">
              Все заболевания →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {diseaseCategories.map((cat) => (
              <Link
                className="rounded-md border bg-card px-3 py-2.5 text-sm hover:bg-accent"
                href={`/diseases`}
                key={cat.slug}
              >
                <div className="font-medium text-foreground">{cat.title}</div>
                {cat.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {cat.description}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All catalogs */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Все разделы энциклопедии
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {allCatalogs.map((catalog) => (
            <EntityCard
              description={catalog.description}
              href={catalog.path}
              key={catalog.path}
              title={catalog.title}
            />
          ))}
        </div>
      </section>

      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Офтальмологическая энциклопедия",
          url: absoluteUrl("/"),
          potentialAction: {
            "@type": "SearchAction",
            target: `${absoluteUrl("/search")}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </div>
  );
}
