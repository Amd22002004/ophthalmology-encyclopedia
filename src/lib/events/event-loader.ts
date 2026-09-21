import "server-only";

import { getPrisma } from "@/lib/prisma";
import {
  STO_2026_EVENT,
  STO_2026_EVENT_SLUG,
  STO_2026_PROGRAM,
  STO_2026_SPEAKERS,
  getSTO2026PublicTopicTitle,
  type STO2026ProgramItem,
  type STO2026Speaker,
} from "./sto-2026";

type PublicEventContent = Omit<
  typeof STO_2026_EVENT,
  | "title"
  | "description"
  | "organizerName"
  | "organizerEmail"
  | "startsAt"
  | "registrationStartsAt"
  | "venueName"
  | "venueAddress"
  | "city"
  | "registrationOpen"
  | "programPublished"
  | "speakersPublished"
> & {
  title: string;
  description: string;
  organizerName: string;
  organizerEmail: string;
  startsAt: string;
  registrationStartsAt: string;
  venueName: string;
  venueAddress: string;
  city: string;
  registrationOpen: boolean;
  programPublished: boolean;
  speakersPublished: boolean;
};

export type PublicEventView = {
  event: PublicEventContent;
  speakers: readonly STO2026Speaker[];
  program: readonly STO2026ProgramItem[];
};

const fallback: PublicEventView = {
  event: STO_2026_EVENT,
  speakers: STO_2026_SPEAKERS,
  program: STO_2026_PROGRAM,
};

export async function getPublicEventView(slug = STO_2026_EVENT_SLUG): Promise<PublicEventView> {
  const db = getPrisma();
  if (!db) return fallback;

  try {
    const event = await db.event.findUnique({
      where: { slug },
      include: {
        speakers: {
          where: { published: true },
          orderBy: { order: "asc" },
          include: { doctor: { select: { slug: true } } },
        },
        talks: {
          where: { published: true },
          orderBy: { sortOrder: "asc" },
          include: { speaker: { select: { id: true, order: true } } },
        },
      },
    });
    if (!event) return fallback;

    const staticByOrder = new Map(STO_2026_SPEAKERS.map((speaker) => [speaker.order, speaker]));
    const speakers = event.speakers.map((speaker) => {
      const staticSpeaker = staticByOrder.get(speaker.order);
      const topics = event.talks
        .filter((talk) => talk.kind === "TALK" && talk.speakerId === speaker.id)
        .map((talk) => getSTO2026PublicTopicTitle(talk.title));
      return {
        order: speaker.order,
        doctorSlug: speaker.doctor?.slug ?? staticSpeaker?.doctorSlug ?? "",
        fullName: speaker.fullNameSnapshot,
        credentials: speaker.credentialsSnapshot,
        ...(speaker.organizationRole ? { organizationRole: speaker.organizationRole } : {}),
        photoUrl: speaker.photoUrlSnapshot ?? staticSpeaker?.photoUrl ?? "",
        topics,
      } satisfies STO2026Speaker;
    });
    const speakerOrderById = new Map(event.speakers.map((speaker) => [speaker.id, speaker.order]));
    const program = event.talks.map((talk) => ({
      order: talk.sortOrder,
      speakerOrder: talk.speakerId ? speakerOrderById.get(talk.speakerId) ?? 0 : 0,
      title: getSTO2026PublicTopicTitle(talk.title),
      startTime: talk.startAt?.toISOString() ?? null,
      endTime: talk.endAt?.toISOString() ?? null,
      published: true as const,
    }));

    return {
      event: {
        ...STO_2026_EVENT,
        title: event.title,
        description: event.description,
        organizerName: event.organizerName,
        organizerEmail: event.organizerEmail ?? STO_2026_EVENT.organizerEmail,
        startsAt: event.startsAt.toISOString(),
        registrationStartsAt: event.registrationStartsAt.toISOString(),
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        city: event.city,
        registrationOpen: event.registrationOpen,
        programPublished: event.programPublished,
        speakersPublished: event.speakersPublished,
      },
      speakers,
      program: event.programPublished ? program : [],
    };
  } catch {
    // До migration или при временной ошибке БД публичная страница использует
    // утверждённый snapshot и не показывает техническую ошибку.
    return fallback;
  }
}
