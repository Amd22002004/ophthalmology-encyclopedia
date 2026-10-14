"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReferenceMenu } from "@/components/layout/reference-menu";
import { headerNavItems, isNavHrefActive, referenceSections } from "@/lib/content-model";

/** Пять пунктов меню шапки на широком экране, от 1360 px (ТЗ главной v1.2, §7.1). */
export function HeaderNav() {
  const pathname = usePathname() ?? "";
  const linkActive = headerNavItems.some(
    (item) => item.kind === "link" && isNavHrefActive(pathname, item.href),
  );
  const referenceActive =
    !linkActive &&
    referenceSections.some((section) => section.links.some((link) => isNavHrefActive(pathname, link.href)));

  // Меню растянуто на высоту шапки, чтобы панель «Справочника» начиналась сразу
  // под пунктом и не терялась при наведении без JavaScript.
  return (
    <nav aria-label="Основное меню" className="hidden h-full min-w-0 min-[1360px]:block">
      <ul className="flex h-full items-stretch gap-0.5 2xl:gap-1">
        {headerNavItems.map((item) => {
          if (item.kind === "reference") {
            return (
              <li className="flex" key={item.label}>
                <ReferenceMenu highlighted={referenceActive} label={item.label} pathname={pathname} />
              </li>
            );
          }
          const isActive = isNavHrefActive(pathname, item.href);
          return (
            <li className="flex items-center" key={item.href}>
              <Button
                asChild
                className="whitespace-nowrap px-2.5 text-sm 2xl:px-3.5 2xl:text-[15px]"
                variant={isActive ? "secondary" : "ghost"}
              >
                <Link aria-current={isActive ? "page" : undefined} href={item.href}>
                  {item.label}
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
