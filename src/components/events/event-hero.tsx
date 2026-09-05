import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventTrackedLink } from "@/components/events/event-analytics";
import { cn } from "@/lib/utils";

export type EventHeroEvent = {
  title: string;
  description: string;
  dateLabel: string;
  registrationLabel: string;
  startLabel: string;
  venueName: string;
  venueAddress: string;
  venueHall: string;
  venueFloor: string;
  registrationOpen: boolean;
};

type EventHeroTracking = {
  eventSlug: string;
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
};

export function EventHero({
  event,
  registrationHref,
  context,
}: {
  event: EventHeroEvent;
  registrationHref: string;
  context: EventHeroTracking;
}) {
  const titleLines = getHeroTitleLines(event.title);

  return (
    <section
    aria-labelledby="conference-hero-title"
      className="relative isolate overflow-hidden rounded-2xl border border-[#d4e5e3] bg-[#eef7f6] text-[#14211f] shadow-[0_20px_60px_rgba(15,118,110,0.08)]"
      data-event-hero="true"
      data-event-hero-copy="approved"
      data-event-hero-theme="light"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,225,225,0.58),transparent_38%),linear-gradient(135deg,#f8fcfb_0%,#edf7f6_52%,#d9eff0_100%)]" />
        <Image
          alt=""
          className="hidden object-cover object-[64%_center] opacity-[0.18] mix-blend-multiply md:block"
          fill
          priority
          sizes="(max-width: 767px) 100vw, 1200px"
          src="/images/events/sto-2026-hero.webp"
        />
        <Image
          alt=""
          className="object-cover object-[68%_center] opacity-[0.15] mix-blend-multiply md:hidden"
          fill
          priority
          sizes="100vw"
          src="/images/events/sto-2026-hero-mobile.webp"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,252,251,0.82)_0%,rgba(238,248,247,0.9)_58%,rgba(224,243,243,0.96)_100%)] md:bg-[linear-gradient(90deg,rgba(248,252,251,0.98)_0%,rgba(241,249,248,0.92)_46%,rgba(218,241,242,0.58)_100%)]" />
        <div className="absolute -bottom-28 -left-24 h-72 w-[72%] rounded-[50%] border-t border-primary/20" />
        <div className="absolute -bottom-36 -left-32 h-72 w-[78%] rounded-[50%] border-t border-primary/10" />
      </div>

      <div className="relative grid min-h-[40rem] gap-7 px-5 py-7 sm:px-8 sm:py-9 lg:min-h-[34rem] lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] lg:items-center lg:gap-8 lg:px-10 lg:py-10 xl:px-14">
        <div className="relative z-10 flex min-w-0 max-w-2xl flex-col justify-center">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary sm:text-xs">
            МЕЖРЕГИОНАЛЬНАЯ КОНФЕРЕНЦИЯ · ТЮМЕНЬ
          </p>
          <h1
            className="mt-4 max-w-[14ch] font-serif text-[clamp(2.45rem,5.6vw,4.6rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-[#14211f] sm:mt-5"
            id="conference-hero-title"
          >
            {titleLines.map((line, index) => (
              <Fragment key={line}>
                {index > 0 ? " " : null}
                <span className="block">{line}</span>
              </Fragment>
            ))}
          </h1>
          <p className="mt-5 max-w-[37rem] text-[0.95rem] leading-6 text-[#496563] sm:mt-6 sm:text-lg sm:leading-8">
            {event.description}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-8">
            {event.registrationOpen ? (
              <Button asChild className="hidden min-h-12 w-full px-6 shadow-[0_8px_22px_rgba(15,118,110,0.16)] hover:shadow-[0_10px_28px_rgba(15,118,110,0.24)] md:inline-flex md:w-auto" size="lg">
                <EventTrackedLink
                  context={context}
                  event="event_registration_started"
                  href={registrationHref}
                >
                  Зарегистрироваться <ArrowRight aria-hidden className="h-4 w-4" />
                </EventTrackedLink>
              </Button>
            ) : (
              <Button asChild className="hidden min-h-12 w-full px-6 md:inline-flex md:w-auto" size="lg" variant="outline">
                <Link href={registrationHref}>Регистрация скоро откроется</Link>
              </Button>
            )}
            <Button
              asChild
              className="min-h-12 w-full border-[#a7c7c4] bg-white/70 px-6 text-[#14211f] hover:bg-white hover:text-[#14211f] md:w-auto"
              size="lg"
              variant="outline"
            >
              <EventTrackedLink
                context={context}
                event="event_program_opened"
                href="#program"
              >
                Изучить программу <ArrowDown aria-hidden className="h-4 w-4" />
              </EventTrackedLink>
            </Button>
          </div>
        </div>

        <div className="relative z-10 grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2 min-[390px]:items-start md:grid-cols-1 md:content-center">
          <EventFact dataKey="date" icon={<CalendarDays aria-hidden />} label="ДАТА">
            <span className="font-semibold md:hidden">15 октября 2026</span>
            <span className="hidden font-semibold md:inline">{event.dateLabel}</span>
          </EventFact>
          <EventFact dataKey="time" icon={<Clock3 aria-hidden />} label="ВРЕМЯ">
            <span className="block md:hidden">14:00 регистрация · 15:00 начало</span>
            <span className="hidden md:block">{event.registrationLabel}</span>
            <span className="mt-1 hidden md:block">{event.startLabel}</span>
          </EventFact>
          <EventFact className="col-span-1 min-[390px]:col-span-2 md:col-span-1" dataKey="place" icon={<MapPin aria-hidden />} label="МЕСТО">
            <span className="block font-semibold">{event.venueName}</span>
            <span className="mt-1 block text-[#496563] md:hidden">Тюмень · ул. Орджоникидзе, 46</span>
            <span className="mt-1 hidden text-[#496563] md:block">
              {event.venueAddress}, зал «{event.venueHall}», {event.venueFloor}
            </span>
          </EventFact>
        </div>
      </div>
    </section>
  );
}

function getHeroTitleLines(title: string) {
  const words = title.trim().split(/\s+/);
  return words.length === 4 ? [words[0], words.slice(1, 3).join(" "), words[3]] : [title];
}

function EventFact({
  dataKey,
  icon,
  label,
  className,
  children,
}: {
  dataKey: string;
  icon: ReactNode;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative isolate grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] gap-2 overflow-hidden rounded-xl border border-[#c5dedc] bg-white/85 p-3.5 text-[#14211f] shadow-[0_10px_30px_rgba(15,118,110,0.1)] backdrop-blur-sm md:grid-cols-[2.75rem_minmax(0,1fr)] md:gap-3 sm:p-4",
        className,
      )}
      data-event-fact={dataKey}
    >
      <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dff3f1] text-primary [&>svg]:h-4 [&>svg]:w-4 md:h-11 md:w-11 md:[&>svg]:h-5 md:[&>svg]:w-5">
        {icon}
      </span>
      <div className="relative z-10 min-w-0 self-start md:self-center">
        <p className="text-[0.63rem] font-bold uppercase tracking-[0.16em] text-primary">{label}</p>
        <div className="mt-1 break-words text-xs leading-4 text-[#315451] md:mt-1.5 md:text-sm md:leading-5">{children}</div>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-primary/10"
      />
    </div>
  );
}
