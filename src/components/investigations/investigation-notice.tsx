import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export type PublishedInvestigationLink = {
  slug: string;
  title: string;
  summary: string;
  status: string;
};

type InvestigationNoticeProps =
  | { items: PublishedInvestigationLink[]; variant: "catalog" }
  | { items: PublishedInvestigationLink[]; message: string; variant?: "detail" };

export function InvestigationNotice(props: InvestigationNoticeProps) {
  const { items } = props;

  if (items.length === 0) return null;

  if (props.variant === "catalog") {
    const href = items.length === 1 ? `/investigations/${items[0].slug}` : "/investigations";

    return (
      <section
        aria-label="Предупреждение о расследовании Ассоциации"
        className="flex min-h-11 items-center gap-1 border-b border-orange-300 bg-amber-50 px-2 py-2 text-amber-950"
        role="status"
      >
        <AlertTriangle aria-hidden className="h-3.5 w-3.5 shrink-0 text-orange-600" />
        <p className="min-w-0 flex-1 whitespace-nowrap text-[10px] font-semibold leading-5 tracking-[-0.04em]">
          Проводится проверка использования оборудования.
        </p>
        <Link
          aria-label="Читать расследование"
          className="ml-auto shrink-0 text-[10px] font-semibold text-amber-900 underline underline-offset-2 hover:text-primary"
          href={href}
          title="Читать расследование"
        >
          <span className="hidden 2xl:inline">Читать расследование</span>
          <span aria-hidden className="2xl:hidden">↗</span>
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
      <div className="flex gap-3">
        <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="min-w-0">
          <h2 className="font-semibold">{props.message}</h2>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div className="rounded-md border border-amber-200 bg-white/70 p-3" key={item.slug}>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-amber-900/80">{item.status}</p>
                <Link
                  className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline"
                  href={`/investigations/${item.slug}`}
                >
                  Подробнее →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
