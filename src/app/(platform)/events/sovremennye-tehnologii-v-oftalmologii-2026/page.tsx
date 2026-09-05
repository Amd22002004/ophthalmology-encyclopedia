import type { Metadata } from "next";
import { EventLanding } from "@/components/events/event-landing";
import { eventPageMetadata } from "@/lib/events/event-web";

export const metadata: Metadata = eventPageMetadata();
export const revalidate = 3600;

export default async function ConferencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => typeof value === "string" ? value : null;
  return (
    <EventLanding
      tracking={{
        utmSource: first(params.utm_source),
        utmMedium: first(params.utm_medium),
        utmCampaign: first(params.utm_campaign),
        utmContent: first(params.utm_content),
        utmTerm: first(params.utm_term),
      }}
    />
  );
}
