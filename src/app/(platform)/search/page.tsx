import Link from "next/link";
import { Search } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CatalogEmpty } from "@/components/catalog/catalog-empty";
import { EntityHeader } from "@/components/entity/entity-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SchemaOrg } from "@/components/seo/schema-org";
import { createPageMetadata, absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { normalizeSearchParam } from "@/lib/slug";
import { searchEntities } from "@/lib/search";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export const metadata = createPageMetadata({
  title: "Поиск",
  description:
    "Глобальный поиск по заболеваниям, врачам, клиникам, поставщикам, оборудованию, публикациям, рекомендациям, регулированию, истории и инновациям.",
  path: "/search",
});

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = normalizeSearchParam(params.q);
  const results = await searchEntities(query);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Поиск" }]} />
      <EntityHeader
        description="Полнотекстовый поиск по заболеваниям, врачам, клиникам, поставщикам, оборудованию, публикациям, клиническим рекомендациям, нормативным материалам, истории и инновациям."
        eyebrow="Поиск по справочнику"
        title="Поиск по офтальмологической энциклопедии"
      />
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_auto]">
        <Input
          defaultValue={query}
          name="q"
          placeholder="Введите заболевание, процедуру, врача, клинику или документ"
        />
        <Button type="submit">
          <Search className="h-4 w-4" />
          Найти
        </Button>
      </form>
      {!query ? (
        <CatalogEmpty
          description="Введите название заболевания, имя врача, название клиники, оборудования или документа."
          title="Введите поисковый запрос"
        />
      ) : results.length ? (
        <div className="grid gap-3">
          {results.map((result) => (
            <Link
              className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
              href={result.href}
              key={`${result.type}-${result.slug}`}
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                {result.type}
              </div>
              <h2 className="mt-1 font-semibold">{result.title}</h2>
              {result.summary ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {result.summary}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <CatalogEmpty
          description="По вашему запросу ничего не найдено. Попробуйте изменить формулировку или воспользуйтесь навигацией по разделам."
          title="Ничего не найдено"
        />
      )}
      <SchemaOrg data={breadcrumbJsonLd([{ href: "/", label: "Главная" }, { href: "/search", label: "Поиск" }])} />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          name: "Поиск",
          url: absoluteUrl("/search"),
        }}
      />
    </div>
  );
}
