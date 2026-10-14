import { SiteFooter } from "@/components/layout/site-footer";
import { TopNav } from "@/components/layout/top-nav";

/** Максимальная ширина всей рабочей области (шапка + контент + футер). */
const WORKSPACE = "mx-auto w-full max-w-[1600px]";

/**
 * Единственный Layout платформы: одна рабочая область, а не несколько независимых
 * контейнеров. Вся навигация находится в шапке (ТЗ главной v1.2, §7); боковое
 * меню удалено и не заменяется другим постоянным блоком.
 *
 * Ограничение ширины и центрирование задаются ОДИН раз — на всю область целиком,
 * поэтому шапка, контент и футер лежат в одной системе координат. Не добавлять
 * сюда вложенные max-width — они создадут вторую систему координат.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className={`flex min-h-screen flex-col ${WORKSPACE}`}>
        <TopNav />
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:px-7">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
