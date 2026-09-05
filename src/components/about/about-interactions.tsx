"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

export type AboutAnalyticsEvent =
  | "about_page_view"
  | "about_join_clicked"
  | "about_clinic_application_clicked"
  | "about_doctor_application_clicked"
  | "about_partner_application_clicked"
  | "about_participant_profile_opened"
  | "about_project_opened"
  | "about_publication_opened"
  | "about_publication_downloaded"
  | "about_event_opened"
  | "about_contact_clicked";

type AboutAnalyticsInput = {
  section?: string;
  targetType?: string;
  publicationId?: string;
  participantId?: string;
};

export function trackAboutEvent(event: AboutAnalyticsEvent, input: AboutAnalyticsInput = {}) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const payload = {
    event,
    ...(input.section ? { section: input.section } : {}),
    ...(input.targetType ? { targetType: input.targetType } : {}),
    ...(input.publicationId ? { publicationId: input.publicationId } : {}),
    ...(input.participantId ? { participantId: input.participantId } : {}),
    ...(params.get("utm_source") ? { utmSource: params.get("utm_source") } : {}),
    ...(params.get("utm_campaign") ? { utmCampaign: params.get("utm_campaign") } : {}),
  };
  const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent("association:about", { detail: payload }));
}

export function AboutPageTracker() {
  useEffect(() => {
    trackAboutEvent("about_page_view", { section: "page" });
  }, []);
  return null;
}

export function AboutTrackedLink({
  href,
  event,
  section,
  targetType,
  participantId,
  children,
  className,
  ...props
}: {
  href: string;
  event: AboutAnalyticsEvent;
  section?: string;
  targetType?: string;
  participantId?: string;
  children: ReactNode;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children" | "onClick">) {
  return (
    <Link
      {...props}
      className={className}
      href={href}
      onClick={() => trackAboutEvent(event, { section, targetType, participantId })}
    >
      {children}
    </Link>
  );
}

export function AboutAnchorNav({ items }: { items: readonly { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-88px 0px -65% 0px", threshold: [0, 0.15, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Навигация по странице об Ассоциации"
      className="sticky top-2 z-10 min-w-0 max-w-full overflow-x-auto rounded-xl border bg-background/95 p-1.5 shadow-sm backdrop-blur"
    >
      <ul className="flex w-max min-w-full gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              aria-current={active === item.id ? "location" : undefined}
              className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                active === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              href={`#${item.id}`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
