import { CooperationRolePage } from "@/components/cooperation/cooperation-role-page";
import { associationClinicsPage } from "@/lib/association-content";
import { cooperationTrackingFromSearchParams, type CooperationSearchParams } from "@/lib/cooperation/page-data";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: associationClinicsPage.title,
  description: associationClinicsPage.intro,
  path: "/cooperation/clinic",
});

export default async function CooperationClinicPage({ searchParams }: { searchParams: Promise<CooperationSearchParams> }) {
  const tracking = cooperationTrackingFromSearchParams(await searchParams, "/cooperation/clinic", associationClinicsPage.title);
  return <CooperationRolePage participantType="CLINIC" tracking={tracking} />;
}
