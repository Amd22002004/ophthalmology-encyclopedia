import { CooperationRolePage } from "@/components/cooperation/cooperation-role-page";
import { associationDoctorsPage } from "@/lib/association-content";
import { getClinics } from "@/lib/loaders";
import { cooperationTrackingFromSearchParams, type CooperationSearchParams } from "@/lib/cooperation/page-data";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: associationDoctorsPage.title,
  description: associationDoctorsPage.intro,
  path: "/cooperation/doctor",
});

export default async function CooperationDoctorPage({ searchParams }: { searchParams: Promise<CooperationSearchParams> }) {
  const tracking = cooperationTrackingFromSearchParams(await searchParams, "/cooperation/doctor", associationDoctorsPage.title);
  const clinicItems = await getClinics({ take: 100 });
  return <CooperationRolePage clinics={clinicItems.map((clinic) => ({ title: clinic.title, description: clinic.description }))} participantType="DOCTOR" tracking={tracking} />;
}
