"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { useEffect } from "react";
import {
  eventAnalyticsPayload,
  type EventAnalyticsEvent,
} from "@/lib/events/sto-2026";

type AnalyticsContext = {
  eventSlug: string;
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
};

export function trackEventAnalytics(
  event: EventAnalyticsEvent,
  context: AnalyticsContext,
  speakerOrder?: number,
) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source") || context.utmSource || null;
  const utmMedium = params.get("utm_medium") || context.utmMedium || null;
  const payload = eventAnalyticsPayload(event, {
    ...context,
    speakerOrder,
    source:
      params.get("source") ||
      (utmSource === "print" && utmMedium === "qr" ? "PRINT_QR" : context.source),
    utmSource,
    utmMedium,
    utmCampaign: params.get("utm_campaign") || context.utmCampaign || null,
    utmContent: params.get("utm_content") || context.utmContent || null,
    utmTerm: params.get("utm_term") || context.utmTerm || null,
  });
  window.dispatchEvent(new CustomEvent("association:event", { detail: payload }));
  const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) dataLayer.push(payload);
}

export function EventPageAnalytics({ context }: { context: AnalyticsContext }) {
  useEffect(() => {
    trackEventAnalytics("event_page_view", context);
  }, [context]);

  return null;
}

export const EventTrackedLink = forwardRef<
  HTMLAnchorElement,
  {
    href: string;
    event: EventAnalyticsEvent;
    context: AnalyticsContext;
    speakerOrder?: number;
    className?: string;
    children: React.ReactNode;
  }
>(function EventTrackedLink({ href, event, context, speakerOrder, className, children }, ref) {
  return (
    <Link
      className={className}
      href={href}
      onClick={() => trackEventAnalytics(event, context, speakerOrder)}
      ref={ref}
    >
      {children}
    </Link>
  );
});
