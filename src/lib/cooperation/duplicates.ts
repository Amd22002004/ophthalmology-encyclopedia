import "server-only";

import { getPrisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ValidatedCooperationApplication } from "./validation";

export async function findCooperationDuplicates(input: Pick<ValidatedCooperationApplication, "participantType" | "organizationName" | "inn" | "firstName" | "lastName" | "email" | "phone" | "professionalUrl">) {
  const db = getPrisma();
  if (!db) return { clinics: [], doctors: [] };
  const clinicOr: Prisma.ClinicWhereInput[] = [];
  if (input.inn) clinicOr.push({ inn: input.inn });
  if (input.organizationName) clinicOr.push({ OR: [{ title: { contains: input.organizationName, mode: "insensitive" } }, { legalName: { contains: input.organizationName, mode: "insensitive" } }] });
  if (input.email) clinicOr.push({ email: input.email });
  if (input.phone) clinicOr.push({ phone: input.phone });
  const doctorOr: Prisma.DoctorWhereInput[] = [];
  if (input.firstName && input.lastName) doctorOr.push({ firstName: { equals: input.firstName, mode: "insensitive" }, lastName: { equals: input.lastName, mode: "insensitive" } });
  if (input.professionalUrl) doctorOr.push({ OR: [{ siteUrl: input.professionalUrl }, { prodoctorovUrl: input.professionalUrl }] });

  const [clinics, doctors] = await Promise.all([
    clinicOr.length ? db.clinic.findMany({ where: { OR: clinicOr }, take: 10, select: { id: true, slug: true, title: true, city: true, inn: true } }) : Promise.resolve([]),
    doctorOr.length ? db.doctor.findMany({ where: { OR: doctorOr }, take: 10, select: { id: true, slug: true, firstName: true, lastName: true, middleName: true, region: true } }) : Promise.resolve([]),
  ]);
  return { clinics, doctors };
}
