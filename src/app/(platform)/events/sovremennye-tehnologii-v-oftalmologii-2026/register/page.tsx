import type { Metadata } from "next";
import { EventRegistrationClosed } from "@/components/events/event-registration-closed";
import { EventRegistrationForm } from "@/components/events/event-registration-form";
import { getPrisma } from "@/lib/prisma";
import { STO_2026_EVENT, STO_2026_EVENT_SLUG } from "@/lib/events/sto-2026";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Регистрация на конференцию «Современные технологии в офтальмологии»" },
  description: "Состояние регистрации на конференцию 15 октября 2026 года в Тюмени.",
  robots: { index: false, follow: true },
};

async function registrationIsOpen() {
  const db = getPrisma();
  if (!db) return false;
  try {
    const event = await db.event.findUnique({
      where: { slug: STO_2026_EVENT_SLUG },
      select: {
        registrationOpen: true,
        consentTemplates: {
          where: { isActive: true, requiresApproval: false },
          select: { id: true },
          take: 1,
        },
      },
    });
    return Boolean(event?.registrationOpen && event.consentTemplates.length > 0);
  } catch {
    // До Prisma migration и при временно недоступной БД публичный экран
    // остаётся безопасно закрытым, а не превращается в техническую ошибку.
    return false;
  }
}

export default async function ConferenceRegistrationPage() {
  const open = await registrationIsOpen();
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Конференция</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{STO_2026_EVENT.title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Регистрация участников</p>
      </div>
      {open ? <EventRegistrationForm eventSlug={STO_2026_EVENT_SLUG} /> : <EventRegistrationClosed />}
    </div>
  );
}
