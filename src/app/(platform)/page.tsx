import Link from "next/link";
import { ArrowRight, BookOpen, Building2, Package, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { EntityCard } from "@/components/entity/entity-card";
import { SchemaOrg } from "@/components/seo/schema-org";
import { audienceHubs, catalogConfigs } from "@/lib/content-model";
import {
  getDiseaseCategories,
  getEntityCounts,
  getNews,
} from "@/lib/loaders";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import { associationHomeContent, associationPillars } from "@/lib/association-content";

export const revalidate = 3600;

export const metadata = createPageMetadata({
  title: "Ассоциация офтальмологических клиник — профессиональное объединение",
  description:
    "Профессиональное объединение офтальмологических клиник, врачей и отраслевых партнёров. Обмен опытом, развитие профессиональных связей и информационная инфраструктура офтальмологической отрасли.",
  path: "/",
  absoluteTitle: true,
});

const allCatalogs = Object.values(catalogConfigs);

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-semibold tabular-nums text-primary">
        {value.toLocaleString("ru-RU")}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default async function HomePage() {
  const [counts, diseaseCategories, latestNews] = await Promise.all([
    getEntityCounts(),
    getDiseaseCategories(),
    getNews({ take: 3 }),
  ]);

  return (
    <div className="space-y-5 md:space-y-6">
      <header className="mx-1 overflow-hidden rounded-xl border bg-card md:mx-0">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_290px]">
          <div
            className="home-hero relative isolate grid grid-cols-1 gap-3 overflow-hidden bg-white bg-cover bg-center p-0 md:gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(260px,1.1fr)] md:items-center md:p-6"
          >
            <div className="pointer-events-none absolute inset-0 bg-white/10" aria-hidden="true" />
            <div className="relative z-10 p-5 pb-2 sm:p-6 sm:pb-2 md:p-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                {associationHomeContent.hero.eyebrow}
              </div>
              <h1 className="mt-2 text-[31px] font-semibold leading-[1.12] tracking-tight sm:text-3xl lg:text-[2.15rem] lg:leading-tight">
                {associationHomeContent.hero.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:hidden">
                {associationHomeContent.hero.mobileDescription}
              </p>
              <p className="mt-3 hidden max-w-xl text-sm leading-6 text-muted-foreground md:block">
                {associationHomeContent.hero.description}
              </p>
              <div className="mt-5 flex flex-col gap-3 md:flex-row md:flex-wrap md:gap-2">
                <Button asChild className="min-h-[52px] w-full md:min-h-0 md:w-auto">
                  <Link href="/cooperation">{associationHomeContent.hero.primaryCta}</Link>
                </Button>
                <Button asChild className="min-h-[52px] w-full md:min-h-0 md:w-auto" variant="outline">
                  <Link href="/about">{associationHomeContent.hero.secondaryCta}</Link>
                </Button>
              </div>
            </div>
            <div className="home-hero-art relative z-10 min-w-0 w-full min-h-[160px] max-[359px]:min-h-[145px] overflow-hidden rounded-lg sm:min-h-[175px] md:hidden" aria-hidden="true" />
            <div className="relative z-10 hidden min-h-[230px] overflow-hidden rounded-lg md:block md:min-h-[300px]" aria-hidden="true" />
          </div>
          <form action="/search" className="border-t bg-muted/20 p-4 lg:border-l lg:border-t-0 lg:p-5">
            <label className="text-sm font-medium" htmlFor="home-search">
              Поиск по сайту
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                className="min-w-0 flex-1 bg-background"
                id="home-search"
                name="q"
                placeholder="Болезнь, врач, клиника…"
              />
              <Button type="submit" variant="default" aria-label="Искать">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Полнотекстовый поиск по всем разделам
            </p>
          </form>
        </div>
      </header>

      <section className="space-y-3" aria-labelledby="association-pillars-title">
        <div>
          <h2 id="association-pillars-title" className="text-lg font-semibold">
            Что объединяет Ассоциация
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Профессиональная среда для клиник, специалистов, знаний, технологий и отраслевого взаимодействия.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[Building2, Users, BookOpen, Package].map((Icon, index) => {
            const pillar = associationPillars[index];
            return (
              <Card key={pillar.title} className="h-full">
                <CardHeader className="pb-3">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle className="pt-1 text-sm leading-5">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{pillar.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="encyclopedia-title">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Цифровой проект Ассоциации</p>
          <h2 id="encyclopedia-title" className="mt-2 text-xl font-semibold tracking-tight">
            {associationHomeContent.encyclopedia.title}
          </h2>
          <p className="mt-1 text-sm font-medium text-foreground">
            {associationHomeContent.encyclopedia.subtitle}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {associationHomeContent.encyclopedia.body}
          </p>
          <Button asChild className="mt-4">
            <Link href="/diseases">{associationHomeContent.encyclopedia.cta}</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5" aria-labelledby="infrastructure-title">
        <div className="mb-4">
          <h2 id="infrastructure-title" className="text-lg font-semibold">
            {associationHomeContent.infrastructureTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Динамические показатели информационных разделов и профессиональных каталогов платформы.
          </p>
        </div>
        <Separator className="mb-4" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatItem label="заболеваний" value={counts.diseases} />
          <StatItem label="процедур" value={counts.procedures} />
          <StatItem label="врачей" value={counts.doctors} />
          <StatItem label="клиник" value={counts.clinics} />
          <StatItem label="единиц оборудования" value={counts.equipment} />
          <StatItem label="публикаций" value={counts.publications} />
        </div>
      </section>

      {/* Audience hubs */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Проекты и сервисы Ассоциации
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

      {latestNews.length > 0 && (
        <section aria-labelledby="latest-news-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="latest-news-title" className="text-lg font-semibold">
              Последние новости
            </h2>
            <Link className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline" href="/news">
              Все новости <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {latestNews.map((news, index) => (
              <article
                className={`rounded-lg border bg-card p-4 ${index === 0 ? "lg:col-span-2 lg:p-5" : ""}`}
                key={news.slug}
              >
                {news.publishedAt && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {new Intl.DateTimeFormat("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(news.publishedAt)}
                  </p>
                )}
                <h3 className="mt-2 font-semibold leading-6">
                  <Link className="hover:text-primary hover:underline" href={`/news/${news.slug}`}>
                    {news.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{news.summary}</p>
                <Link className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline" href={`/news/${news.slug}`}>
                  Подробнее <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Ассоциация офтальмологических клиник",
          alternateName: "Офтальмологическая энциклопедия",
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
