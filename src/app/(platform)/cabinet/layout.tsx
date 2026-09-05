import { requireParticipantUser } from "@/lib/participant-auth";
import { participantLogoutAction } from "../auth/login/actions";

export const dynamic = "force-dynamic";

export default async function CabinetLayout({ children }: { children: React.ReactNode }) {
  const user = await requireParticipantUser();
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-4 shadow-sm"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Личный кабинет</p><p className="mt-1 text-sm text-muted-foreground">{user.email}</p></div><form action={participantLogoutAction}><button className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted" type="submit">Выйти</button></form></div>{children}</div>;
}
