"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string };

export function TopNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Без flex-1: меню занимает только необходимое место, а не всё свободное.
  // Иначе на широких экранах внутри nav оставалась большая пустая область,
  // визуально «разрывавшая» меню и блок поиска.
  return (
    <nav className="hidden min-w-0 items-center gap-1 xl:flex">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Button asChild key={item.href} size="sm" variant={isActive ? "secondary" : "ghost"}>
            <Link href={item.href}>{item.label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
