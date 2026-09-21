import Link from "next/link";
import { EntityBlock } from "@/components/entity/entity-block";
import { requireParticipantUser } from "@/lib/participant-auth";

export const metadata = { title: "Кабинет", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function CabinetPage() {
  const user = await requireParticipantUser();
  return <div className="space-y-5"><div><p className="text-sm font-medium text-primary">Здравствуйте, {user.displayName}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Ваш кабинет</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Здесь отображаются только профили и доступы, подтверждённые Ассоциацией.</p></div><div className="grid gap-5 lg:grid-cols-2"><EntityBlock title="Подтверждённые профили"><div className="space-y-3">{user.doctorLinks.map((link) => <Link className="block rounded-lg border border-border p-3 hover:border-primary/50" href={`/doctors/${link.doctor.slug}`} key={link.id}><span className="text-xs font-semibold uppercase tracking-wide text-primary">Профиль врача</span><span className="mt-1 block font-medium">{[link.doctor.lastName, link.doctor.firstName, link.doctor.middleName].filter(Boolean).join(" ")}</span></Link>)}{user.clinicAccesses.map((access) => <Link className="block rounded-lg border border-border p-3 hover:border-primary/50" href={`/clinics/${access.clinic.slug}`} key={access.id}><span className="text-xs font-semibold uppercase tracking-wide text-primary">Доступ представителя клиники</span><span className="mt-1 block font-medium">{access.clinic.title}</span></Link>)}{!user.doctorLinks.length && !user.clinicAccesses.length && <p className="text-sm text-muted-foreground">Подтверждённых публичных профилей пока нет.</p>}</div></EntityBlock><EntityBlock title="Следующие действия"><div className="space-y-3 text-sm leading-6 text-muted-foreground"><p>Редактирование профилей, публикации и документы будут подключаться отдельными этапами после модерации.</p><Link className="inline-block font-medium text-primary hover:underline" href="/cooperation">Сведения о сотрудничестве →</Link></div></EntityBlock></div></div>;
}
