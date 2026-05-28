import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Хлебные крошки" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li className="flex items-center gap-1" key={`${item.label}-${index}`}>
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
              {item.href && !isLast ? (
                <Link className="hover:text-foreground" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span className={cn(isLast && "text-foreground")}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
