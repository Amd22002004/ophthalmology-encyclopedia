"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string };

export function TopNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Навигация занимает доступную ширину между мобильным брендом и
  // фиксированными действиями справа, поэтому пункты равномерно заполняют
  // верхнюю панель и не оставляют пустой разрыв перед поиском.
  return (
    <nav className="hidden min-w-0 flex-1 items-center justify-between gap-0 2xl:gap-2 xl:flex">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Button
            asChild
            key={item.href}
            className="px-2 text-sm 2xl:px-4 2xl:text-[15px]"
            variant={isActive ? "secondary" : "ghost"}
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
