"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
import { Button } from "@/components/ui/button";
import { isNavHrefActive, referenceSections } from "@/lib/content-model";
import { cn } from "@/lib/utils";

/**
 * Четыре группы «Справочника» (ТЗ главной v1.2, §7.2). Заголовки групп не
 * являются ссылками, описаний у ссылок нет. Используется и в выпадающей панели
 * шапки, и в мобильном меню.
 */
export function ReferenceGroups({
  className,
  idPrefix,
  linkClassName,
  onNavigate,
  pathname,
}: {
  className?: string;
  idPrefix: string;
  linkClassName?: string;
  onNavigate?: () => void;
  pathname: string;
}) {
  return (
    <div className={className}>
      {referenceSections.map((section, index) => {
        const headingId = `${idPrefix}-group-${index}`;
        return (
          <div className="min-w-0" key={section.title}>
            <p className="px-2.5 text-sm font-semibold text-foreground" id={headingId}>
              {section.title}
            </p>
            <ul aria-labelledby={headingId} className="mt-1.5 space-y-0.5">
              {section.links.map((link) => {
                const isActive = isNavHrefActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive && "bg-accent font-medium text-accent-foreground",
                        linkClassName,
                      )}
                      href={link.href}
                      onClick={onNavigate}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/**
 * «Справочник ▾» в шапке на широком экране: `<button aria-expanded>` и панель
 * с четырьмя группами в ряд. Панель всегда есть в серверном HTML и лишь скрыта;
 * без JavaScript её раскрывает CSS-запасной вариант в globals.css.
 */
export function ReferenceMenu({
  highlighted,
  label,
  pathname,
}: {
  highlighted: boolean;
  label: string;
  pathname: string;
}) {
  // Панель привязана к пути, на котором открыта: переход по ссылке её закрывает.
  const [menu, setMenu] = useState({ open: false, pathname });
  const isOpen = menu.open && menu.pathname === pathname;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const focusWasInside = rootRef.current?.contains(document.activeElement) ?? false;
      setMenu({ open: false, pathname });
      if (focusWasInside) buttonRef.current?.focus();
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setMenu({ open: false, pathname });
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, pathname]);

  // Фокус ушёл с клавиатуры за пределы меню — панель закрывается, чтобы не
  // перекрывать страницу. Клик по пустому месту панели фокус не переносит.
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocus = event.relatedTarget;
    if (nextFocus instanceof Node && !event.currentTarget.contains(nextFocus)) {
      setMenu({ open: false, pathname });
    }
  }

  return (
    <div className="reference-menu flex h-full items-center" onBlur={handleBlur} ref={rootRef}>
      <Button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="gap-1 px-2.5 text-sm 2xl:px-3.5 2xl:text-[15px]"
        onClick={() => setMenu({ open: !isOpen, pathname })}
        ref={buttonRef}
        type="button"
        variant={isOpen || highlighted ? "secondary" : "ghost"}
      >
        {label}
        <ChevronDown aria-hidden="true" className={cn("h-4 w-4", isOpen && "rotate-180")} />
      </Button>
      <div
        className={cn(
          "reference-menu-panel absolute inset-x-0 top-full border-b bg-card shadow-lg",
          !isOpen && "hidden",
        )}
        id={panelId}
      >
        <ReferenceGroups
          className="grid grid-cols-4 gap-6 px-5 py-5 lg:px-7"
          idPrefix={panelId}
          onNavigate={() => setMenu({ open: false, pathname })}
          pathname={pathname}
        />
      </div>
    </div>
  );
}
