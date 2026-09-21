import type { DiseaseSource } from "@/lib/disease-content";

const sectionLabels: Record<string, string> = {
  definition: "определение",
  causes: "причины",
  riskFactors: "факторы риска",
  symptoms: "симптомы",
  types: "формы",
  diagnosis: "диагностика",
  treatment: "лечение",
  prognosis: "наблюдение и прогноз",
  prevention: "профилактика",
  whenToSeeDoctor: "когда обратиться к врачу",
};

export function DiseaseSourceList({ sources }: { sources: readonly DiseaseSource[] }) {
  if (sources.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="disease-sources-title">
      <div>
        <h2 id="disease-sources-title" className="text-2xl font-semibold tracking-tight">
          Источники медицинской информации
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Источники указаны для редакционного аудита; содержание страницы не заменяет очную консультацию.
        </p>
      </div>
      <ol className="space-y-3">
        {sources.map((source) => (
          <li key={source.url} className="rounded-lg border bg-card p-4 text-sm">
            <a
              className="font-medium text-primary underline-offset-4 hover:underline"
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {source.name}
            </a>
            <dl className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="inline font-medium">Обращение: </dt>
                <dd className="inline">{source.accessedAt}</dd>
              </div>
              {source.updatedAt ? (
                <div>
                  <dt className="inline font-medium">Актуализация источника: </dt>
                  <dd className="inline">{source.updatedAt}</dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-2 text-muted-foreground">
              Использован для разделов: {source.sections.map((section) => sectionLabels[section] ?? section).join(", ")}.
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
