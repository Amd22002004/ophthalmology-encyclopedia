import { ExternalLink, FileCheck2, Scale, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { getIndependentControlMethodologies } from "@/lib/loaders";

type Methodology = Awaited<
  ReturnType<typeof getIndependentControlMethodologies>
>[number];
type Criterion = Methodology["criteria"][number];
type NormLink = Criterion["normLinks"][number];

const statusLabels: Record<string, string> = {
  CONFIRMED: "Подтверждено",
  LIKELY_NON_COMPLIANCE: "Вероятное несоответствие",
  REQUIRES_VERIFICATION: "Требует проверки",
  NOT_CONFIRMED: "Не подтверждено",
  COMPLIANT: "Соответствует",
};

const sourceKindLabels: Record<string, string> = {
  LOCAL_DOCUMENT: "Локальный рабочий экземпляр",
  OFFICIAL_METHODOLOGY: "Официальный методический источник",
  OFFICIAL_GUIDANCE: "Официальное разъяснение",
};

const rightsLabels: Record<string, string> = {
  UNVERIFIED: "Право публичного размещения не подтверждено",
  OPEN_LICENSE: "Открытая лицензия проверена",
  AUTHOR_PERMISSION: "Получено разрешение автора",
  PUBLISHER_PERMISSION: "Получено разрешение издателя",
  USER_CONFIRMED_PERMISSION: "Разрешение подтверждено владельцем материалов",
  PUBLIC_DOMAIN: "Общественное достояние",
};

const normRoleLabels: Record<string, string> = {
  DIRECT_REQUIREMENT: "Прямое нормативное основание",
  SUPPORTING_CONTEXT: "Поддерживающее основание",
  HISTORICAL_CONTEXT: "Историческое основание",
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
  effectiveFrom: Date | string | null | undefined,
  effectiveTo: Date | string | null | undefined,
) {
  const from = formatDate(effectiveFrom);
  const to = formatDate(effectiveTo);
  if (from && to) return `с ${from} по ${to}`;
  if (from) return `с ${from}`;
  if (to) return `до ${to}`;
  return "Период определяется по применимой норме";
}

function NormReference({ normLink }: { normLink: NormLink }) {
  const provisionFrom =
    normLink.provision.effectiveFrom ?? normLink.edition.effectiveFrom;
  const provisionTo =
    normLink.provision.effectiveTo ?? normLink.edition.effectiveTo;

  return (
    <li className="rounded-md border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary">
            {normRoleLabels[normLink.role] ?? normLink.role}
          </p>
          <Link
            className="mt-1 block rounded-sm text-sm font-semibold leading-5 text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={`/regulations/${encodeURIComponent(normLink.regulation.slug)}`}
          >
            {normLink.regulation.title}
          </Link>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {normLink.provision.locator} · {normLink.provision.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Период положения: {formatPeriod(provisionFrom, provisionTo)}
          </p>
        </div>
        <Badge variant="outline">
          Проверено {formatDate(normLink.verifiedAt) ?? "—"}
        </Badge>
      </div>
      {normLink.note ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {normLink.note}
        </p>
      ) : null}
      {normLink.regulation.sources.length ? (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
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
      ) : null}
    </li>
  );
}

function CriterionCard({ criterion }: { criterion: Criterion }) {
  return (
    <details className="group rounded-md border bg-card">
      <summary className="cursor-pointer list-none px-4 py-3 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-xs font-medium text-primary">
              {criterion.sourceLocator}
            </span>
            <span className="mt-1 block text-sm font-semibold leading-5 text-foreground">
              {criterion.title}
            </span>
          </span>
          <span
            aria-hidden
            className="shrink-0 text-lg leading-5 text-muted-foreground group-open:rotate-45"
          >
            +
          </span>
        </span>
      </summary>
      <div className="space-y-4 border-t p-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Формулировка рабочего инструмента
          </p>
          <p className="mt-1 text-sm leading-6 text-foreground">
            {criterion.statement}
          </p>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md bg-muted p-3">
            <dt className="text-xs font-medium text-muted-foreground">
              Что проверяется
            </dt>
            <dd className="mt-1 leading-5 text-foreground">
              {criterion.whatIsChecked}
            </dd>
          </div>
          <div className="rounded-md bg-muted p-3">
            <dt className="text-xs font-medium text-muted-foreground">
              Нейтральный вопрос
            </dt>
            <dd className="mt-1 leading-5 text-foreground">
              {criterion.checkQuestion}
            </dd>
          </div>
          <div className="rounded-md border p-3">
            <dt className="text-xs font-medium text-muted-foreground">
              Первичный подтверждающий документ
            </dt>
            <dd className="mt-1 leading-5 text-foreground">
              {criterion.confirmingDocument}
            </dd>
          </div>
          <div className="rounded-md border p-3">
            <dt className="text-xs font-medium text-muted-foreground">
              Какие доказательства нужны
            </dt>
            <dd className="mt-1 leading-5 text-foreground">
              {criterion.evidenceRequired}
            </dd>
          </div>
          <div className="rounded-md border p-3 sm:col-span-2">
            <dt className="text-xs font-medium text-muted-foreground">
              Порог достаточности доказательств
            </dt>
            <dd className="mt-1 leading-5 text-foreground">
              {criterion.evidenceThreshold}
            </dd>
          </div>
        </dl>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-3 text-xs leading-5">
            <p className="font-medium text-foreground">Применимость</p>
            <p className="mt-1 text-muted-foreground">
              {criterion.applicabilityNote}
            </p>
            <p className="mt-2 text-muted-foreground">
              Период критерия: {formatPeriod(criterion.effectiveFrom, criterion.effectiveTo)}
            </p>
          </div>
          {criterion.sourceDivergenceNote ? (
            <div className="rounded-md border border-amber-300/70 bg-amber-50/60 p-3 text-xs leading-5 dark:bg-amber-950/10">
              <p className="font-medium text-foreground">
                Отличие локального бланка от первичного источника
              </p>
              <p className="mt-1 text-muted-foreground">
                {criterion.sourceDivergenceNote}
              </p>
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Допустимые статусы именно для этого критерия
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {criterion.allowedStatuses.map((status) => (
              <li key={status}>
                <Badge variant="outline">{statusLabels[status] ?? status}</Badge>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Первичные нормативные источники
          </p>
          <ul className="mt-2 space-y-2">
            {criterion.normLinks.map((normLink) => (
              <NormReference
                key={`${normLink.regulation.slug}-${normLink.provision.key}-${normLink.regulatoryCheck.key}`}
                normLink={normLink}
              />
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

function SourceCards({ methodology }: { methodology: Methodology }) {
  const unpublishedLocalSource = methodology.sources.some(
    (source) => source.kind === "LOCAL_DOCUMENT" && !source.publicFileUrl,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck2 aria-hidden className="h-4 w-4 text-primary" />
          Источники и правовой статус
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm lg:grid-cols-2">
          <div className="rounded-md bg-muted p-3">
            <dt className="text-xs font-medium text-muted-foreground">
              Библиографическое описание
            </dt>
            <dd className="mt-1 leading-6 text-foreground">
              {methodology.bibliographicCitation}
            </dd>
          </div>
          <div className="rounded-md bg-muted p-3">
            <dt className="text-xs font-medium text-muted-foreground">
              Юридический статус
            </dt>
            <dd className="mt-1 leading-6 text-foreground">
              {methodology.legalStatusNote}
            </dd>
          </div>
        </dl>

        <a
          className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={methodology.officialMethodologyUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Официальный методический первоисточник
          <ExternalLink aria-hidden className="h-4 w-4" />
        </a>

        <ul className="grid gap-3 lg:grid-cols-2">
          {methodology.sources.map((source) => (
            <li className="rounded-md border p-3" key={source.key}>
              <p className="text-xs font-medium text-primary">
                {sourceKindLabels[source.kind] ?? source.kind}
              </p>
              <p className="mt-1 text-sm font-semibold leading-5 text-foreground">
                {source.title}
              </p>
              {source.bibliographicCitation ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {source.bibliographicCitation}
                </p>
              ) : null}
              <dl className="mt-3 space-y-1 text-xs leading-5">
                <div>
                  <dt className="inline text-muted-foreground">Права: </dt>
                  <dd className="inline text-foreground">
                    {rightsLabels[source.rightsBasis] ?? source.rightsBasis}
                  </dd>
                </div>
                {source.rightsVerifiedAt ? (
                  <div>
                    <dt className="inline text-muted-foreground">Проверено: </dt>
                    <dd className="inline text-foreground">
                      {formatDate(source.rightsVerifiedAt)}
                    </dd>
                  </div>
                ) : null}
                {source.sha256 ? (
                  <div>
                    <dt className="text-muted-foreground">SHA-256:</dt>
                    <dd className="break-all font-mono text-[11px] text-foreground">
                      {source.sha256}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {source.sourceUrl ? (
                  <a
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={source.sourceUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Страница первоисточника
                    <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                {source.publicFileUrl ? (
                  <a
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={source.publicFileUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Открыть опубликованный файл
                    <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {unpublishedLocalSource ? (
          <p className="rounded-md border border-amber-300/70 bg-amber-50/60 p-3 text-sm leading-6 text-foreground dark:bg-amber-950/10">
            Полный локальный файл не публикуется до проверки права на его публичное
            размещение. Библиографическая карточка не подтверждает тождество
            экземпляра официальной методике.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MethodologyCard({ methodology }: { methodology: Methodology }) {
  const sourceCriteria = methodology.criteria.filter(
    (criterion) => criterion.isSourceCriterion,
  );
  const prerequisites = methodology.criteria.filter(
    (criterion) => !criterion.isSourceCriterion,
  );
  const groups = new Map<string, { title: string; criteria: Criterion[] }>();

  for (const criterion of sourceCriteria) {
    const group = groups.get(criterion.sectionKey) ?? {
      title: criterion.sectionTitle,
      criteria: [],
    };
    group.criteria.push(criterion);
    groups.set(criterion.sectionKey, group);
  }

  return (
    <article className="space-y-5">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Рабочая методика
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          {methodology.title}
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          {methodology.summary}
        </p>
        {methodology.description ? (
          <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
            {methodology.description}
          </p>
        ) : null}
      </header>

      <SourceCards methodology={methodology} />

      {prerequisites.length ? (
        <section aria-labelledby={`${methodology.slug}-prerequisites`}>
          <div className="mb-3">
            <h3
              className="text-lg font-semibold tracking-tight text-foreground"
              id={`${methodology.slug}-prerequisites`}
            >
              Условия юридической применимости
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Эти условия добавлены системой и не выдаются за строки исходного
              бланка.
            </p>
          </div>
          <div className="space-y-2">
            {prerequisites.map((criterion) => (
              <CriterionCard criterion={criterion} key={criterion.key} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby={`${methodology.slug}-criteria`}>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3
              className="text-lg font-semibold tracking-tight text-foreground"
              id={`${methodology.slug}-criteria`}
            >
              Проверяемые критерии исходного документа
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Все строки доступны в серверном HTML и сгруппированы по разделам
              рабочего инструмента.
            </p>
          </div>
          <Badge variant="muted">{sourceCriteria.length} критериев</Badge>
        </div>

        <div className="space-y-3">
          {[...groups.entries()].map(([sectionKey, group]) => (
            <details className="group rounded-lg border bg-card" key={sectionKey}>
              <summary className="cursor-pointer list-none p-4 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold leading-6 text-foreground">
                    {group.title}
                  </span>
                  <span className="inline-flex shrink-0 items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {group.criteria.length}
                  </span>
                </span>
              </summary>
              <div className="space-y-2 border-t bg-muted/20 p-3 sm:p-4">
                {group.criteria.map((criterion) => (
                  <CriterionCard criterion={criterion} key={criterion.key} />
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}

export function IndependentControlMethodologies({
  methodologies,
}: {
  methodologies: Methodology[];
}) {
  if (!methodologies.length) {
    return (
      <p className="rounded-lg border bg-card p-5 text-sm leading-6 text-muted-foreground">
        Публичных методик, прошедших проверку доказательной допустимости, пока нет.
        Непроверенные карточки и внутренние материалы здесь не показываются.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5 shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex gap-3">
            <Scale aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-foreground">
                Методика не является законом и не доказывает нарушение
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Рабочий бланк не является нормативным правовым актом. Каждый его
                критерий проверяется по применимому первичному источнику и периоду.
              </p>
            </div>
          </div>
          <ol className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
            {[
              "Норма или методический критерий",
              "Нейтральный check question",
              "Первичное доказательство обеих версий",
              "Статус после evidence-validation",
            ].map((step, index) => (
              <li className="rounded-md border bg-card p-3" key={step}>
                <span className="text-xs font-medium text-primary">
                  Шаг {index + 1}
                </span>
                <span className="mt-1 block leading-5 text-foreground">{step}</span>
              </li>
            ))}
          </ol>
          <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
            <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Отсутствие документа или результата поиска не считается нарушением
            автоматически. Для оценки ищутся как подтверждающие, так и
            опровергающие доказательства. В общем словаре используются статусы:
            Подтверждено, Вероятное несоответствие, Требует проверки, Не
            подтверждено, Соответствует; в карточке каждого критерия показано только
            допустимое для него подмножество.
          </p>
        </CardContent>
      </Card>

      {methodologies.map((methodology) => (
        <MethodologyCard methodology={methodology} key={methodology.slug} />
      ))}
    </div>
  );
}
