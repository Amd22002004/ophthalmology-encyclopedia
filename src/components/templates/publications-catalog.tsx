import Link from "next/link";
import type { PublicationCatalogItem } from "@/lib/loaders";

const CARD =
  "rounded-[13px] border border-[#d8e3e1] bg-card p-[17px_18px] shadow-[0_1px_2px_rgba(15,33,31,0.04),0_4px_14px_rgba(15,33,31,0.05)]";

/** Подпись типа контента. Каталог рассчитан на два вида: научные работы и редакционные статьи. */
const KIND_LABEL: Record<PublicationCatalogItem["kind"], string> = {
  scientific: "Научная работа",
  editorial: "Статья журнала",
};

function Pill({ href, title }: { href: string; title: string }) {
  return (
    <Link
      className="inline-flex items-center gap-1 rounded-[7px] px-[9px] py-[3px] text-[12px] font-medium transition-opacity hover:opacity-80"
      href={href}
      style={{ background: "#e6f4f5", color: "#0a5d65" }}
    >
      {title} <span aria-hidden>↗</span>
    </Link>
  );
}

export function PublicationsCatalog({ items }: { items: PublicationCatalogItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <article className={`${CARD} flex flex-col`} key={`${item.kind}-${item.slug}`}>
          {/* Тип работы + вид контента */}
          <div className="flex flex-wrap items-center gap-[8px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
              {item.type}
            </span>
            <span className="rounded-[6px] bg-muted px-[7px] py-[2px] text-[10.5px] font-semibold text-muted-foreground">
              {KIND_LABEL[item.kind]}
            </span>
          </div>

          {/* Название */}
          <h2 className="mt-[6px] text-[15.5px] font-bold leading-snug text-foreground">
            <Link className="transition-colors hover:text-primary" href={`/publications/${item.slug}`}>
              {item.title}
            </Link>
          </h2>

          {/* Автор · год */}
          <p className="mt-[6px] text-[12.5px] text-muted-foreground">
            {item.authorSlug ? (
              <Link className="font-semibold text-foreground hover:text-primary" href={`/doctors/${item.authorSlug}`}>
                {item.authorName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground">{item.authorName}</span>
            )}
            {item.year != null && <> · {item.year}</>}
          </p>

          {/* Организация */}
          {item.organization && (
            <p className="mt-[4px] text-[12px] leading-snug text-muted-foreground">
              {item.organization}
            </p>
          )}

          {/* Связанные заболевания и процедуры */}
          {(item.diseases.length > 0 || item.procedures.length > 0) && (
            <div className="mt-[12px] space-y-[8px]">
              {item.diseases.length > 0 && (
                <div>
                  <p className="mb-[5px] text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                    Заболевания
                  </p>
                  <div className="flex flex-wrap gap-[6px]">
                    {item.diseases.map((d) => (
                      <Pill href={`/diseases/${d.slug}`} key={d.slug} title={d.title} />
                    ))}
                  </div>
                </div>
              )}
              {item.procedures.length > 0 && (
                <div>
                  <p className="mb-[5px] text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                    Процедуры
                  </p>
                  <div className="flex flex-wrap gap-[6px]">
                    {item.procedures.map((p) => (
                      <Pill href={`/procedures/${p.slug}`} key={p.slug} title={p.title} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Подробнее */}
          <div className="mt-auto flex justify-end pt-[14px]">
            <Link
              className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary transition-colors hover:text-primary/80"
              href={`/publications/${item.slug}`}
            >
              Подробнее →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
