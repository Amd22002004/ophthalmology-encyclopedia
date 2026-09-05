export const APPEAL_STATUS_VALUES = ["NEW", "IN_REVIEW", "VERIFIED", "CLOSED"] as const;
export type AppealStatusValue = (typeof APPEAL_STATUS_VALUES)[number];

export const APPEAL_STATUS_LABELS: Record<AppealStatusValue, string> = {
  NEW: "Новое",
  IN_REVIEW: "В работе",
  VERIFIED: "Проверено",
  CLOSED: "Закрыто",
};

export const REPORTER_ROLE_OPTIONS = [
  { value: "patient", label: "Я проходил(а) лечение" },
  { value: "relative", label: "Я являюсь родственником пациента" },
  { value: "document_holder", label: "Я располагаю документами" },
  { value: "witness", label: "Я являюсь свидетелем" },
  { value: "other", label: "Другое" },
] as const;

export const APPEAL_CATEGORY_OPTIONS = [
  { value: "investigation_information", label: "Сообщить информацию по расследованию" },
  { value: "provide_documents", label: "Предоставить документы" },
  { value: "possible_violation", label: "Сообщить о возможном нарушении" },
  { value: "unsatisfactory_result", label: "Сообщить о неудовлетворительном результате лечения" },
  { value: "request_feedback", label: "Запросить обратную связь" },
  { value: "collective_interest", label: "Сообщить о желании участвовать в коллективном обращении" },
  { value: "other", label: "Иное" },
] as const;

export const REQUESTED_ACTION_OPTIONS = [
  { value: "review_circumstances", label: "Проверить изложенные обстоятельства" },
  { value: "contact_me", label: "Связаться со мной" },
  { value: "attach_documents", label: "Рассмотреть возможность приобщения документов" },
  { value: "refund_request", label: "Рассмотреть вопрос о возврате денежных средств" },
  { value: "legal_consultation", label: "Получить юридическую консультацию" },
  { value: "collective_information", label: "Получать информацию о возможном коллективном обращении" },
  { value: "other", label: "Иное" },
] as const;

export const REPORTER_ROLE_VALUES = REPORTER_ROLE_OPTIONS.map((option) => option.value);
export const APPEAL_CATEGORY_VALUES = APPEAL_CATEGORY_OPTIONS.map((option) => option.value);
export const REQUESTED_ACTION_VALUES = REQUESTED_ACTION_OPTIONS.map((option) => option.value);

export function labelsForValues(
  values: string[],
  options: readonly { value: string; label: string }[],
) {
  const labels = new Map(options.map((option) => [option.value, option.label]));
  return values.map((value) => labels.get(value) ?? value);
}

