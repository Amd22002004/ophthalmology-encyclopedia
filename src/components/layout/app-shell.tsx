import { LeftSidebar } from "@/components/layout/left-sidebar";
import { SiteFooter } from "@/components/layout/site-footer";
import { TopNav } from "@/components/layout/top-nav";

/** Максимальная ширина всей рабочей области (сайдбар + шапка + контент). */
const WORKSPACE = "mx-auto w-full max-w-[1600px]";

/**
 * Единственный Layout платформы: одна рабочая область, а не три независимых контейнера.
 *
 * Ограничение ширины и центрирование задаются ОДИН раз — на всю область целиком,
 * поэтому сайдбар, шапка и контент лежат в одной системе координат и контент
 * начинается сразу за сайдбаром.
 *
 * Раньше ширину ограничивал вложенный `mx-auto max-w-7xl` вокруг {children}: он
 * центрировал контент внутри правой колонки, отрывая его от сайдбара (на 1920 —
 * пустая полоса ~169px). Не добавлять сюда вложенные max-width — они снова создадут
 * вторую систему координат.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className={`flex min-h-screen ${WORKSPACE}`}>
        <LeftSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:px-7">{children}</main>
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
