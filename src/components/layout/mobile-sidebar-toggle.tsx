"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNavContent } from "@/components/layout/left-sidebar";

export function MobileSidebarToggle() {
  const pathname = usePathname();
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
        <Button aria-label="Открыть навигацию" className="max-[359px]:h-9 max-[359px]:w-9" size="icon" variant="ghost">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[86vw] max-w-80" side="left">
        <SheetHeader className="sr-only">
          <SheetTitle>Навигация по разделам</SheetTitle>
        </SheetHeader>
        <SidebarNavContent />
      </SheetContent>
    </Sheet>
  );
}
