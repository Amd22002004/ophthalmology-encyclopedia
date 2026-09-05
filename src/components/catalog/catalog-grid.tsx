import { EntityCard } from "@/components/entity/entity-card";
import { CatalogEmpty } from "@/components/catalog/catalog-empty";

export type CatalogGridItem = {
  href: string;
  title: string;
  description: string;
  badges?: string[];
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    loading?: "eager" | "lazy";
  };
};

export function CatalogGrid({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: CatalogGridItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (!items.length) {
    return <CatalogEmpty title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <EntityCard key={item.href} {...item} />
      ))}
    </div>
  );
}
