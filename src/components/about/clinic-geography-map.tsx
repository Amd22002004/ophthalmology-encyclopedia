"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { AboutTrackedLink } from "@/components/about/about-interactions";
import type { ClinicMapCity } from "@/lib/clinic-map/cities";
import { formatClinicCount } from "@/lib/clinic-map/format";
import { cn } from "@/lib/utils";

type ClinicGeographyMapProps = {
  cities: ClinicMapCity[];
  contour: { land: string; borders: string };
  size: { width: number; height: number };
  /** Название блока для `role="group"` карты. */
  label: string;
};

const panelId = (index: number) => `clinic-geo-city-${index}`;

// Высота свёрнутого списка: строка города 64 px и разделитель 1 px, подсказка
// 32 px, поля и рамка карточки 34 px. Ширина карты на широком экране подобрана
// так, чтобы её высота совпадала с этим списком; число городов берётся из
// каталога, поэтому равенство сохраняется при появлении новых городов.
function wideMapWidth(cityCount: number, size: { width: number; height: number }) {
  const listHeight = cityCount * 65 - 1 + 32 + 34;
  return Math.min(704, Math.max(544, Math.round((listHeight * size.width) / size.height)));
}

/**
 * Карта клиник каталога и список городов (ТЗ карты v1.0). Список — одновременно
 * легенда и запасной вариант: он есть в серверном HTML, а без JavaScript все
 * города раскрыты (globals.css). Карта не несёт данных сверх списка.
 */
export function ClinicGeographyMap({ cities, contour, size, label }: ClinicGeographyMapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const rowButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingScrollCity = useRef<string | null>(null);

  // Появление карты один раз, когда блок доходит до экрана. Скрытое состояние
  // выставляется только на клиенте и только для блока ниже первого экрана,
  // поэтому без JavaScript и при reduced motion карта видна сразу.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (map.getBoundingClientRect().top < window.innerHeight) return;
    map.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        map.dataset.reveal = "play";
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(map);
    return () => observer.disconnect();
  }, []);

  // На узком экране выбор точки прокручивает страницу к раскрытому городу.
  useEffect(() => {
    if (!selected || pendingScrollCity.current !== selected) return;
    pendingScrollCity.current = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rowRefs.current.get(selected)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [selected]);

  function toggleCity(city: string, fromMap: boolean) {
    const next = selected === city ? null : city;
    if (next && fromMap && window.matchMedia("(max-width: 1023px)").matches) pendingScrollCity.current = next;
    setSelected(next);
  }

  // Esc закрывает выбранный город; фокус остаётся на элементе, а из закрытой
  // панели переходит на строку города.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !selected) return;
    const panel = rowRefs.current.get(selected)?.querySelector("[data-clinic-geo-panel]");
    if (panel?.contains(document.activeElement)) rowButtonRefs.current.get(selected)?.focus();
    setSelected(null);
  }

  const hoverHandlers = (city: string) => ({
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === "mouse") setHovered(city);
    },
    onPointerLeave: () => setHovered((current) => (current === city ? null : current)),
  });

  return (
    <div
      className="grid gap-5 lg:grid-cols-[minmax(0,var(--clinic-map-width))_minmax(18rem,1fr)] lg:items-start"
      onKeyDown={handleKeyDown}
      style={{ "--clinic-map-width": `${wideMapWidth(cities.length, size)}px` } as CSSProperties}
    >
      <div
        aria-label={label}
        className="clinic-map relative w-full overflow-hidden rounded-xl border bg-card"
        ref={mapRef}
        role="group"
        style={{ aspectRatio: `${size.width} / ${size.height}` }}
      >
        <svg
          aria-hidden="true"
          className="clinic-map-contour absolute inset-0 h-full w-full"
          focusable="false"
          preserveAspectRatio="none"
          viewBox={`0 0 ${size.width} ${size.height}`}
        >
          <path className="clinic-map-land" d={contour.land} />
          <path className="clinic-map-borders" d={contour.borders} vectorEffect="non-scaling-stroke" />
        </svg>
        {cities.map((city, index) => {
          if (!city.point) return null;
          const isSelected = selected === city.city;
          const position = { left: `${city.point.left}%`, top: `${city.point.top}%`, "--clinic-map-i": index } as CSSProperties;
          return (
            <Fragment key={city.city}>
              <button
                aria-label={`${city.city}, ${formatClinicCount(city.clinics.length)}`}
                aria-pressed={isSelected}
                className="clinic-map-point"
                data-highlighted={hovered === city.city || undefined}
                onClick={() => toggleCity(city.city, true)}
                style={position}
                type="button"
                {...hoverHandlers(city.city)}
              >
                <span aria-hidden="true" className="clinic-map-dot" data-multi={city.clinics.length > 1 || undefined}>
                  {city.clinics.length > 1 ? city.clinics.length : null}
                </span>
              </button>
              <span
                aria-hidden="true"
                className="clinic-map-label"
                data-multi={city.clinics.length > 1 || undefined}
                data-selected={isSelected || undefined}
                data-side={city.point.label.side}
                style={
                  {
                    ...position,
                    "--clinic-map-dx": `${city.point.label.dx ?? 0}px`,
                    "--clinic-map-dy": `${city.point.label.dy ?? 0}px`,
                  } as CSSProperties
                }
              >
                {city.city}
              </span>
            </Fragment>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-3 sm:p-4">
        <p className="clinic-geo-hint px-2 pb-2 text-sm leading-6 text-muted-foreground">
          Выберите город на карте или в списке.
        </p>
        <ul className="divide-y">
          {cities.map((city, index) => {
            const isOpen = selected === city.city;
            return (
              <li
                className="scroll-mt-24"
                key={city.city}
                ref={(node) => {
                  if (node) rowRefs.current.set(city.city, node);
                  else rowRefs.current.delete(city.city);
                }}
              >
                <button
                  aria-controls={panelId(index)}
                  aria-expanded={isOpen}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    (isOpen || hovered === city.city) && "bg-accent",
                  )}
                  onClick={() => toggleCity(city.city, false)}
                  ref={(node) => {
                    if (node) rowButtonRefs.current.set(city.city, node);
                    else rowButtonRefs.current.delete(city.city);
                  }}
                  type="button"
                  {...hoverHandlers(city.city)}
                >
                  <span className="min-w-0 flex-1">
                    <span className={cn("block leading-6 text-foreground", isOpen ? "font-bold" : "font-semibold")}>{city.city}</span>
                    <span className="block text-sm leading-5 text-muted-foreground">{city.region ?? "Регион уточняется"}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-primary">
                    <span aria-hidden="true">{city.clinics.length}</span>
                    <span className="sr-only">{formatClinicCount(city.clinics.length)}</span>
                  </span>
                  <ChevronDown aria-hidden="true" className={cn("h-4 w-4 shrink-0 text-muted-foreground", isOpen && "rotate-180")} />
                </button>
                <div className={cn("clinic-geo-panel", !isOpen && "hidden")} data-clinic-geo-panel id={panelId(index)}>
                  <ul className="space-y-2 px-2.5 pb-3 pt-1">
                    {city.clinics.map((clinic) => (
                      <li className="rounded-lg border bg-background/60 px-3 py-2.5" key={clinic.slug}>
                        <p className="text-sm font-medium leading-6 text-foreground">{clinic.name}</p>
                        <AboutTrackedLink
                          className="mt-0.5 inline-flex min-h-9 items-center gap-1 rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          event="about_participant_profile_opened"
                          href={clinic.url}
                          participantId={clinic.slug}
                          section="participants"
                          targetType="clinic"
                        >
                          Профиль клиники
                          <span className="sr-only">: {clinic.name}</span>
                          <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </AboutTrackedLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
