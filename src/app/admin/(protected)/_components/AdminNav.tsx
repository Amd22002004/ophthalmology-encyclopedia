"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/clinics", label: "Клиники" },
  { href: "/admin/appeals", label: "Обращения" },
  { href: "/admin/cooperation", label: "Заявки участников" },
  { href: "/admin/events", label: "Конференции" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center px-3 py-2 rounded text-sm transition-colors",
            pathname.startsWith(href)
              ? "bg-slate-700 text-white"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
