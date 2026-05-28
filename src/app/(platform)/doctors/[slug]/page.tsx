import { notFound } from "next/navigation";
import { DoctorTemplate } from "@/components/templates/doctor-template";
import { getDoctor, doctorFullName } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const doctor = await getDoctor(slug);
  if (!doctor) return {};
  const name = doctorFullName(doctor);
  return createPageMetadata({
    title: name,
    description: doctor.bio?.slice(0, 160) ?? name,
    path: `/doctors/${slug}`,
  });
}

export default async function DoctorPage({ params }: Props) {
  const { slug } = await params;
  const doctor = await getDoctor(slug);
  if (!doctor) notFound();
  return <DoctorTemplate data={doctor} />;
}
