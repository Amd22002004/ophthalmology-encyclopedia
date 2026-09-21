import Link from "next/link";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssociationBrand } from "@/components/layout/association-brand";
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
      <div className="flex h-[71px] items-center gap-1.5 px-2.5 max-[359px]:gap-1 max-[359px]:px-2 sm:gap-3 sm:px-5 md:h-16 lg:px-7">
        <div className="lg:hidden">
          <MobileSidebarToggle />
        </div>
        <div className="min-w-0 shrink lg:hidden">
          <AssociationBrand variant="compact" />
        </div>
        <TopNavLinks items={topNavItems} />
        <div className="ml-auto flex items-center gap-1.5 max-[359px]:gap-1 sm:gap-2">
          <div className="hidden lg:block">
            <SearchTrigger />
          </div>
          <Button asChild className="h-10 w-10 shrink-0 px-0 max-[359px]:h-9 max-[359px]:w-9 lg:h-10 lg:w-auto lg:px-4" variant="secondary">
            <Link aria-label="Войти в личный кабинет" href="/cabinet">
              <UserRound className="h-4 w-4" />
              <span className="hidden lg:inline">Войти / Кабинет</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
