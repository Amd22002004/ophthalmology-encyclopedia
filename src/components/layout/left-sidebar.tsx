"use client";

import { Fragment } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { sidebarSections } from "@/lib/content-model";
import { SidebarSection } from "@/components/layout/sidebar-section";
import { AssociationBrand } from "@/components/layout/association-brand";

export function SidebarNavContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4">
        <AssociationBrand />
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-3 pb-4">
          {sidebarSections.map((section, i) => (
            <Fragment key={section.title}>
              {i > 0 && <Separator className="my-1" />}
              <SidebarSection {...section} />
            </Fragment>
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
