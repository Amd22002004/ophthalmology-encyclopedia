import type { CatalogGridItem } from "@/components/catalog/catalog-grid";
import { getPrisma } from "@/lib/prisma";

// ─── Inferred detail types (used in template props) ───────────────────────────

export type DiseaseDetail = NonNullable<Awaited<ReturnType<typeof getDisease>>>;
export type ProcedureDetail = NonNullable<Awaited<ReturnType<typeof getProcedure>>>;
export type DoctorDetail = NonNullable<Awaited<ReturnType<typeof getDoctor>>>;
export type ClinicDetail = NonNullable<Awaited<ReturnType<typeof getClinic>>>;
export type SupplierDetail = NonNullable<Awaited<ReturnType<typeof getSupplier>>>;
export type EquipmentDetail = NonNullable<Awaited<ReturnType<typeof getEquipmentItem>>>;
export type PublicationDetail = NonNullable<Awaited<ReturnType<typeof getPublication>>>;
export type GuidelineDetail = NonNullable<Awaited<ReturnType<typeof getGuideline>>>;
export type RegulationDetail = NonNullable<Awaited<ReturnType<typeof getRegulation>>>;
export type HistoryEntryDetail = NonNullable<Awaited<ReturnType<typeof getHistoryEntry>>>;
export type InnovationDetail = NonNullable<Awaited<ReturnType<typeof getInnovation>>>;

// ─── Helper ───────────────────────────────────────────────────────────────────

export function doctorFullName(d: { firstName: string; lastName: string; middleName?: string | null }) {
  return [d.lastName, d.firstName, d.middleName].filter(Boolean).join(" ");
}

// ─── Diseases ─────────────────────────────────────────────────────────────────

export async function getDiseases(opts?: {
  categoryId?: string;
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.disease.findMany({
    where: opts?.categoryId ? { categoryId: opts.categoryId } : undefined,
    select: { slug: true, title: true, summary: true, icdCode: true },
    orderBy: { title: "asc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/diseases/${r.slug}`,
    title: r.title,
    description: r.summary ?? (r.icdCode ? `МКБ: ${r.icdCode}` : ""),
  }));
}

export async function getDisease(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.disease.findUnique({
    where: { slug },
    include: {
      category: { select: { slug: true, title: true } },
      procedures: {
        take: 6,
        include: { procedure: { select: { slug: true, title: true } } },
      },
      doctors: {
        take: 6,
        include: { doctor: { select: { slug: true, firstName: true, lastName: true } } },
      },
      guidelines: {
        take: 4,
        include: { guideline: { select: { slug: true, title: true } } },
      },
      publications: {
        take: 4,
        include: { publication: { select: { slug: true, title: true } } },
      },
    },
  });
}

// ─── Procedures ───────────────────────────────────────────────────────────────

export async function getProcedures(opts?: {
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.procedure.findMany({
    select: {
      slug: true,
      title: true,
      summary: true,
      category: { select: { title: true } },
    },
    orderBy: { title: "asc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/procedures/${r.slug}`,
    title: r.title,
    description: r.summary ?? r.category?.title ?? "",
  }));
}

export async function getProcedure(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.procedure.findUnique({
    where: { slug },
    include: {
      category: { select: { slug: true, title: true } },
      diseases: {
        take: 6,
        include: { disease: { select: { slug: true, title: true } } },
      },
      doctors: {
        take: 6,
        include: { doctor: { select: { slug: true, firstName: true, lastName: true } } },
      },
      equipment: {
        take: 4,
        include: { equipment: { select: { slug: true, title: true } } },
      },
    },
  });
}

// ─── Doctors ──────────────────────────────────────────────────────────────────

export async function getDoctors(opts?: {
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.doctor.findMany({
    select: {
      slug: true,
      firstName: true,
      lastName: true,
      middleName: true,
      bio: true,
      region: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/doctors/${r.slug}`,
    title: doctorFullName(r),
    description: r.region ?? r.bio?.slice(0, 120) ?? "",
  }));
}

export async function getDoctor(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.doctor.findUnique({
    where: { slug },
    include: {
      regionEntity: { select: { slug: true, title: true } },
      specialties: {
        include: { specialty: { select: { slug: true, title: true } } },
      },
      clinics: {
        take: 6,
        include: { clinic: { select: { slug: true, title: true } } },
      },
      diseases: {
        take: 6,
        include: { disease: { select: { slug: true, title: true } } },
      },
      procedures: {
        take: 6,
        include: { procedure: { select: { slug: true, title: true } } },
      },
      publications: {
        take: 4,
        select: { slug: true, title: true, publishedAt: true },
      },
    },
  });
}

// ─── Clinics ──────────────────────────────────────────────────────────────────

export async function getClinics(opts?: {
  omsEnabled?: boolean;
  contractBased?: boolean;
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.clinic.findMany({
    where: {
      ...(opts?.omsEnabled != null ? { omsEnabled: opts.omsEnabled } : {}),
      ...(opts?.contractBased != null ? { contractBased: opts.contractBased } : {}),
    },
    select: { slug: true, title: true, description: true, region: true },
    orderBy: { title: "asc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/clinics/${r.slug}`,
    title: r.title,
    description: r.region ?? r.description ?? "",
  }));
}

export async function getClinic(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.clinic.findUnique({
    where: { slug },
    include: {
      regionEntity: { select: { slug: true, title: true } },
      specialties: {
        include: { specialty: { select: { slug: true, title: true } } },
      },
      doctors: {
        take: 10,
        include: { doctor: { select: { slug: true, firstName: true, lastName: true } } },
      },
    },
  });
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers(opts?: {
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.supplier.findMany({
    select: { slug: true, title: true, description: true, website: true },
    orderBy: { title: "asc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/suppliers/${r.slug}`,
    title: r.title,
    description: r.description ?? r.website ?? "",
  }));
}

export async function getSupplier(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.supplier.findUnique({
    where: { slug },
    include: {
      categories: {
        include: { category: { select: { slug: true, title: true } } },
      },
      equipment: {
        take: 10,
        select: { slug: true, title: true, summary: true },
      },
    },
  });
}

// ─── Equipment ────────────────────────────────────────────────────────────────

export async function getEquipmentList(opts?: {
  categoryId?: string;
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.equipment.findMany({
    where: opts?.categoryId ? { categoryId: opts.categoryId } : undefined,
    select: {
      slug: true,
      title: true,
      summary: true,
      category: { select: { title: true } },
    },
    orderBy: { title: "asc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/equipment/${r.slug}`,
    title: r.title,
    description: r.summary ?? r.category?.title ?? "",
  }));
}

export async function getEquipmentItem(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.equipment.findUnique({
    where: { slug },
    include: {
      category: { select: { slug: true, title: true } },
      supplier: { select: { slug: true, title: true } },
      procedures: {
        take: 6,
        include: { procedure: { select: { slug: true, title: true } } },
      },
    },
  });
}

// ─── Publications ─────────────────────────────────────────────────────────────

export async function getPublications(opts?: {
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.publication.findMany({
    select: { slug: true, title: true, abstract: true, authorName: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/publications/${r.slug}`,
    title: r.title,
    description: r.abstract?.slice(0, 150) ?? r.authorName ?? "",
  }));
}

export async function getPublication(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.publication.findUnique({
    where: { slug },
    include: {
      doctor: { select: { slug: true, firstName: true, lastName: true } },
      diseases: {
        take: 4,
        include: { disease: { select: { slug: true, title: true } } },
      },
      procedures: {
        take: 4,
        include: { procedure: { select: { slug: true, title: true } } },
      },
    },
  });
}

// ─── Guidelines ───────────────────────────────────────────────────────────────

export async function getGuidelines(opts?: {
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.clinicalGuideline.findMany({
    select: { slug: true, title: true, summary: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/guidelines/${r.slug}`,
    title: r.title,
    description: r.summary ?? "",
  }));
}

export async function getGuideline(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.clinicalGuideline.findUnique({
    where: { slug },
    include: {
      diseases: {
        take: 6,
        include: { disease: { select: { slug: true, title: true } } },
      },
    },
  });
}

// ─── Regulations ──────────────────────────────────────────────────────────────

export async function getRegulations(opts?: {
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.regulation.findMany({
    select: { slug: true, title: true, summary: true, documentType: true },
    orderBy: { title: "asc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/regulations/${r.slug}`,
    title: r.title,
    description: r.summary ?? r.documentType ?? "",
  }));
}

export async function getRegulation(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.regulation.findUnique({ where: { slug } });
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getHistoryEntries(opts?: {
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.historyEntry.findMany({
    select: { slug: true, title: true, summary: true, period: true },
    orderBy: { title: "asc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/history/${r.slug}`,
    title: r.title,
    description: r.summary ?? r.period ?? "",
  }));
}

export async function getHistoryEntry(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.historyEntry.findUnique({ where: { slug } });
}

// ─── Innovations ──────────────────────────────────────────────────────────────

export async function getInnovations(opts?: {
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.innovation.findMany({
    select: { slug: true, title: true, summary: true },
    orderBy: { publishedAt: "desc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/innovations/${r.slug}`,
    title: r.title,
    description: r.summary ?? "",
  }));
}

export async function getInnovation(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.innovation.findUnique({ where: { slug } });
}

// ─── Taxonomy ─────────────────────────────────────────────────────────────────

export async function getDiseaseCategories() {
  const db = getPrisma();
  if (!db) return [];
  return db.diseaseCategory.findMany({
    select: { id: true, slug: true, title: true, description: true },
    orderBy: { title: "asc" },
  });
}

export async function getProcedureCategories() {
  const db = getPrisma();
  if (!db) return [];
  return db.procedureCategory.findMany({
    select: { id: true, slug: true, title: true },
    orderBy: { title: "asc" },
  });
}

export async function getEquipmentCategories() {
  const db = getPrisma();
  if (!db) return [];
  return db.equipmentCategory.findMany({
    select: { id: true, slug: true, title: true },
    orderBy: { title: "asc" },
  });
}

export async function getSpecialties() {
  const db = getPrisma();
  if (!db) return [];
  return db.specialty.findMany({
    select: { id: true, slug: true, title: true },
    orderBy: { title: "asc" },
  });
}

export async function getRegions() {
  const db = getPrisma();
  if (!db) return [];
  return db.region.findMany({
    select: { id: true, slug: true, title: true },
    orderBy: { title: "asc" },
  });
}

// ─── Counts (for home page stats bar) ────────────────────────────────────────

export async function getEntityCounts() {
  const db = getPrisma();
  if (!db) {
    return { diseases: 0, procedures: 0, doctors: 0, clinics: 0, suppliers: 0, equipment: 0, publications: 0 };
  }
  const [diseases, procedures, doctors, clinics, suppliers, equipment, publications] =
    await Promise.all([
      db.disease.count(),
      db.procedure.count(),
      db.doctor.count(),
      db.clinic.count(),
      db.supplier.count(),
      db.equipment.count(),
      db.publication.count(),
    ]);
  return { diseases, procedures, doctors, clinics, suppliers, equipment, publications };
}
