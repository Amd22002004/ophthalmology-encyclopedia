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
