import { LeftSidebar } from "@/components/layout/left-sidebar";
import { TopNav } from "@/components/layout/top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <LeftSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:px-7">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
