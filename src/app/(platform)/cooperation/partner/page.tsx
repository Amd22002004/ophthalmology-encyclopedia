import type { Metadata } from "next";
import { CooperationRolePage } from "@/components/cooperation/cooperation-role-page";
import { cooperationTrackingFromSearchParams, type CooperationSearchParams } from "@/lib/cooperation/page-data";

export const metadata: Metadata = {
  title: "Сотрудничество для поставщиков и технологических партнёров — Ассоциация офтальмологических клиник",
  description: "Предложите Ассоциации отраслевой, научный, образовательный или технологический проект.",
  alternates: { canonical: "/cooperation/partner" },
};

export default async function CooperationPartnerPage({ searchParams }: { searchParams: Promise<CooperationSearchParams> }) {
  const tracking = cooperationTrackingFromSearchParams(await searchParams, "/cooperation/partner", "Сотрудничество для партнёров");
  return <CooperationRolePage participantType="PARTNER" tracking={tracking} />;
}
