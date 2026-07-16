import Link from "next/link";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSidebarToggle } from "@/components/layout/mobile-sidebar-toggle";
import { TopNavLinks } from "@/components/layout/top-nav-links";
import { SearchTrigger } from "@/components/search/search-trigger";
import { topNavItems } from "@/lib/content-model";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      {/* Своего контейнера/max-width у шапки нет: ширину задаёт рабочая область
          в app-shell.tsx. Отступы совпадают с <main>, поэтому шапка выровнена
          с контентом по вертикали. */}
      <div className="flex h-16 items-center gap-3 px-3 sm:px-5 lg:px-7">
        <div className="lg:hidden">
          <MobileSidebarToggle />
        </div>
        <Link className="hidden text-sm font-semibold md:block lg:hidden" href="/">
          Офтальмология
        </Link>
        <TopNavLinks items={topNavItems} />
        <div className="ml-auto flex items-center gap-2">
          <SearchTrigger />
          <Button asChild variant="secondary">
            <Link href="/cabinet">
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">Войти / Кабинет</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
