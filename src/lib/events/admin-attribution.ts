export type EventRegistrationAttributionInput = {
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
};

function clean(value: string | null | undefined) {
  return value?.trim() || null;
}

export function getEventRegistrationAttribution(
  input: EventRegistrationAttributionInput,
) {
  const utmSource = clean(input.utmSource);
  const utmMedium = clean(input.utmMedium);
  const utmCampaign = clean(input.utmCampaign);
  const utmContent = clean(input.utmContent);
  const source = clean(input.source);
  const isNatalia = utmSource?.toLowerCase() === "natalia";

  const label = isNatalia
    ? "От Натальи"
    : utmSource ||
      (source === "event_page" ? "Страница конференции" : source) ||
      "Без метки";

  return {
    label,
    isNatalia,
    medium: utmMedium,
    campaign: [utmCampaign, utmContent].filter(Boolean).join(" / ") || null,
  };
}
