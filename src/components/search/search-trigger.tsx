"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchDialog } from "@/components/search/search-dialog";

export function SearchTrigger() {
  return (
    <SearchDialog
      trigger={
        <Button className="min-w-28 justify-start gap-2" variant="outline">
          <Search className="h-4 w-4 shrink-0" />
          <span>Поиск</span>
          <kbd className="ml-auto hidden text-[10px] font-sans tracking-widest opacity-60 sm:block">⌘K</kbd>
        </Button>
      }
    />
  );
}

/** Лупа в шапке до 1024 px: открывает тот же поиск по сайту на весь экран. */
export function MobileSearchTrigger({ className }: { className?: string }) {
  return (
    <SearchDialog
      fullScreen
      trigger={
        <Button className={className} size="icon" variant="ghost">
          <Search aria-hidden="true" className="h-5 w-5" />
          <span className="sr-only">Поиск</span>
        </Button>
      }
    />
  );
}
