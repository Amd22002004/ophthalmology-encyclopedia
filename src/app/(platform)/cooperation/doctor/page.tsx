import type { Metadata } from "next";
import { CooperationRolePage } from "@/components/cooperation/cooperation-role-page";
import { getClinics } from "@/lib/loaders";
import { cooperationTrackingFromSearchParams, type CooperationSearchParams } from "@/lib/cooperation/page-data";

export const metadata: Metadata = {
  title: "Сотрудничество для врачей — Ассоциация офтальмологических клиник",
  description: "Подайте заявку врача или эксперта на участие в профессиональном сообществе Ассоциации офтальмологических клиник.",
  alternates: { canonical: "/cooperation/doctor" },
};

export default async function CooperationDoctorPage({ searchParams }: { searchParams: Promise<CooperationSearchParams> }) {
  const tracking = cooperationTrackingFromSearchParams(await searchParams, "/cooperation/doctor", "Сотрудничество для врачей");
  const clinicItems = await getClinics({ take: 100 });
  return <CooperationRolePage clinics={clinicItems.map((clinic) => ({ title: clinic.title, description: clinic.description }))} participantType="DOCTOR" tracking={tracking} />;
}
