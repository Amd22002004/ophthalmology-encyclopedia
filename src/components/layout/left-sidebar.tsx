"use client";

import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sidebarSections } from "@/lib/content-model";
import { SidebarSection } from "@/components/layout/sidebar-section";

export function SidebarNavContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4">
        <Link href="/" className="block">
          <div className="text-sm font-semibold leading-tight">
            Офтальмологическая энциклопедия
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Профессиональный справочник
          </div>
        </Link>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-3">
          {sidebarSections.map((section) => (
            <SidebarSection key={section.title} {...section} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function LeftSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r bg-card lg:block">
      <div className="sticky top-0 h-screen">
        <SidebarNavContent />
      </div>
    </aside>
  );
}
