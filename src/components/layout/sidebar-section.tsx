"use client";

import type { LucideIcon } from "lucide-react";
import { SidebarLink } from "@/components/layout/sidebar-link";

export function SidebarSection({
  title,
  icon: Icon,
  links,
}: {
  title: string;
  icon: LucideIcon;
  links: { href: string; label: string; icon: LucideIcon }[];
}) {
  return (
    <section className="space-y-1">
      <div className="flex items-center gap-2 px-2.5 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{title}</span>
      </div>
      <div className="space-y-0.5">
        {links.map((link) => (
          <SidebarLink key={link.href} {...link} />
        ))}
      </div>
    </section>
  );
}
