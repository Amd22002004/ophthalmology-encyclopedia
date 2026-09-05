import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Users,
} from "lucide-react";
import { AssociationLogo } from "@/components/layout/association-brand";
import { EventHero } from "@/components/events/event-hero";
import { EventPageAnalytics, EventTrackedLink } from "@/components/events/event-analytics";
import { EventSpeakers } from "@/components/events/event-speakers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  STO_2026_EVENT_PATH,
  STO_2026_HERO_DESCRIPTION,
  STO_2026_REGISTER_PATH,
} from "@/lib/events/sto-2026";
import { getPublicEventView } from "@/lib/events/event-loader";
import { eventJsonLd } from "@/lib/events/event-web";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SchemaOrg } from "@/components/seo/schema-org";

type Tracking = {
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
};

const trackingDefaults = {
  source: "WEB",
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
};

const conferenceBenefits = [
  {
    icon: Check,
    title: "Практический опыт",
    text: "Реальные клинические случаи и опыт применения современных технологий.",
  },
  {
    icon: Building2,
    title: "Современные технологии",
    text: "Рефракционная, лазерная, катарактальная и витреоретинальная хирургия.",
  },
  {
    icon: Users,
    title: "Профессиональный диалог",
    text: "Обмен опытом и новые контакты с коллегами из разных регионов.",
  },
] as const;

export async function EventLanding({ tracking = {} }: { tracking?: Tracking }) {
  const view = await getPublicEventView();
  const event = view.event;
  const speakers = view.speakers;
  const context = {
    eventSlug: event.slug,
    ...trackingDefaults,
    ...tracking,
  };
  const registrationHref = buildRegistrationHref(context);

  return (
    <div className={event.registrationOpen ? "space-y-8 pb-20 md:pb-0" : "space-y-8"} data-event-landing="sto-2026">
      <EventPageAnalytics context={context} />

      <EventHero
        context={context}
        event={{ ...event, description: STO_2026_HERO_DESCRIPTION }}
        registrationHref={registrationHref}
      />

      <section aria-labelledby="conference-about-title" className="event-reveal space-y-4">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Контекст конференции</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl" id="conference-about-title">
            О конференции
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            {event.programDescription}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {conferenceBenefits.map(({ icon: Icon, title, text }) => (
            <Card className="rounded-2xl border-border/80 p-5 shadow-sm" key={title}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {event.programPublished && (
        <section aria-labelledby="conference-program-title" className="event-reveal scroll-mt-6 space-y-5" id="program">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Программа</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl" id="conference-program-title">
              Программа и спикеры
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              6 спикеров · 12 тем о рефракционной хирургии, лазерных методиках, хирургии катаракты, глаукомы, сетчатки и стекловидного тела.
            </p>
          </div>

          {event.speakersPublished && <EventSpeakers context={context} speakers={speakers} />}
        </section>
      )}

      <section aria-labelledby="conference-venue-title" className="event-reveal space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Ориентир для участников</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl" id="conference-venue-title">
            Место проведения
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] lg:items-stretch">
          <div className="relative min-h-64 overflow-hidden rounded-2xl border border-border bg-[#0b2b48] shadow-sm sm:min-h-80">
            <Image
              alt="Нейтральное визуальное представление конференц-площадки"
              className="object-cover"
              fill
              sizes="(max-width: 1023px) 100vw, 55vw"
              src="/images/events/sto-2026-venue.webp"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06182e]/80 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 text-xs font-medium uppercase tracking-[0.14em] text-white sm:bottom-5 sm:left-5">
              DoubleTree by Hilton Tyumen · Сильвер Холл
            </p>
          </div>
          <Card className="rounded-2xl border-border/80 p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <MapPin aria-hidden className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold">{event.venueName}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {event.venueAddress}<br />
                  Зал «{event.venueHall}», {event.venueFloor}
                </p>
              </div>
            </div>
            <Button asChild className="mt-6 min-h-11" size="sm" variant="outline">
              <a href={event.mapUrl} rel="noreferrer" target="_blank">
                Построить маршрут <ExternalLink aria-hidden className="h-4 w-4" />
              </a>
            </Button>
          </Card>
        </div>
      </section>

      <section aria-labelledby="conference-organizer-title" className="event-reveal rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <AssociationLogo className="h-14 w-14 rounded-xl" size="hero" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Организатор</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight" id="conference-organizer-title">
                Ассоциация офтальмологических клиник
              </h2>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:items-end">
            <a className="inline-flex min-h-11 items-center gap-2 text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`mailto:${event.organizerEmail}`}>
              <Mail aria-hidden className="h-4 w-4" /> {event.organizerEmail}
            </a>
            <Link className="inline-flex min-h-11 items-center gap-2 text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/">
              <Globe2 aria-hidden className="h-4 w-4" /> oftalmologia.pro
            </Link>
          </div>
        </div>
      </section>

      <section className="event-reveal relative isolate overflow-hidden rounded-2xl bg-[#06182e] px-5 py-8 text-center text-white shadow-[0_20px_60px_rgba(6,24,46,0.16)] sm:px-8 sm:py-10" data-final-cta="true">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-cyan-200/25" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-96 rounded-[50%] border-t border-cyan-200/20" />
        <h2 className="relative text-2xl font-semibold tracking-tight sm:text-3xl">До встречи в Тюмени</h2>
        <p className="relative mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-200">
          Участие бесплатное. Предварительная регистрация обязательна.
        </p>
        <Button asChild className="relative mt-6 min-h-12 border-white/30 bg-white text-[#06182e] hover:bg-cyan-50" size="lg">
          <EventTrackedLink context={context} event="event_registration_started" href={registrationHref}>
            Зарегистрироваться <ArrowRight aria-hidden className="h-4 w-4" />
          </EventTrackedLink>
        </Button>
      </section>

      {event.registrationOpen && (
        <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 shadow-lg backdrop-blur md:hidden" aria-label="Регистрация на конференцию">
          <EventTrackedLink
            className="flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            context={context}
            event="event_registration_started"
            href={registrationHref}
          >
            Зарегистрироваться <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
          </EventTrackedLink>
        </aside>
      )}

      <SchemaOrg data={breadcrumbJsonLd([{ href: "/", label: "Главная" }, { href: STO_2026_EVENT_PATH, label: event.title }])} />
      <SchemaOrg data={eventJsonLd({ registrationOpen: event.registrationOpen, speakers })} />
    </div>
  );
}

function buildRegistrationHref(context: Tracking) {
  const query = new URLSearchParams();
  const trackingFields = [
    ["utm_source", context.utmSource],
    ["utm_medium", context.utmMedium],
    ["utm_campaign", context.utmCampaign],
    ["utm_content", context.utmContent],
    ["utm_term", context.utmTerm],
  ] as const;
  for (const [key, value] of trackingFields) if (value) query.set(key, value);
  const suffix = query.toString();
  return `${STO_2026_REGISTER_PATH}${suffix ? `?${suffix}` : ""}`;
}
