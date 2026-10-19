import { STO_2026_EVENT, STO_2026_EVENT_PATH, STO_2026_EVENT_SLUG } from "@/lib/events/sto-2026";

export type NewsEventLink = {
  href: string;
  title: string;
  startsAt: string;
  dateLabel: string;
  city: string;
  venueName: string;
  venueAddress: string;
  venueHall: string;
  venueFloor: string;
};

export function resolveNewsEvent(eventSlug: string | null | undefined): NewsEventLink | null {
  if (eventSlug !== STO_2026_EVENT_SLUG) return null;
  return {
    href: STO_2026_EVENT_PATH,
    title: STO_2026_EVENT.title,
    startsAt: STO_2026_EVENT.startsAt,
    dateLabel: STO_2026_EVENT.dateLabel,
    city: STO_2026_EVENT.city,
    venueName: STO_2026_EVENT.venueName,
    venueAddress: STO_2026_EVENT.venueAddress,
    venueHall: STO_2026_EVENT.venueHall,
    venueFloor: STO_2026_EVENT.venueFloor,
  };
}
