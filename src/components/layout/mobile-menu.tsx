"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AssociationBrand } from "@/components/layout/association-brand";
import { ReferenceGroups } from "@/components/layout/reference-menu";
import { headerNavItems, isNavHrefActive } from "@/lib/content-model";
import { cn } from "@/lib/utils";

const itemClass =
  "flex min-h-11 w-full items-center rounded-md px-2.5 text-[15px] font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function MobileMenuContent({ onNavigate, pathname }: { onNavigate: () => void; pathname: string }) {
  // Состояние живёт внутри панели: при каждом открытии «Справочник» свёрнут.
  const [referenceOpen, setReferenceOpen] = useState(false);
  const groupsId = useId();

  return (
    <div className="flex h-full flex-col">
      {/* Справа место под кнопку закрытия панели, чтобы она не перекрывала бренд. */}
      <div className="border-b py-4 pl-4 pr-12">
        <AssociationBrand />
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Основное меню" className="px-3 py-3">
          <ul className="space-y-0.5">
            {headerNavItems.map((item) => {
              if (item.kind === "reference") {
                return (
                  <li key={item.label}>
                    <button
                      aria-controls={groupsId}
                      aria-expanded={referenceOpen}
                      className={cn(itemClass, "justify-between", referenceOpen && "bg-accent")}
                      onClick={() => setReferenceOpen((open) => !open)}
                      type="button"
                    >
                      {item.label}
                      <ChevronDown aria-hidden="true" className={cn("h-4 w-4", referenceOpen && "rotate-180")} />
                    </button>
                    <div hidden={!referenceOpen} id={groupsId}>
                      <ReferenceGroups
                        className="space-y-4 py-3 pl-3"
                        idPrefix={groupsId}
                        linkClassName="min-h-10"
                        onNavigate={onNavigate}
                        pathname={pathname}
                      />
                    </div>
                  </li>
                );
              }
              const isActive = isNavHrefActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={cn(itemClass, isActive && "bg-accent text-accent-foreground")}
                    href={item.href}
                    onClick={onNavigate}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>
    </div>
  );
}

/** Существующее мобильное меню до 1024 px: те же пункты, что в шапке (§7.5). */
export function MobileMenu({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const [{ open, pathname: openedPathname }, setSheetState] = useState(() => ({
    open: false,
    pathname,
  }));
  const isOpen = openedPathname === pathname ? open : false;

  function handleOpenChange(nextOpen: boolean) {
    setSheetState({ open: nextOpen, pathname });
  }

  return (
    <Sheet onOpenChange={handleOpenChange} open={isOpen}>
      <SheetTrigger asChild>
        <Button aria-label="Открыть навигацию" className={className} size="icon" variant="ghost">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[86vw] max-w-80" side="left">
        <SheetHeader className="sr-only">
          <SheetTitle>Навигация по разделам</SheetTitle>
        </SheetHeader>
        <MobileMenuContent onNavigate={() => handleOpenChange(false)} pathname={pathname} />
      </SheetContent>
    </Sheet>
  );
}
