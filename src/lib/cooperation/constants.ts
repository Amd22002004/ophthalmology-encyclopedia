export const COOPERATION_PARTICIPANT_TYPES = ["CLINIC", "DOCTOR", "PARTNER"] as const;
export type CooperationParticipantType = (typeof COOPERATION_PARTICIPANT_TYPES)[number];

export const COOPERATION_PARTICIPANT_LABELS: Record<CooperationParticipantType, string> = {
  CLINIC: "Клиника",
  DOCTOR: "Врач / эксперт",
  PARTNER: "Профессиональный партнёр",
};

export const COOPERATION_STATUS_VALUES = [
  "NEW",
  "IN_REVIEW",
  "NEED_INFO",
  "APPROVED",
  "INVITED",
  "PROFILE_REVIEW",
  "ACTIVE",
  "REJECTED",
  "ARCHIVED",
] as const;
export type CooperationApplicationStatus = (typeof COOPERATION_STATUS_VALUES)[number];

export const COOPERATION_STATUS_LABELS: Record<CooperationApplicationStatus, string> = {
  NEW: "Новая",
  IN_REVIEW: "На рассмотрении",
  NEED_INFO: "Нужна информация",
  APPROVED: "Одобрена",
  INVITED: "Приглашение отправлено",
  PROFILE_REVIEW: "Профиль на модерации",
  ACTIVE: "Активна",
  REJECTED: "Отклонена",
  ARCHIVED: "Архив",
};

export const CLINIC_INTEREST_OPTIONS = [
  { value: "participation", label: "Вступление / участие в Ассоциации" },
  { value: "profile", label: "Профессиональный профиль клиники" },
  { value: "projects", label: "Участие в проектах" },
  { value: "science", label: "Научное сотрудничество" },
  { value: "education", label: "Образовательные проекты" },
  { value: "expert-groups", label: "Экспертные рабочие группы" },
  { value: "events", label: "Профессиональные мероприятия" },
  { value: "other", label: "Другое" },
] as const;

export const DOCTOR_SPECIALTY_OPTIONS = [
  { value: "ophthalmologist", label: "Врач-офтальмолог" },
  { value: "ophthalmic-surgeon", label: "Офтальмохирург" },
  { value: "pediatric-ophthalmologist", label: "Детский офтальмолог" },
  { value: "vitreoretinal-surgeon", label: "Витреоретинальный хирург" },
  { value: "refractive-surgeon", label: "Рефракционный хирург" },
  { value: "glaucoma", label: "Специалист по глаукоме" },
  { value: "cornea", label: "Специалист по заболеваниям роговицы" },
  { value: "cataract", label: "Специалист по катарактальной хирургии" },
  { value: "other", label: "Другое" },
] as const;

export const DOCTOR_INTEREST_OPTIONS = [
  { value: "profile", label: "Профессиональный профиль" },
  { value: "participation", label: "Участие в Ассоциации" },
  { value: "publications", label: "Размещение научных работ" },
  { value: "expertise", label: "Экспертная деятельность" },
  { value: "working-groups", label: "Рабочие группы" },
  { value: "education", label: "Образовательные проекты" },
  { value: "events", label: "Мероприятия" },
  { value: "other", label: "Другое" },
] as const;

export const PARTNER_TYPE_OPTIONS = [
  { value: "equipment-manufacturer", label: "Производитель оборудования" },
  { value: "equipment-supplier", label: "Поставщик оборудования" },
  { value: "research", label: "Научная организация" },
  { value: "education", label: "Образовательная организация" },
  { value: "technology", label: "IT / технологии" },
  { value: "media", label: "Профессиональное СМИ" },
  { value: "industry-project", label: "Отраслевой проект" },
  { value: "other", label: "Другое" },
] as const;

export const ACADEMIC_DEGREE_OPTIONS = [
  { value: "none", label: "Нет" },
  { value: "candidate", label: "к.м.н." },
  { value: "doctor", label: "д.м.н." },
  { value: "other", label: "Другая" },
] as const;

export const COOPERATION_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const COOPERATION_ATTACHMENT_ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function labelsForCooperationValues(
  values: string[],
  options: readonly { value: string; label: string }[],
) {
  const labels = new Map(options.map((option) => [option.value, option.label]));
  return values.map((value) => labels.get(value) ?? value);
}
