import type { DiseaseFaqItem } from "@/lib/disease-content";

export function DiseaseFaq({ items }: { items: readonly DiseaseFaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="disease-faq-title">
      <h2 id="disease-faq-title" className="text-2xl font-semibold tracking-tight">
        Частые вопросы
      </h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <details key={`${item.question}-${index}`} className="group rounded-lg border bg-card">
            <summary className="cursor-pointer list-none px-5 py-4 font-medium outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.question}
                <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <div className="border-t px-5 py-4 text-sm leading-7 text-muted-foreground">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
