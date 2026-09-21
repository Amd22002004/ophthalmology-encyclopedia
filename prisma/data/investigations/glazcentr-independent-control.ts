import type { IndependentControlCriterion } from "../independent-control/types";

export type IndependentControlAssessmentSeed = {
  key: string;
  criterionKey: string;
  status: "REQUIRES_VERIFICATION";
  applicabilityStatus: "REQUIRES_VERIFICATION";
  restrictedSignals: readonly string[];
  eventDateLabel: string;
  neutralConclusion: string;
  alternativeVersion: string;
  evidenceGaps: string;
  supportingEvidenceSearchCompleted: false;
  refutingEvidenceSearchCompleted: false;
  isPublished: boolean;
  evidenceValidatedAt: Date | null;
  publishedAt: Date | null;
};

export const GLAZCENTR_INDEPENDENT_CONTROL = {
  investigationSlug: "proverka-oborudovaniya-glaztsentr-tyumen",
  clinicSlug: "glaztsentr-tyumen",
  contextDocumentSlug: "appeal-to-depzdrav",
} as const;

export function buildPrivateGlazcentrSourceAssessments(
  criteria: readonly IndependentControlCriterion[],
): IndependentControlAssessmentSeed[] {
  return criteria
    .filter((criterion) => criterion.isSourceCriterion === true)
    .map((criterion) => ({
      key: `observation-form-${criterion.stableKey}`,
      criterionKey: criterion.stableKey,
      status: "REQUIRES_VERIFICATION",
      applicabilityStatus: "REQUIRES_VERIFICATION",
      restrictedSignals: [],
      eventDateLabel: "Период, канал и фактическое состояние требуют подтверждения первичными документами",
      neutralConclusion:
        `По критерию ${criterion.sourceLocator} «${criterion.title}» факт применимости и фактическое состояние не установлены. Это внутренний вопрос для проверки, а не вывод о нарушении.`,
      alternativeVersion:
        `Требуемая информация, условие или доступный способ могли существовать в ином канале, месте либо периоде, не охваченном полученными материалами; сам критерий мог быть неприменим к услуге или организации.`,
      evidenceGaps:
        `Не получены относимые к точному юридическому лицу и периоду материалы: ${criterion.confirmingPrimaryDocument} Требуется отдельно проверить: ${criterion.evidenceRequired}`,
      supportingEvidenceSearchCompleted: false,
      refutingEvidenceSearchCompleted: false,
      isPublished: false,
      evidenceValidatedAt: null,
      publishedAt: null,
    }));
}

export const GLAZCENTR_FORMAL_NOC_SCOPE_ASSESSMENT: IndependentControlAssessmentSeed & {
  contextDocumentSlug: string;
} = {
  key: "formal-noc-scope",
  criterionKey: "formal-noc-scope",
  status: "REQUIRES_VERIFICATION",
  applicabilityStatus: "REQUIRES_VERIFICATION",
  restrictedSignals: [],
  eventDateLabel: "Формальная применимость устанавливается отдельно для каждого проверяемого года",
  neutralConclusion:
    "Формальная применимость официальной независимой оценки качества условий к точному юридическому лицу и проверяемому периоду не установлена опубликованными материалами.",
  alternativeVersion:
    "Частная клиника могла находиться вне официальной сферы НОК в проверяемом периоде: не участвовать в программе государственных гарантий, не быть включённой общественным советом в перечень цикла либо относиться к исключённому виду организации.",
  evidenceGaps:
    "Нет полного комплекта документов по каждому проверяемому году: подтверждения участия точного юридического лица в программе государственных гарантий, перечня общественного совета, документов оператора цикла и проверки исключений по применимой редакции приказа № 197н.",
  supportingEvidenceSearchCompleted: false,
  refutingEvidenceSearchCompleted: false,
  isPublished: true,
  evidenceValidatedAt: new Date("2026-08-13T00:00:00.000Z"),
  publishedAt: new Date("2026-08-13T00:00:00.000Z"),
  contextDocumentSlug: GLAZCENTR_INDEPENDENT_CONTROL.contextDocumentSlug,
};
