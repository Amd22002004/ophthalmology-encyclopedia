import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import {
  STO_2026_EVENT,
  STO_2026_EVENT_PATH,
  STO_2026_PUBLIC_ORIGIN,
  STO_2026_SPEAKERS,
  type STO2026Speaker,
} from "./sto-2026";

const pageTitle =
  "Конференция «Современные технологии в офтальмологии» — 15 октября 2026 года";
const pageDescription =
  "Конференция Ассоциации офтальмологических клиник в Тюмени. Современные технологии рефракционной, лазерной, катарактальной и витреоретинальной хирургии. Участие бесплатное по предварительной регистрации.";

export function eventPageMetadata(): Metadata {
  const url = absoluteUrl(STO_2026_EVENT_PATH);
  return {
    title: { absolute: pageTitle },
    description: pageDescription,
    alternates: { canonical: STO_2026_EVENT_PATH },
    robots: { index: false, follow: false },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url,
      type: "website",
      siteName: "Ассоциация офтальмологических клиник",
      locale: "ru_RU",
    },
    twitter: { card: "summary", title: pageTitle, description: pageDescription },
  };
}

export function eventJsonLd(options: {
  registrationOpen?: boolean;
  speakers?: readonly Pick<STO2026Speaker, "fullName" | "credentials" | "photoUrl" | "doctorSlug" | "organizationRole">[];
} = {}) {
  const url = absoluteUrl(STO_2026_EVENT_PATH);
  const speakers = options.speakers ?? STO_2026_SPEAKERS;
  const registrationOpen = options.registrationOpen ?? STO_2026_EVENT.registrationOpen;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${url}#event`,
    name: STO_2026_EVENT.title,
    description: STO_2026_EVENT.description,
    url,
    startDate: STO_2026_EVENT.startsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: true,
    location: {
      "@type": "Place",
      name: STO_2026_EVENT.venueName,
      address: {
        "@type": "PostalAddress",
        streetAddress: STO_2026_EVENT.venueAddress,
        addressLocality: STO_2026_EVENT.city,
        addressCountry: "RU",
      },
    },
    organizer: {
      "@type": "Organization",
      name: STO_2026_EVENT.organizerName,
      url: absoluteUrl("/"),
      email: STO_2026_EVENT.organizerEmail,
    },
    performer: speakers.map((speaker) => ({
      "@type": "Person",
      name: speaker.fullName,
      jobTitle: speaker.credentials,
      image: absoluteUrl(speaker.photoUrl),
      ...(speaker.doctorSlug ? { url: absoluteUrl(`/doctors/${speaker.doctorSlug}`) } : {}),
      ...(speaker.organizationRole ? { description: speaker.organizationRole } : {}),
    })),
  };

  if (registrationOpen) {
    jsonLd.offers = {
      "@type": "Offer",
      price: "0",
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`${STO_2026_EVENT_PATH}/register`),
    };
  }

  return jsonLd as {
    "@type": "Event";
    eventStatus: string;
    eventAttendanceMode: string;
    isAccessibleForFree: boolean;
    startDate: string;
    location: { address: { streetAddress: string } };
    performer: Array<Record<string, unknown>>;
    offers?: Record<string, unknown>;
  } & Record<string, unknown>;
}

export function buildStoQrDestination(requestUrl: URL) {
  const destination = new URL(STO_2026_EVENT_PATH, STO_2026_PUBLIC_ORIGIN);
  requestUrl.searchParams.forEach((value, key) => destination.searchParams.set(key, value));
  destination.searchParams.set("utm_source", "print");
  destination.searchParams.set("utm_medium", "qr");
  destination.searchParams.set("utm_campaign", "conference_invitation_2026");
  destination.searchParams.set("utm_content", "registration");
  return destination;
}
