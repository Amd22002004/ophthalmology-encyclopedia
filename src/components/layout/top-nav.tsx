import Link from "next/link";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssociationBrand } from "@/components/layout/association-brand";
import { HeaderNav } from "@/components/layout/header-nav";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { MobileSearchTrigger, SearchTrigger } from "@/components/search/search-trigger";
import { headerJoinLink } from "@/lib/content-model";

/**
 * Единственное меню сайта (ТЗ главной v1.2, §7): логотип, пять пунктов,
 * поиск, «Вступить» и «Войти / Кабинет». Анимаций в шапке нет.
 *
 * Пять пунктов в строку вместе с неизменными логотипом, поиском и кнопками
 * занимают ≈1330 px, поэтому строка меню появляется от 1360 px. Уже — те же
 * пункты открывает существующее мобильное меню. Поиск и «Вступить» видны от
 * 1024 px; до 1024 px поиск открывает лупа на весь экран.
 */
export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      {/* Своего контейнера/max-width у шапки нет: ширину задаёт рабочая область
          в app-shell.tsx. Отступы совпадают с <main>, поэтому шапка выровнена
          с контентом по вертикали. */}
      <div className="flex h-[71px] items-center gap-1 px-2.5 max-[359px]:gap-0.5 max-[359px]:px-2 sm:gap-3 sm:px-5 md:h-16 lg:px-7">
        <div className="min-[1360px]:hidden">
          <MobileMenu className="w-8 max-[359px]:w-7 sm:w-10" />
        </div>
        <div className="min-w-0 shrink min-[1360px]:mr-2">
          <AssociationBrand variant="compact" />
        </div>
        <HeaderNav />
        <div className="ml-auto flex shrink-0 items-center gap-1 max-[359px]:gap-0.5 sm:gap-2">
          <div className="hidden lg:block">
            <SearchTrigger />
          </div>
          <div className="lg:hidden">
            <MobileSearchTrigger className="w-8 max-[359px]:w-7 sm:w-10" />
          </div>
          <Button asChild className="hidden lg:inline-flex">
            <Link href={headerJoinLink.href}>{headerJoinLink.label}</Link>
          </Button>
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
