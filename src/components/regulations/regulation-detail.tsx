import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Link2,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TemplateShell } from "@/components/templates/template-shell";

export type RegulationDetailDateValue = string | Date | null | undefined;

export type RegulationDetailTopic = {
  slug: string;
  title: string;
  description?: string | null;
};

export type RegulationDetailSource = {
  title: string;
  url: string;
  kind?: string | null;
  isOfficial?: boolean;
  sourceDate?: RegulationDetailDateValue;
  accessedAt?: RegulationDetailDateValue;
};

export type RegulationDetailCheck = {
  key: string;
  question: string;
  factToEstablish: string;
  primaryEvidenceType: string;
  officialSearchUrl?: string | null;
  officialSearchLabel?: string | null;
  applicabilityNote?: string | null;
  evidenceThreshold?: string | null;
  nonCompliancePattern?: string | null;
};

export type RegulationDetailEquipmentRequirement = {
  stableKey: string;
  appendix: string;
  subsection?: string | null;
  tableTitle?: string | null;
  position: string;
  deviceTypeCode?: string | null;
  regulatoryName: string;
  displayName?: string | null;
  quantity: string;
  applicabilityCondition?: string | null;
};

export type RegulationDetailProvision = {
  key: string;
  locator: string;
  title: string;
  requirement: string;
  applicability: string;
  effectiveFrom?: RegulationDetailDateValue;
  effectiveTo?: RegulationDetailDateValue;
  topic?: Pick<RegulationDetailTopic, "slug" | "title"> | null;
  checks: RegulationDetailCheck[];
  equipmentRequirements: RegulationDetailEquipmentRequirement[];
};

export type RegulationDetailEdition = {
  key: string;
  title?: string | null;
  effectiveFrom: RegulationDetailDateValue;
  effectiveTo?: RegulationDetailDateValue;
  legalStatus: string;
  transitionNote?: string | null;
  officialTextUrl?: string | null;
  sources?: RegulationDetailSource[];
  provisions: RegulationDetailProvision[];
};

export type RelatedRegulationSummary = {
  slug: string;
  title: string;
  documentType?: string | null;
  number?: string | null;
};

export type RegulationOutgoingRelation = {
  type: string;
  legalEffectFrom?: RegulationDetailDateValue;
  note?: string | null;
  officialSourceUrl?: string | null;
  targetRegulation: RelatedRegulationSummary;
};

export type RegulationIncomingRelation = {
  type: string;
  legalEffectFrom?: RegulationDetailDateValue;
  note?: string | null;
  officialSourceUrl?: string | null;
  sourceRegulation: RelatedRegulationSummary;
};

export type RegulationDetailData = {
  slug: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  documentType?: string | null;
  number?: string | null;
  adoptedAt?: RegulationDetailDateValue;
  issuingAuthority?: string | null;
  jurisdiction?: string | null;
  officialPublicationUrl?: string | null;
  legalStatus: string;
  effectiveFrom?: RegulationDetailDateValue;
  effectiveTo?: RegulationDetailDateValue;
  sources: RegulationDetailSource[];
  topics: RegulationDetailTopic[];
  editions: RegulationDetailEdition[];
  outgoingRelations: RegulationOutgoingRelation[];
  incomingRelations: RegulationIncomingRelation[];
};

export type RegulationDetailProps = {
  regulation: RegulationDetailData;
};

const statusLabels: Record<string, string> = {
  DRAFT: "Проект",
  IN_FORCE: "Действует",
  FUTURE: "Вступит в силу",
  EXPIRED: "Утратил силу",
};

const sourceKindLabels: Record<string, string> = {
  OFFICIAL_PUBLICATION: "Официальное опубликование",
  OFFICIAL_CONSOLIDATED_TEXT: "Официальная редакция",
  OFFICIAL_REGISTER: "Официальный реестр",
  OFFICIAL_GUIDANCE: "Официальное разъяснение",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function validDate(value: RegulationDetailDateValue): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: RegulationDetailDateValue): string | null {
  const date = validDate(value);
  return date ? dateFormatter.format(date) : null;
}

function dateTimeValue(value: RegulationDetailDateValue): string | undefined {
  const date = validDate(value);
  return date?.toISOString();
}

function formatPeriod(
  effectiveFrom: RegulationDetailDateValue,
  effectiveTo: RegulationDetailDateValue,
): string {
  const from = formatDate(effectiveFrom);
  const to = formatDate(effectiveTo);

  if (from && to) return `с ${from} по ${to}`;
  if (from) return `с ${from}`;
  if (to) return `до ${to}`;
  return "Период действия уточняется";
}

function relationLabel(type: string, direction: "incoming" | "outgoing"): string {
  const outgoingLabels: Record<string, string> = {
    AMENDS: "Изменяет",
    REPEALS: "Признаёт утратившим силу",
    REPLACES: "Заменяет",
    EXTENDS: "Продлевает действие",
    IMPLEMENTS: "Реализует положения",
  };
  const incomingLabels: Record<string, string> = {
    AMENDS: "Изменяется документом",
    REPEALS: "Утрачивает силу по документу",
    REPLACES: "Заменён документом",
    EXTENDS: "Действие продлено документом",
    IMPLEMENTS: "Реализуется документом",
  };

  return (direction === "outgoing" ? outgoingLabels : incomingLabels)[type] ??
    type.toLocaleLowerCase("ru-RU").replaceAll("_", " ");
}

function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] ?? status;

  if (status === "IN_FORCE") return <Badge>{label}</Badge>;
  if (status === "EXPIRED") return <Badge variant="muted">{label}</Badge>;
  if (status === "FUTURE") return <Badge variant="secondary">{label}</Badge>;
  return <Badge variant="outline">{label}</Badge>;
}

function DefinitionRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-0.5 border-b py-2.5 last:border-b-0 sm:grid-cols-[110px_minmax(0,1fr)] xl:grid-cols-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

function SourceLink({ source }: { source: RegulationDetailSource }) {
  const sourceDate = formatDate(source.sourceDate);
  const kindLabel = source.kind
    ? sourceKindLabels[source.kind] ?? source.kind
    : source.isOfficial === false
      ? "Дополнительный источник"
      : "Официальный источник";

  return (
    <li>
      <a
        className="group block rounded-md border px-3 py-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={source.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium leading-5 text-foreground group-hover:text-primary">
            {source.title}
          </span>
          <ExternalLink
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          />
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {kindLabel}
          {sourceDate ? ` · ${sourceDate}` : ""}
        </span>
      </a>
    </li>
  );
}

function EquipmentRequirementsTable({
  requirements,
  provisionTitle,
}: {
  requirements: RegulationDetailEquipmentRequirement[];
  provisionTitle: string;
}) {
  if (!requirements.length) return null;

  return (
    <details className="group rounded-md border bg-card" open={requirements.length <= 6}>
      <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-foreground marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <span className="flex items-center justify-between gap-3">
          <span>Таблица требований к оснащению</span>
          <Badge variant="muted">{requirements.length}</Badge>
        </span>
      </summary>
      <div className="overflow-x-auto border-t">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Требования к оснащению для положения «{provisionTitle}»
          </caption>
          <thead className="bg-muted/70 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium" scope="col">
                Позиция
              </th>
              <th className="px-3 py-2 font-medium" scope="col">
                Наименование
              </th>
              <th className="px-3 py-2 font-medium" scope="col">
                Код вида
              </th>
              <th className="px-3 py-2 font-medium" scope="col">
                Количество
              </th>
              <th className="px-3 py-2 font-medium" scope="col">
                Условие применения
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {requirements.map((requirement) => (
              <tr className="align-top" key={requirement.stableKey}>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                  {requirement.position}
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-medium text-foreground">
                    {requirement.displayName ?? requirement.regulatoryName}
                  </span>
                  {requirement.displayName ? (
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {requirement.regulatoryName}
                    </span>
                  ) : null}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Приложение {requirement.appendix}
                    {requirement.subsection ? ` · ${requirement.subsection}` : ""}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {requirement.deviceTypeCode ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-foreground">{requirement.quantity}</td>
                <td className="max-w-xs px-3 py-2.5 leading-5 text-muted-foreground">
                  {requirement.applicabilityCondition ?? "Без дополнительного условия"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function RelationItem({
  direction,
  relation,
}: {
  direction: "incoming" | "outgoing";
  relation: RegulationIncomingRelation | RegulationOutgoingRelation;
}) {
  const related =
    direction === "incoming"
      ? (relation as RegulationIncomingRelation).sourceRegulation
      : (relation as RegulationOutgoingRelation).targetRegulation;
  const effectDate = formatDate(relation.legalEffectFrom);

  return (
    <li className="rounded-md border p-3">
      <p className="text-xs font-medium text-primary">
        {relationLabel(relation.type, direction)}
        {effectDate ? ` с ${effectDate}` : ""}
      </p>
      <Link
        className="mt-1 block rounded-sm text-sm font-medium leading-5 text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={`/regulations/${encodeURIComponent(related.slug)}`}
      >
        {related.title}
      </Link>
      {related.documentType || related.number ? (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {[related.documentType, related.number].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {relation.note ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{relation.note}</p>
      ) : null}
      {relation.officialSourceUrl ? (
        <a
          className="mt-2 inline-flex items-center gap-1 rounded-sm text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={relation.officialSourceUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Основание связи
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      ) : null}
    </li>
  );
}

export function RegulationDetail({ regulation }: RegulationDetailProps) {
  const statusLabel = statusLabels[regulation.legalStatus] ?? regulation.legalStatus;
  const badges = [
    statusLabel,
    regulation.documentType,
    regulation.number,
    formatPeriod(regulation.effectiveFrom, regulation.effectiveTo),
  ].filter((value): value is string => Boolean(value));

  const sources = regulation.sources;
  const adoptedAt = formatDate(regulation.adoptedAt);

  return (
    <TemplateShell
      badges={badges}
      breadcrumbs={[
        { href: "/regulations", label: "Нормативная база" },
        { label: regulation.title },
      ]}
      description={
        regulation.summary ??
        "Нормативный документ с периодами действия, применимыми положениями и вопросами для документальной проверки."
      }
      eyebrow="Нормативный документ"
      title={regulation.title}
    >
      <Card className="border-primary/30 bg-primary/5 shadow-none">
        <CardContent className="flex gap-3 p-4 text-sm leading-6">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
          />
          <div>
            <p className="font-medium text-foreground">Граница применения</p>
            <p className="mt-1 text-muted-foreground">
              Карточка описывает только содержание нормы и способ её проверки.
              Вывод о соблюдении возможен лишь после проверки редакции на дату
              события, первичных документов, а также подтверждающих и опровергающих
              материалов.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {regulation.content ? (
            <Card>
              <CardHeader>
                <CardTitle>О документе</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {regulation.content}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {regulation.editions.length ? (
            <section aria-labelledby="regulation-editions-heading" className="space-y-4">
              <div>
                <h2
                  className="text-lg font-semibold tracking-tight text-foreground"
                  id="regulation-editions-heading"
                >
                  Редакции и проверяемые положения
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Для каждой нормы указан самостоятельный период действия. При
                  исторической проверке применяется редакция, действовавшая на дату
                  события.
                </p>
              </div>

              {regulation.editions.map((edition, editionIndex) => (
                <Card key={edition.key}>
                  <CardHeader className="border-b pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-primary">
                          Редакция · {formatPeriod(edition.effectiveFrom, edition.effectiveTo)}
                        </p>
                        <CardTitle
                          className="mt-1.5 leading-6"
                          id={`regulation-edition-${editionIndex}`}
                        >
                          {edition.title ?? regulation.title}
                        </CardTitle>
                      </div>
                      <StatusBadge status={edition.legalStatus} />
                    </div>
                    {edition.transitionNote ? (
                      <p className="pt-1 text-sm leading-6 text-muted-foreground">
                        {edition.transitionNote}
                      </p>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {edition.provisions.map((provision, provisionIndex) => (
                      <article
                        aria-labelledby={`regulation-provision-${editionIndex}-${provisionIndex}`}
                        className="space-y-4 border-b pb-5 last:border-b-0 last:pb-0"
                        key={provision.key}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{provision.locator}</Badge>
                            {provision.topic ? (
                              <Link
                                className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                href={`/regulations?topic=${encodeURIComponent(provision.topic.slug)}`}
                              >
                                <Badge className="hover:bg-muted/80" variant="muted">
                                  {provision.topic.title}
                                </Badge>
                              </Link>
                            ) : null}
                          </div>
                          <h3
                            className="mt-2 text-base font-semibold leading-6 text-foreground"
                            id={`regulation-provision-${editionIndex}-${provisionIndex}`}
                          >
                            {provision.title}
                          </h3>
                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">
                            {provision.requirement}
                          </p>
                        </div>

                        <dl className="grid gap-3 rounded-md bg-muted p-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-medium text-muted-foreground">
                              Применимость
                            </dt>
                            <dd className="mt-1 leading-5 text-foreground">
                              {provision.applicability}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-muted-foreground">
                              Период нормы
                            </dt>
                            <dd className="mt-1 leading-5 text-foreground">
                              {formatPeriod(
                                provision.effectiveFrom ?? edition.effectiveFrom,
                                provision.effectiveTo ?? edition.effectiveTo,
                              )}
                            </dd>
                          </div>
                        </dl>

                        {provision.checks.length ? (
                          <section
                            aria-labelledby={`regulation-checks-${editionIndex}-${provisionIndex}`}
                            className="space-y-3"
                          >
                            <h4
                              className="flex items-center gap-2 text-sm font-semibold text-foreground"
                              id={`regulation-checks-${editionIndex}-${provisionIndex}`}
                            >
                              <CheckCircle2
                                aria-hidden="true"
                                className="h-4 w-4 text-primary"
                              />
                              Нейтральные вопросы для проверки
                            </h4>
                            <ol className="space-y-3">
                              {provision.checks.map((check) => (
                                <li className="rounded-md border p-3" key={check.key}>
                                  <p className="text-sm font-medium leading-6 text-foreground">
                                    {check.question}
                                  </p>
                                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                                    <div>
                                      <dt className="text-xs font-medium text-muted-foreground">
                                        Что установить
                                      </dt>
                                      <dd className="mt-1 leading-5 text-foreground">
                                        {check.factToEstablish}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="text-xs font-medium text-muted-foreground">
                                        Первичный документ
                                      </dt>
                                      <dd className="mt-1 leading-5 text-foreground">
                                        {check.primaryEvidenceType}
                                      </dd>
                                    </div>
                                  </dl>
                                  {check.evidenceThreshold ? (
                                    <div className="mt-3 rounded-md bg-muted p-3">
                                      <p className="text-xs font-medium text-muted-foreground">
                                        Порог достаточности доказательств
                                      </p>
                                      <p className="mt-1 text-sm leading-5 text-foreground">
                                        {check.evidenceThreshold}
                                      </p>
                                    </div>
                                  ) : null}
                                  {check.nonCompliancePattern ? (
                                    <div className="mt-3 rounded-md border p-3">
                                      <p className="text-xs font-medium text-muted-foreground">
                                        Паттерн для проверки — не вывод о клинике
                                      </p>
                                      <p className="mt-1 text-sm leading-5 text-foreground">
                                        {check.nonCompliancePattern}
                                      </p>
                                    </div>
                                  ) : null}
                                  {check.applicabilityNote ? (
                                    <p className="mt-3 border-t pt-3 text-xs leading-5 text-muted-foreground">
                                      {check.applicabilityNote}
                                    </p>
                                  ) : null}
                                  {check.officialSearchUrl ? (
                                    <a
                                      className="mt-3 inline-flex items-center gap-1.5 rounded-sm text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                      href={check.officialSearchUrl}
                                      rel="noopener noreferrer"
                                      target="_blank"
                                    >
                                      {check.officialSearchLabel ?? "Проверить в официальном источнике"}
                                      <ExternalLink aria-hidden="true" className="h-4 w-4" />
                                    </a>
                                  ) : null}
                                </li>
                              ))}
                            </ol>
                          </section>
                        ) : null}

                        <EquipmentRequirementsTable
                          provisionTitle={provision.title}
                          requirements={provision.equipmentRequirements}
                        />
                      </article>
                    ))}

                    {edition.sources?.length ? (
                      <div className="border-t pt-4">
                        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <FileCheck2 aria-hidden="true" className="h-4 w-4 text-primary" />
                          Источники этой редакции
                        </p>
                        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                          {edition.sources.map((source) => (
                            <SourceLink key={source.url} source={source} />
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Статус и реквизиты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <StatusBadge status={regulation.legalStatus} />
              </div>
              <dl>
                {regulation.documentType ? (
                  <DefinitionRow label="Вид документа">{regulation.documentType}</DefinitionRow>
                ) : null}
                {regulation.number ? (
                  <DefinitionRow label="Номер">{regulation.number}</DefinitionRow>
                ) : null}
                {adoptedAt ? (
                  <DefinitionRow label="Принят">
                    <time dateTime={dateTimeValue(regulation.adoptedAt)}>{adoptedAt}</time>
                  </DefinitionRow>
                ) : null}
                {regulation.issuingAuthority ? (
                  <DefinitionRow label="Орган">{regulation.issuingAuthority}</DefinitionRow>
                ) : null}
                {regulation.jurisdiction ? (
                  <DefinitionRow label="Юрисдикция">{regulation.jurisdiction}</DefinitionRow>
                ) : null}
                <DefinitionRow label="Действие">
                  {formatPeriod(regulation.effectiveFrom, regulation.effectiveTo)}
                </DefinitionRow>
              </dl>
            </CardContent>
          </Card>

          {sources.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck2 aria-hidden="true" className="h-4 w-4 text-primary" />
                  Официальные источники
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {sources.map((source) => (
                    <SourceLink key={source.url} source={source} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {regulation.topics.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Темы проверки</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {regulation.topics.map((topic) => (
                    <li key={topic.slug}>
                      <Link
                        className="block rounded-md border px-3 py-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        href={`/regulations?topic=${encodeURIComponent(topic.slug)}`}
                      >
                        <span className="text-sm font-medium text-foreground">
                          {topic.title}
                        </span>
                        {topic.description ? (
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {topic.description}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {regulation.outgoingRelations.length || regulation.incomingRelations.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 aria-hidden="true" className="h-4 w-4 text-primary" />
                  Связи документов
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {regulation.outgoingRelations.map((relation) => (
                    <RelationItem
                      direction="outgoing"
                      key={`outgoing-${relation.type}-${relation.targetRegulation.slug}-${dateTimeValue(relation.legalEffectFrom) ?? ""}`}
                      relation={relation}
                    />
                  ))}
                  {regulation.incomingRelations.map((relation) => (
                    <RelationItem
                      direction="incoming"
                      key={`incoming-${relation.type}-${relation.sourceRegulation.slug}-${dateTimeValue(relation.legalEffectFrom) ?? ""}`}
                      relation={relation}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <Card className="shadow-none">
            <CardContent className="flex gap-3 p-4 text-xs leading-5 text-muted-foreground">
              <Scale aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                Проверочный вопрос определяет, какой факт нужно установить и каким
                первичным документом его подтвердить. Он не является выводом о
                нарушении.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </TemplateShell>
  );
}
