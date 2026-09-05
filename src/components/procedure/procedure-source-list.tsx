import type { ProcedureSource } from "@/lib/procedure-content";

const sectionLabels: Record<string, string> = {
  definition: "определение",
  principle: "принцип действия",
  steps: "этапы процедуры",
  applications: "область применения",
  features: "особенности метода",
  limitations: "ограничения и противопоказания",
  preparation: "подготовка",
  recovery: "восстановление",
  risks: "риски и осложнения",
  comparison: "сравнение методов",
  faq: "частые вопросы",
};

export function ProcedureSourceList({ sources }: { sources: readonly ProcedureSource[] }) {
  if (sources.length === 0) return null;

  return (
    <section className="space-y-3 rounded-lg border bg-card p-5" aria-labelledby="procedure-sources-title">
      <h2 id="procedure-sources-title" className="text-2xl font-semibold tracking-tight">
        Источники медицинской информации
      </h2>
      <p className="text-sm leading-6 text-muted-foreground">
        Источники указаны для редакционного аудита; содержание страницы не заменяет очную консультацию.
      </p>
      <ol className="space-y-3 text-sm leading-6 text-muted-foreground">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {source.name}
            </a>
            <div>
              Дата обращения: {source.accessedAt}
              {source.updatedAt ? ` · актуализация: ${source.updatedAt}` : ""}
            </div>
            <div>
              Использован для разделов: {source.sections.map((section) => sectionLabels[section] ?? section).join(", ")}.
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
