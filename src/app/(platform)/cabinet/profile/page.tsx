import Link from "next/link";
import { EntityBlock } from "@/components/entity/entity-block";
import { requireParticipantUser } from "@/lib/participant-auth";

export const metadata = { title: "Профиль кабинета", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CabinetProfilePage() {
  const user = await requireParticipantUser();
  return <div className="space-y-5"><div><p className="text-sm font-medium text-primary">Профиль кабинета</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Связанные публичные сущности</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Публичная карточка остаётся единственным источником данных о Doctor и Clinic. Кабинет показывает подтверждённую связь и не создаёт копию профиля.</p></div><div className="grid gap-5 lg:grid-cols-2"><EntityBlock title="Врач"><div className="space-y-3">{user.doctorLinks.map((link) => <Link className="block rounded-lg border border-border p-3 hover:border-primary/50" href={`/doctors/${link.doctor.slug}`} key={link.id}>{[link.doctor.lastName, link.doctor.firstName, link.doctor.middleName].filter(Boolean).join(" ")} <span className="block text-xs text-muted-foreground">Открыть публичный профиль →</span></Link>)}{!user.doctorLinks.length && <p className="text-sm text-muted-foreground">Подтверждённой связи с профилем врача нет.</p>}</div></EntityBlock><EntityBlock title="Клиника"><div className="space-y-3">{user.clinicAccesses.map((access) => <Link className="block rounded-lg border border-border p-3 hover:border-primary/50" href={`/clinics/${access.clinic.slug}`} key={access.id}>{access.clinic.title}<span className="block text-xs text-muted-foreground">Роль: {access.role} · Открыть публичный профиль →</span></Link>)}{!user.clinicAccesses.length && <p className="text-sm text-muted-foreground">Подтверждённого доступа к профилю клиники нет.</p>}</div></EntityBlock></div></div>;
}
