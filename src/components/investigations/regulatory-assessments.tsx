import Link from "next/link";
import { ExternalLink, SearchCheck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isPubliclyHiddenInvestigationDocument } from "@/lib/investigation-documents";
import type { InvestigationDetail } from "@/lib/loaders";

type Props = {
  investigationSlug: string;
  instances: InvestigationDetail["equipmentInstances"];
  assessments: InvestigationDetail["regulatoryAssessments"];
  registryChecks: InvestigationDetail["registryChecks"];
};

const statusLabels: Record<string, string> = {
  CONFIRMED: "Подтверждено",
  LIKELY_NON_COMPLIANCE: "Вероятное несоответствие",
  REQUIRES_VERIFICATION: "Требует проверки",
  NOT_CONFIRMED: "Не подтверждено",
  COMPLIANT: "Соответствует",
};

const evidenceRoleLabels: Record<string, string> = {
  SUPPORTS: "Подтверждает проверяемый факт",
  REFUTES: "Опровергает или ограничивает вывод",
  CONTEXT: "Контекст",
};

const registryResultLabels: Record<string, string> = {
  MATCH: "Найдена запись по сохранённому запросу",
  NO_MATCH: "По сохранённому запросу результат не найден",
  AMBIGUOUS: "Результат неоднозначен",
  UNAVAILABLE: "Сервис был недоступен",
};

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function RegistryCheckCard({
  check,
}: {
  check: InvestigationDetail["registryChecks"][number];
}) {
  return (
    <li className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-foreground">{check.registryName}</p>
        <Badge variant="outline">{formatDate(check.searchedAt)}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Запрос: {check.query}</p>
      <p className="mt-2 leading-6 text-foreground">
        {registryResultLabels[check.result] ?? check.result}: {check.resultSummary}
      </p>
      {check.result === "NO_MATCH" ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Это фиксирует только результат конкретного поиска и не доказывает отсутствие
          регистрации или нарушение.
        </p>
      ) : null}
      <a
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        href={check.officialUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        Открыть официальный реестр
        <ExternalLink aria-hidden className="h-3.5 w-3.5" />
      </a>
    </li>
  );
}

export function RegulatoryAssessments({
  investigationSlug,
  instances,
  assessments,
  registryChecks,
}: Props) {
  if (!instances.length && !assessments.length && !registryChecks.length) return null;

  return (
    <section className="space-y-5" id="regulatory-analysis">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Нормативная проверка</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Норма применяется к конкретному факту и периоду. Возраст аппарата,
          прекращение выпуска, сообщение третьей стороны или отсутствие результата
          одного поиска сами по себе не являются доказательством нарушения.
        </p>
      </div>

      {instances.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Конкретные экземпляры</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {instances.map((instance) => {
              const publicIdentificationEvidence = instance.identificationEvidence.filter(
                (evidence) =>
                  !isPubliclyHiddenInvestigationDocument(investigationSlug, evidence.document),
              );

              return (
                <article
                  className="rounded-md border p-3"
                  id={`equipment-instance-${instance.id}`}
                  key={instance.id}
                >
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Объект материалов проверки
                </p>
                <h3 className="mt-1 font-semibold">{instance.model}</h3>
                <dl className="mt-3 grid gap-2 text-sm">
                  {instance.serialNumber ? (
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Заводской номер:</dt>
                      <dd>{instance.serialNumber}</dd>
                    </div>
                  ) : null}
                  {instance.manufactureYear ? (
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Год выпуска:</dt>
                      <dd>{instance.manufactureYear}</dd>
                    </div>
                  ) : null}
                  {instance.manufacturer ? (
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Производитель:</dt>
                      <dd>{instance.manufacturer}</dd>
                    </div>
                  ) : null}
                </dl>
                {instance.identificationSummary ? (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {instance.identificationSummary}
                  </p>
                ) : null}
                {publicIdentificationEvidence.length ? (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Первичные документы идентификации
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {publicIdentificationEvidence.map((evidence) => (
                        <li key={evidence.document.slug}>
                          <a
                            className="font-medium text-primary hover:underline"
                            href={`#document-${evidence.document.slug}`}
                          >
                            {evidence.document.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {instance.equipment ? (
                  <Link
                    className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                    href={`/equipment/${instance.equipment.slug}`}
                  >
                    Карточка модели →
                  </Link>
                ) : null}
                </article>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {assessments.length ? (
        <div className="space-y-4">
          {assessments.map((assessment) => {
            const provision = assessment.regulatoryCheck.provision;
            const regulation = provision.edition.regulation;
            const publicEvidence = assessment.evidence.filter(
              (item) => !isPubliclyHiddenInvestigationDocument(investigationSlug, item.document),
            );
            return (
              <Card key={assessment.id}>
                <CardHeader className="border-b">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-primary">{provision.locator}</p>
                      <CardTitle className="mt-1 leading-6">
                        {assessment.regulatoryCheck.question}
                      </CardTitle>
                    </div>
                    <Badge variant={assessment.status === "COMPLIANT" ? "secondary" : "outline"}>
                      {statusLabels[assessment.status] ?? assessment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link className="font-medium text-primary hover:underline" href={`/regulations/${regulation.slug}`}>
                      {regulation.number ?? regulation.title}
                    </Link>
                    <span className="text-muted-foreground">
                      Период события: {assessment.eventDateLabel ?? "требует уточнения"}
                    </span>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs font-medium text-muted-foreground">Нейтральный вывод</p>
                    <p className="mt-1 text-sm leading-6">{assessment.neutralConclusion}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <p className="text-xs font-medium text-muted-foreground">Альтернативная версия</p>
                      <p className="mt-1 text-sm leading-6">{assessment.alternativeVersion}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs font-medium text-muted-foreground">Что ещё требуется</p>
                      <p className="mt-1 text-sm leading-6">
                        {assessment.evidenceGaps ?? "Дополнительные пробелы не зафиксированы."}
                      </p>
                    </div>
                  </div>
                  {publicEvidence.length ? (
                    <ul className="space-y-2">
                      {publicEvidence.map((item) => (
                        <li className="text-sm" key={item.documentId}>
                          <a className="font-medium text-primary hover:underline" href={`#document-${item.document.slug}`}>
                            {item.document.title}
                          </a>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {evidenceRoleLabels[item.role] ?? item.role}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {assessment.registryChecks.length ? (
                    <ul className="space-y-2">
                      {assessment.registryChecks.map((check) => (
                        <RegistryCheckCard check={check} key={check.id} />
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {registryChecks.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchCheck aria-hidden className="h-4 w-4 text-primary" />
              Зафиксированные проверки реестров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {registryChecks.map((check) => (
                <RegistryCheckCard check={check} key={check.id} />
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <p className="flex gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
        <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Публично показаны только оценки с завершённой evidence-validation. Черновые
        гипотезы и внутренний ход проверки остаются закрытыми.
      </p>
    </section>
  );
}
