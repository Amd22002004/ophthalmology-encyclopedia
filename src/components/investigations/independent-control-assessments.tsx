import { ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isPubliclyHiddenInvestigationDocument } from "@/lib/investigation-documents";
import type { InvestigationDetail } from "@/lib/loaders";

type Assessment = InvestigationDetail["independentControlAssessments"][number];
type NormLink = Assessment["criterion"]["normLinks"][number];

const statusLabels: Record<string, string> = {
  CONFIRMED: "Подтверждено",
  LIKELY_NON_COMPLIANCE: "Вероятное несоответствие",
  REQUIRES_VERIFICATION: "Требует проверки",
  NOT_CONFIRMED: "Не подтверждено",
  COMPLIANT: "Соответствует",
};

const applicabilityLabels: Record<string, string> = {
  APPLICABLE: "Применимость подтверждена",
  NOT_APPLICABLE: "Юридически не применяется",
  REQUIRES_VERIFICATION: "Применимость требует проверки",
};

const evidenceRoleLabels: Record<string, string> = {
  SUPPORTS: "SUPPORTS — подтверждает проверяемую версию",
  REFUTES: "REFUTES — опровергает или ограничивает вывод",
  CONTEXT: "CONTEXT — даёт контекст, но не доказывает итог",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

function formatPeriod(
  from: Date | string | null | undefined,
  to: Date | string | null | undefined,
) {
  const formattedFrom = formatDate(from);
  const formattedTo = formatDate(to);
  if (formattedFrom && formattedTo) return `с ${formattedFrom} по ${formattedTo}`;
  if (formattedFrom) return `с ${formattedFrom}`;
  if (formattedTo) return `до ${formattedTo}`;
  return "требует уточнения";
}

function NormSources({ normLink }: { normLink: NormLink }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {normLink.isApplied ? "Применённое основание" : "Связанное основание"}
      </p>
      <Link
        className="mt-1 block rounded-sm text-sm font-semibold leading-5 text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={`/regulations/${encodeURIComponent(normLink.regulation.slug)}`}
      >
        {normLink.regulation.title}
      </Link>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {normLink.provision.locator} · {normLink.provision.title}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Редакция: {formatPeriod(normLink.edition.effectiveFrom, normLink.edition.effectiveTo)}
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {normLink.regulation.sources.map((source) => (
          <li key={source.url}>
            <a
              className="inline-flex items-center gap-1 rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={source.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {source.title}
              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssessmentCard({
  assessment,
  investigationSlug,
}: {
  assessment: Assessment;
  investigationSlug: string;
}) {
  const normLinks = assessment.appliedCriterionNorm
    ? assessment.criterion.normLinks.filter((link) => link.isApplied)
    : assessment.criterion.normLinks;
  const publicEvidence = assessment.evidence.filter(
    (item) => !isPubliclyHiddenInvestigationDocument(investigationSlug, item.document),
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary">
              {assessment.criterion.sourceLocator} · {assessment.criterion.sectionTitle}
            </p>
            <CardTitle className="mt-1 leading-6">
              {assessment.criterion.checkQuestion}
            </CardTitle>
          </div>
          <Badge variant="outline">
            {statusLabels[assessment.status] ?? assessment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span>
            Период события: {assessment.eventDateLabel ?? formatPeriod(assessment.eventFrom, assessment.eventTo)}
          </span>
          <span>
            {applicabilityLabels[assessment.applicabilityStatus] ??
              assessment.applicabilityStatus}
          </span>
          {assessment.clinic ? (
            <Link
              className="font-medium text-primary hover:underline"
              href={`/clinics/${assessment.clinic.slug}`}
            >
              {assessment.clinic.title}
            </Link>
          ) : null}
        </div>

        <div className="rounded-md bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Нейтральный вывод
          </p>
          <p className="mt-1 text-sm leading-6 text-foreground">
            {assessment.neutralConclusion}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Альтернативная версия
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground">
              {assessment.alternativeVersion}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Пробелы доказательств
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground">
              {assessment.evidenceGaps ?? "Дополнительные пробелы не зафиксированы."}
            </p>
          </div>
        </div>

        <dl className="grid gap-2 rounded-md border p-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Подтверждающая версия</dt>
            <dd className="mt-1 font-medium text-foreground">
              {assessment.supportingEvidenceSearchCompleted
                ? "Поиск завершён"
                : "Поиск не завершён"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Опровергающая версия</dt>
            <dd className="mt-1 font-medium text-foreground">
              {assessment.refutingEvidenceSearchCompleted
                ? "Поиск завершён"
                : "Поиск не завершён"}
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Методика и нормативные источники
          </p>
          <div className="mt-2 space-y-2">
            <div className="rounded-md border p-3">
              <a
                className="inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={assessment.methodology.officialMethodologyUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {assessment.methodology.title}
                <ExternalLink aria-hidden className="h-4 w-4" />
              </a>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {assessment.methodology.legalStatusNote}
              </p>
            </div>
            {normLinks.map((normLink) => (
              <NormSources
                key={`${normLink.regulationKey}-${normLink.provisionKey}-${normLink.checkKey}`}
                normLink={normLink}
              />
            ))}
          </div>
        </div>

        {publicEvidence.length ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Связанные доказательства
            </p>
            <ul className="mt-2 space-y-2">
              {publicEvidence.map((item) => (
                <li
                  className="rounded-md border p-3 text-sm"
                  key={`${item.role}-${item.document.slug}`}
                >
                  <a
                    className="font-semibold text-primary hover:underline"
                    href={`#document-${item.document.slug}`}
                  >
                    {item.document.title}
                  </a>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {evidenceRoleLabels[item.role] ?? item.role}
                    {item.isPrimary ? " · первичное доказательство" : ""}
                  </p>
                  {item.note ? (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {item.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="rounded-md border p-3 text-xs leading-5 text-muted-foreground">
            Публичные доказательства к этой проверочной карточке не приложены;
            статус не следует трактовать как установленное нарушение.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function IndependentControlAssessments({
  assessments,
  investigationSlug,
}: {
  assessments: InvestigationDetail["independentControlAssessments"];
  investigationSlug: string;
}) {
  if (!assessments.length) return null;

  return (
    <section className="space-y-4" id="independent-control-assessments">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Проверка по критериям независимой оценки
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Это отдельная проверка условий оказания услуг, а не вывод о клиническом
          качестве помощи. Показаны только карточки, прошедшие evidence-validation;
          отсутствие документа или результата поиска не превращается в нарушение.
        </p>
      </div>

      <div className="space-y-4">
        {assessments.map((assessment) => (
          <AssessmentCard
            assessment={assessment}
            investigationSlug={investigationSlug}
            key={assessment.key}
          />
        ))}
      </div>

      <p className="flex gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
        <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Для итогового статуса проверяются период действия нормы, первичные
        документы, подтверждающая и опровергающая версии. Методический критерий сам
        по себе не доказывает несоответствие.
      </p>
    </section>
  );
}
