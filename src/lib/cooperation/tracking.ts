export type CooperationTracking = {
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  landingUrl: string;
  referrer: string | null;
  pageTitle?: string;
};

function value(value: string | null) {
  const trimmed = value?.trim().slice(0, 200) ?? "";
  return trimmed || null;
}

export function buildCooperationTracking(url: URL, referrer: string | null = null): CooperationTracking {
  const utmSource = value(url.searchParams.get("utm_source"));
  const utmMedium = value(url.searchParams.get("utm_medium"));
  const utmCampaign = value(url.searchParams.get("utm_campaign"));
  const utmContent = value(url.searchParams.get("utm_content"));
  const explicitSource = value(url.searchParams.get("source"));
  const source = utmSource === "print" && utmMedium === "qr" ? "PRINT_QR" : explicitSource || "WEB";

  return {
    source,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    landingUrl: url.toString().slice(0, 2_000),
    referrer: value(referrer),
  };
}

export function trackingQuery(tracking: CooperationTracking) {
  const query = new URLSearchParams();
  if (tracking.source) query.set("source", tracking.source);
  if (tracking.utmSource) query.set("utm_source", tracking.utmSource);
  if (tracking.utmMedium) query.set("utm_medium", tracking.utmMedium);
  if (tracking.utmCampaign) query.set("utm_campaign", tracking.utmCampaign);
  if (tracking.utmContent) query.set("utm_content", tracking.utmContent);
  return query.toString();
}
