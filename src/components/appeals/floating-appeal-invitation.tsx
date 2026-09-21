"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import {
  buildAppealHref,
  getObservedElementPosition,
  isFloatingAppealVisible,
  type ObservedElementPosition,
} from "@/lib/appeals/navigation";
import { cn } from "@/lib/utils";

export function FloatingAppealInvitation({
  investigationSlug,
  triggerId,
  endId,
}: {
  investigationSlug: string;
  triggerId: string;
  endId: string;
}) {
  const [triggerPosition, setTriggerPosition] = useState<ObservedElementPosition>("before");
  const [endVisible, setEndVisible] = useState(false);

  useEffect(() => {
    const trigger = document.getElementById(triggerId);
    const end = document.getElementById(endId);
    if (!trigger || !end || !("IntersectionObserver" in window)) return;

    const triggerObserver = new IntersectionObserver(([entry]) => {
      setTriggerPosition(getObservedElementPosition({
        isIntersecting: entry.isIntersecting,
        top: entry.boundingClientRect.top,
        bottom: entry.boundingClientRect.bottom,
      }));
    });
    const endObserver = new IntersectionObserver(([entry]) => {
      setEndVisible(entry.isIntersecting);
    }, { rootMargin: "0px 0px 160px 0px" });

    triggerObserver.observe(trigger);
    endObserver.observe(end);

    return () => {
      triggerObserver.disconnect();
      endObserver.disconnect();
    };
  }, [endId, triggerId]);

  const visible = isFloatingAppealVisible({ triggerPosition, endVisible });

  return (
    <aside
      aria-hidden={!visible}
      className={cn(
        "floating-appeal-shell fixed left-1/2 z-30 w-[90%] -translate-x-1/2 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none sm:left-auto sm:right-6 sm:top-1/2 sm:w-[240px] sm:-translate-y-1/2",
        visible
          ? "translate-y-0 opacity-100 sm:translate-x-0"
          : "pointer-events-none translate-y-4 opacity-0 sm:translate-x-4",
      )}
      data-floating-appeal
      data-visible={visible ? "true" : "false"}
    >
      <Link
        aria-label="Есть информация? Подать обращение по расследованию"
        className="floating-appeal-link group block rounded-lg border border-primary/30 bg-card p-3 shadow-lg outline-none transition-[transform,box-shadow] duration-300 hover:scale-[1.05] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none motion-reduce:transition-none sm:p-4"
        href={buildAppealHref(investigationSlug)}
        tabIndex={visible ? 0 : -1}
      >
        <div className="appeal-breathe">
          <div className="flex items-center justify-center gap-2 sm:hidden">
            <MessageSquareText aria-hidden className="h-5 w-5 shrink-0 text-primary" />
            <span className="font-semibold text-foreground">Подать обращение</span>
          </div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <MessageSquareText aria-hidden className="h-5 w-5 shrink-0 text-primary" />
              <p className="font-semibold text-foreground">Есть информация?</p>
            </div>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Помогите дополнить материалы расследования.
            </p>
            <span className="mt-3 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              Подать обращение
            </span>
          </div>
        </div>
      </Link>
    </aside>
  );
}
