import { notFound } from "next/navigation";
import { DoctorTemplate } from "@/components/templates/doctor-template";
import { getDoctor, doctorFullName } from "@/lib/loaders";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

const CHURAKOV_SLUG = "churakov-timur-kasimovich";
const CHURAKOV_SEO_TITLE =
  "Чураков Тимур Касимович — врач-офтальмолог, офтальмохирург | Ассоциация офтальмологических клиник";
const CHURAKOV_SEO_DESCRIPTION =
  "Профессиональный профиль Чуракова Тимура Касимовича: рефракционная хирургия, лазерная коррекция зрения, заболевания роговицы, кератоконус, научные работы и квалификация.";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const doctor = await getDoctor(slug);
  if (!doctor) return {};
  const name = doctorFullName(doctor);
  const isChurakov = slug === CHURAKOV_SLUG;
  return createPageMetadata({
    title: isChurakov ? CHURAKOV_SEO_TITLE : name,
    description: isChurakov
      ? CHURAKOV_SEO_DESCRIPTION
      : doctor.bio?.slice(0, 160) ?? name,
    path: `/doctors/${slug}`,
    image: isChurakov ? "/doctors/churakov-timur-kasimovich.webp" : null,
    imageAlt: isChurakov ? "Портрет врача-офтальмолога Чуракова Тимура Касимовича" : undefined,
    imageWidth: isChurakov ? 1122 : undefined,
    imageHeight: isChurakov ? 1402 : undefined,
    absoluteTitle: isChurakov,
  });
}

export default async function DoctorPage({ params }: Props) {
  const { slug } = await params;
  const doctor = await getDoctor(slug);
  if (!doctor) notFound();
  return <DoctorTemplate data={doctor} />;
}
