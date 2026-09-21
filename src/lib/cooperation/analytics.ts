export type CooperationAnalyticsEvent =
  | "cooperation_page_view"
  | "cooperation_role_selected"
  | "cooperation_form_started"
  | "cooperation_form_error"
  | "cooperation_form_submitted"
  | "cooperation_application_created";

type SafeAnalyticsInput = {
  [key: string]: unknown;
  participantType?: string | null;
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
};

export function cooperationAnalyticsPayload(
  event: CooperationAnalyticsEvent,
  input: SafeAnalyticsInput = {},
) {
  return {
    event,
    ...(input.participantType ? { participantType: input.participantType } : {}),
    ...(input.source ? { source: input.source } : {}),
    ...(input.utmSource ? { utmSource: input.utmSource } : {}),
    ...(input.utmMedium ? { utmMedium: input.utmMedium } : {}),
    ...(input.utmCampaign ? { utmCampaign: input.utmCampaign } : {}),
    ...(input.utmContent ? { utmContent: input.utmContent } : {}),
  };
}

export function trackCooperationEvent(
  event: CooperationAnalyticsEvent,
  input: SafeAnalyticsInput = {},
) {
  if (typeof window === "undefined") return;
  const payload = cooperationAnalyticsPayload(event, input);
  window.dispatchEvent(new CustomEvent("association:cooperation", { detail: payload }));
  const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) dataLayer.push(payload);
}
