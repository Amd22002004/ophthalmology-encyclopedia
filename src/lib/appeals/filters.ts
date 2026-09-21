import { APPEAL_STATUS_VALUES, type AppealStatusValue } from "./constants";

export type AppealFilterInput = {
  status?: string | null;
  investigationId?: string | null;
  clinicId?: string | null;
  clinic?: string | null;
  doctor?: string | null;
  equipment?: string | null;
  region?: string | null;
  from?: string | null;
  to?: string | null;
  query?: string | null;
};

export type AppealWhereCondition = Record<string, unknown>;
export type AppealWhereInput = { AND?: AppealWhereCondition[] };

function clean(value: string | null | undefined) {
  return value?.trim() || null;
}

function validDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildAppealWhereInput(input: AppealFilterInput): AppealWhereInput {
  const and: AppealWhereCondition[] = [];
  const status = clean(input.status);
  const investigationId = clean(input.investigationId);
  const clinicId = clean(input.clinicId);
  const clinic = clean(input.clinic);
  const doctor = clean(input.doctor);
  const equipment = clean(input.equipment);
  const region = clean(input.region);
  const query = clean(input.query);

  if (status && APPEAL_STATUS_VALUES.includes(status as AppealStatusValue)) and.push({ status });
  if (investigationId) and.push({ investigationId });
  if (clinicId) and.push({ clinicId });
  if (clinic) {
    const contains = { contains: clinic, mode: "insensitive" };
    and.push({
      OR: [
        { reportedClinicName: contains },
        { clinic: { is: { title: contains } } },
      ],
    });
  }
  if (doctor) and.push({ reportedDoctorName: { contains: doctor, mode: "insensitive" } });
  if (equipment) and.push({ reportedEquipmentName: { contains: equipment, mode: "insensitive" } });
  if (region) {
    and.push({
      OR: [
        { city: { contains: region, mode: "insensitive" } },
        { clinic: { is: { region: { contains: region, mode: "insensitive" } } } },
        { clinic: { is: { city: { contains: region, mode: "insensitive" } } } },
      ],
    });
  }

  const from = validDate(clean(input.from));
  const to = validDate(clean(input.to));
  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.gte = from;
    if (to) createdAt.lt = new Date(to.getTime() + 24 * 60 * 60 * 1000);
    and.push({ createdAt });
  }

  if (query) {
    const contains = { contains: query, mode: "insensitive" };
    and.push({
      OR: [
        { publicNumber: contains },
        { name: contains },
        { phone: contains },
        { email: contains },
        { description: contains },
        { reportedClinicName: contains },
        { reportedDoctorName: contains },
        { reportedEquipmentName: contains },
        { investigation: { is: { title: contains } } },
        { clinic: { is: { title: contains } } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}
