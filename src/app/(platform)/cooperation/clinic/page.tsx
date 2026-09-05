import type { Metadata } from "next";
import { CooperationRolePage } from "@/components/cooperation/cooperation-role-page";
import { cooperationTrackingFromSearchParams, type CooperationSearchParams } from "@/lib/cooperation/page-data";

export const metadata: Metadata = {
  title: "Сотрудничество для клиник — Ассоциация офтальмологических клиник",
  description: "Подайте заявку от офтальмологической клиники на участие в профессиональном сообществе Ассоциации.",
  alternates: { canonical: "/cooperation/clinic" },
};

export default async function CooperationClinicPage({ searchParams }: { searchParams: Promise<CooperationSearchParams> }) {
  const tracking = cooperationTrackingFromSearchParams(await searchParams, "/cooperation/clinic", "Сотрудничество для клиник");
  return <CooperationRolePage participantType="CLINIC" tracking={tracking} />;
}
