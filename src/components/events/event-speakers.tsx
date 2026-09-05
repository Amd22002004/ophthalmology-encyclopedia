"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronDown, ExternalLink } from "lucide-react";
import { EventTrackedLink, trackEventAnalytics } from "@/components/events/event-analytics";
import type { STO2026Speaker } from "@/lib/events/sto-2026";

type EventSpeakersContext = {
  eventSlug: string;
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
};

export function EventSpeakers({
  speakers,
  context,
}: {
  speakers: readonly STO2026Speaker[];
  context: EventSpeakersContext;
}) {
  const [openSpeaker, setOpenSpeaker] = React.useState<number | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2" data-mobile-accordion="speakers">
      {speakers.map((speaker) => {
        const topicPanelId = `speaker-topics-${speaker.order}`;
        const isOpen = openSpeaker === speaker.order;
        return (
          <article
            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-[border-color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
            data-speaker-card={speaker.order}
            id={`speaker-${speaker.order}`}
            key={speaker.order}
          >
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
                <Image
                  alt={`Фотография ${speaker.fullName}`}
                  className="aspect-[4/5] h-auto w-full rounded-xl object-cover object-top"
                  height={400}
                  sizes="(max-width: 639px) 92px, 112px"
                  src={speaker.photoUrl}
                  width={320}
                />
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-primary">
                        Спикер {speaker.order}
                      </p>
                      <h3 className="mt-1 text-base font-semibold leading-5 tracking-tight text-foreground">
                        {speaker.fullName}
                      </h3>
                    </div>
                    <button
                      aria-controls={topicPanelId}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? "Скрыть" : "Показать"} темы ${speaker.fullName}`}
                      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
                      onClick={() => {
                        setOpenSpeaker((current) => {
                          const next = current === speaker.order ? null : speaker.order;
                          if (next !== null) trackEventAnalytics("event_speaker_opened", context, speaker.order);
                          return next;
                        });
                      }}
                      type="button"
                    >
                      <ChevronDown
                        aria-hidden
                        className={`h-5 w-5 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{speaker.credentials}</p>
                  {speaker.organizationRole && (
                    <p className="mt-2 text-xs font-medium leading-5 text-primary">{speaker.organizationRole}</p>
                  )}
                </div>
              </div>

              <div
                className={`${isOpen ? "mt-5" : "hidden lg:block lg:mt-5"} border-t border-border pt-4`}
                data-speaker-topics={speaker.order}
                id={topicPanelId}
              >
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-primary">Темы выступления</p>
                <ul className="mt-3 space-y-2.5">
                  {speaker.topics.map((topic) => (
                    <li className="flex gap-2 text-sm leading-5 text-muted-foreground" data-speaker-topic={speaker.order} key={topic}>
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <EventTrackedLink
                className="mt-5 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                context={context}
                event="event_speaker_opened"
                href={`/doctors/${speaker.doctorSlug}`}
                speakerOrder={speaker.order}
              >
                Профессиональный профиль <ExternalLink aria-hidden className="h-3.5 w-3.5" />
              </EventTrackedLink>
            </div>
          </article>
        );
      })}
    </div>
  );
}
