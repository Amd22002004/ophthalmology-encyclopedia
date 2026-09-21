import { PublicationsCatalog } from "@/components/templates/publications-catalog";
import { getCatalogConfig } from "@/lib/content-model";
import { getPublicationsCatalog } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("publications");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function PublicationsPage() {
  // Каталог объединяет прошедшие свои публичные фильтры ScientificWork и
  // существующие редакционные Publication без коллизий slug.
  const items = await getPublicationsCatalog();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          {config.eyebrow}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {config.title}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">{config.description}</p>
      </div>

      {items.length === 0 ? (
        <div className="space-y-2 rounded-xl border bg-card p-10 text-center">
          <p className="text-lg font-semibold text-foreground">{config.emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{config.emptyDescription}</p>
        </div>
      ) : (
        <PublicationsCatalog items={items} />
      )}
    </div>
  );
}
