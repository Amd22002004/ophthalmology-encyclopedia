import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Filter,
  Scale,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EntityHeader } from "@/components/entity/entity-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type RegulationDateValue = string | Date | null | undefined;

export type RegulationCatalogTopic = {
  slug: string;
  title: string;
  description?: string | null;
  count: number;
};

export type RegulationCatalogItem = {
  slug: string;
  title: string;
  summary?: string | null;
  documentType?: string | null;
  number?: string | null;
  issuingAuthority?: string | null;
  legalStatus: string;
  effectiveFrom?: RegulationDateValue;
  effectiveTo?: RegulationDateValue;
  officialPublicationUrl?: string | null;
  topics: Array<Pick<RegulationCatalogTopic, "slug" | "title">>;
  provisionCount: number;
  checkCount: number;
};

export type RegulationsCatalogProps = {
  topics: RegulationCatalogTopic[];
  regulations: RegulationCatalogItem[];
  activeTopic?: string | null;
  activeStatus?: string | null;
  activeDate?: string | null;
};

const statusLabels: Record<string, string> = {
  DRAFT: "Проект",
  IN_FORCE: "Действует",
  FUTURE: "Вступит в силу",
  EXPIRED: "Утратил силу",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function validDate(value: RegulationDateValue): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: RegulationDateValue): string | null {
  const date = validDate(value);
  return date ? dateFormatter.format(date) : null;
}

function formatPeriod(
  effectiveFrom: RegulationDateValue,
  effectiveTo: RegulationDateValue,
): string {
  const from = formatDate(effectiveFrom);
  const to = formatDate(effectiveTo);

  if (from && to) return `с ${from} по ${to}`;
  if (from) return `с ${from}`;
  if (to) return `до ${to}`;
  return "Период действия уточняется";
}

function pluralize(
  count: number,
  forms: [singular: string, paucal: string, plural: string],
): string {
  const absolute = Math.abs(count) % 100;
  const lastDigit = absolute % 10;

  if (absolute > 10 && absolute < 20) return `${count} ${forms[2]}`;
  if (lastDigit === 1) return `${count} ${forms[0]}`;
  if (lastDigit > 1 && lastDigit < 5) return `${count} ${forms[1]}`;
  return `${count} ${forms[2]}`;
}

function regulationHref(slug: string): string {
  return `/regulations/${encodeURIComponent(slug)}`;
}

function filterHref({
  topic,
  status,
  date,
}: {
  topic?: string | null;
  status?: string | null;
  date?: string | null;
}): string {
  const params = new URLSearchParams();
  if (topic) params.set("topic", topic);
  if (status) params.set("status", status);
  if (date) params.set("date", date);
  const query = params.toString();
  return query ? `/regulations?${query}` : "/regulations";
}

function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] ?? status;

  if (status === "IN_FORCE") return <Badge>{label}</Badge>;
  if (status === "EXPIRED") return <Badge variant="muted">{label}</Badge>;
  if (status === "FUTURE") return <Badge variant="secondary">{label}</Badge>;
  return <Badge variant="outline">{label}</Badge>;
}

export function RegulationsCatalog({
  topics,
  regulations,
  activeTopic,
  activeStatus,
  activeDate,
}: RegulationsCatalogProps) {
  const selectedTopic = topics.find((topic) => topic.slug === activeTopic);
  const hasFilters = Boolean(activeTopic || activeStatus || activeDate);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Нормативная база" }]} />
      <EntityHeader
        description="Официальные правовые требования, периоды их действия и проверочные вопросы для аудита медицинской деятельности."
        eyebrow="Рабочий нормативный граф"
        title="Нормативная база"
      />

      <Card className="border-primary/30 bg-primary/5 shadow-none">
        <CardContent className="flex gap-3 p-4 text-sm leading-6">
          <Scale aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground">Нейтральная правовая основа</p>
            <p className="mt-1 text-muted-foreground">
              Раздел отвечает на вопросы «какое требование действует, когда и чем
              его проверить». Он не содержит выводов о соблюдении требований
              конкретными организациями. Отсутствие документа или результата в
              реестре само по себе не доказывает нарушение.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <form action="/regulations" method="get">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto] xl:items-end">
              <label className="space-y-1.5 text-sm font-medium" htmlFor="regulations-topic">
                Тема проверки
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  defaultValue={activeTopic ?? ""}
                  id="regulations-topic"
                  name="topic"
                >
                  <option value="">Все темы</option>
                  {topics.map((topic) => (
                    <option key={topic.slug} value={topic.slug}>
                      {topic.title} ({topic.count})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm font-medium" htmlFor="regulations-status">
                Правовой статус
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  defaultValue={activeStatus ?? ""}
                  id="regulations-status"
                  name="status"
                >
                  <option value="">Все статусы</option>
                  <option value="IN_FORCE">Действует</option>
                  <option value="FUTURE">Вступит в силу</option>
                  <option value="EXPIRED">Утратил силу</option>
                </select>
              </label>

              <label className="space-y-1.5 text-sm font-medium" htmlFor="regulations-date">
                Действовало на дату
                <Input
                  defaultValue={activeDate ?? ""}
                  id="regulations-date"
                  name="date"
                  type="date"
                />
              </label>

              <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-1">
                <Button className="flex-1 xl:flex-none" type="submit">
                  <Filter aria-hidden="true" className="h-4 w-4" />
                  Применить
                </Button>
                {hasFilters ? (
                  <Button asChild variant="outline">
                    <Link href="/regulations">Сбросить</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </form>

          {selectedTopic?.description ? (
            <p className="mt-3 border-t pt-3 text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">{selectedTopic.title}:</span>{" "}
              {selectedTopic.description}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Найдено: <span className="font-medium text-foreground">{regulations.length}</span>
        </p>
        {activeDate ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            Учитывается редакция на {formatDate(activeDate) ?? activeDate}
          </p>
        ) : null}
      </div>

      {regulations.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {regulations.map((regulation) => (
            <li key={regulation.slug}>
              <Card className="flex h-full flex-col transition-colors hover:border-primary/40">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={regulation.legalStatus} />
                    {regulation.documentType ? (
                      <Badge variant="outline">{regulation.documentType}</Badge>
                    ) : null}
                  </div>
                  <CardTitle className="pt-1 leading-6">
                    <Link
                      className="rounded-sm underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      href={regulationHref(regulation.slug)}
                    >
                      {regulation.title}
                    </Link>
                  </CardTitle>
                  {regulation.number || regulation.issuingAuthority ? (
                    <p className="text-xs leading-5 text-muted-foreground">
                      {[regulation.number, regulation.issuingAuthority]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <CardDescription className="leading-6">
                    {regulation.summary ??
                      "Карточка содержит применимые положения и вопросы для документальной проверки."}
                  </CardDescription>

                  <dl className="grid gap-2 text-xs">
                    <div>
                      <dt className="font-medium text-foreground">Период действия</dt>
                      <dd className="mt-0.5 text-muted-foreground">
                        {formatPeriod(regulation.effectiveFrom, regulation.effectiveTo)}
                      </dd>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                      <div>
                        <dt className="sr-only">Количество положений</dt>
                        <dd>
                          {pluralize(regulation.provisionCount, [
                            "положение",
                            "положения",
                            "положений",
                          ])}
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">Количество проверочных вопросов</dt>
                        <dd>
                          {pluralize(regulation.checkCount, [
                            "вопрос",
                            "вопроса",
                            "вопросов",
                          ])}
                        </dd>
                      </div>
                    </div>
                  </dl>

                  {regulation.topics.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {regulation.topics.map((topic) => (
                        <Link
                          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          href={filterHref({
                            topic: topic.slug,
                            status: activeStatus,
                            date: activeDate,
                          })}
                          key={topic.slug}
                        >
                          <Badge className="hover:bg-muted/80" variant="muted">
                            {topic.title}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                    <Link
                      className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      href={regulationHref(regulation.slug)}
                    >
                      Открыть карточку
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                    {regulation.officialPublicationUrl ? (
                      <a
                        className="inline-flex items-center gap-1.5 rounded-sm text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        href={regulation.officialPublicationUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Официальный источник
                        <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
            <Scale aria-hidden="true" className="h-8 w-8 text-primary" />
            <h2 className="mt-3 text-base font-semibold">Нормы не найдены</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Измените тему, статус или дату проверки. В результатах показываются
              только опубликованные нормативные карточки с проверочными вопросами.
            </p>
            {hasFilters ? (
              <Button asChild className="mt-4" size="sm" variant="outline">
                <Link href="/regulations">Сбросить фильтры</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
