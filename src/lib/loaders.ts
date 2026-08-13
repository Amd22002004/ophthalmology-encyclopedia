import type { CatalogGridItem } from "@/components/catalog/catalog-grid";
import { getPrisma } from "@/lib/prisma";
import { getEquipmentEditorial } from "@/lib/equipment-editorial";
import {
  evidenceValidatedContentWhere,
  isPubliclyVisibleAt,
  publishedContentWhere,
} from "@/lib/publication-gate";
import {
  publicInvestigationEquipmentInstanceWhere,
  publicInvestigationRelationWhere,
  publicRegulatoryCheckWhere,
  publicRegulationWhere,
  publicRegulationSourceWhere,
} from "@/lib/regulations/public-filters";
import {
  canPublishInvestigationAssessment,
  canPublishRegulationProvision,
} from "@/lib/regulations/publication";
import { publicScientificWorkWhere } from "@/lib/scientific-work-publication";
import {
  publicIndependentControlAssessmentWhere,
  publicIndependentControlCriterionNormWhere,
  publicIndependentControlCriterionWhere,
  publicIndependentControlMethodologyWhere,
  publicIndependentControlSourceWhere,
} from "@/lib/independent-control/public-filters";
import {
  canPublishIndependentControlAssessment,
  canPublishIndependentControlMethodology,
} from "@/lib/independent-control/publication";

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
export type InvestigationDetail = NonNullable<Awaited<ReturnType<typeof getInvestigation>>>;
export type NewsDetail = NonNullable<Awaited<ReturnType<typeof getNewsItem>>>;

// ─── Helper ───────────────────────────────────────────────────────────────────

export function doctorFullName(d: { firstName: string; lastName: string; middleName?: string | null }) {
  return [d.lastName, d.firstName, d.middleName].filter(Boolean).join(" ");
}

function independentControlNormRole(
  role: "DIRECT_BASIS" | "SUPPORTING_BASIS" | "HISTORICAL_BASIS",
) {
  if (role === "DIRECT_BASIS") return "DIRECT_REQUIREMENT" as const;
  if (role === "HISTORICAL_BASIS") return "HISTORICAL_CONTEXT" as const;
  return "CONTEXT" as const;
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
      equipment: {
        include: { equipment: { select: { slug: true, title: true, manufacturer: true } } },
      },
      // Заболевание → Научные работы (прямая связь по теме работы)
      scientificWorks: {
        where: { work: publicScientificWorkWhere() },
        include: {
          work: {
            select: {
              slug: true,
              title: true,
              type: true,
              year: true,
              doctor: { select: { slug: true, firstName: true, lastName: true, middleName: true } },
            },
          },
        },
      },
      investigations: {
        where: {
          ...publicInvestigationRelationWhere(),
          investigation: evidenceValidatedContentWhere(),
        },
        orderBy: { investigation: { publishedAt: "desc" } },
        include: {
          investigation: {
            select: {
              slug: true,
              title: true,
              summary: true,
              status: true,
              documents: {
                where: {
                  isEvidence: true,
                  ...evidenceValidatedContentWhere(),
                },
                orderBy: { sortOrder: "asc" },
                select: {
                  slug: true,
                  kind: true,
                  title: true,
                  summary: true,
                  source: true,
                  documentDate: true,
                  mimeType: true,
                },
              },
              clinics: {
                where: publicInvestigationRelationWhere(),
                select: { clinic: { select: { slug: true, title: true, city: true } } },
              },
              equipment: {
                where: publicInvestigationRelationWhere(),
                select: {
                  equipment: { select: { slug: true, title: true, manufacturer: true } },
                },
              },
              procedures: {
                where: publicInvestigationRelationWhere(),
                select: { procedure: { select: { slug: true, title: true } } },
              },
              diseases: {
                where: publicInvestigationRelationWhere(),
                select: { disease: { select: { slug: true, title: true } } },
              },
            },
          },
        },
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
      // Процедура → Научные работы (прямая связь по теме работы)
      scientificWorks: {
        where: { work: publicScientificWorkWhere() },
        include: {
          work: {
            select: {
              slug: true,
              title: true,
              type: true,
              year: true,
              doctor: { select: { slug: true, firstName: true, lastName: true, middleName: true } },
            },
          },
        },
      },
      investigations: {
        where: {
          ...publicInvestigationRelationWhere(),
          investigation: evidenceValidatedContentWhere(),
        },
        orderBy: { investigation: { publishedAt: "desc" } },
        include: {
          investigation: {
            select: {
              slug: true,
              title: true,
              summary: true,
              status: true,
              documents: {
                where: {
                  isEvidence: true,
                  ...evidenceValidatedContentWhere(),
                },
                orderBy: { sortOrder: "asc" },
                select: {
                  slug: true,
                  kind: true,
                  title: true,
                  summary: true,
                  source: true,
                  documentDate: true,
                  mimeType: true,
                },
              },
              clinics: {
                where: publicInvestigationRelationWhere(),
                select: { clinic: { select: { slug: true, title: true, city: true } } },
              },
              equipment: {
                where: publicInvestigationRelationWhere(),
                select: { equipment: { select: { slug: true, title: true, manufacturer: true } } },
              },
              procedures: {
                where: publicInvestigationRelationWhere(),
                select: { procedure: { select: { slug: true, title: true } } },
              },
              diseases: {
                where: publicInvestigationRelationWhere(),
                select: { disease: { select: { slug: true, title: true } } },
              },
            },
          },
        },
      },
    },
  });
}

// ─── Doctors ──────────────────────────────────────────────────────────────────

// Расширенный тип для каталога врачей с фото
export type DoctorCatalogItem = {
  slug: string;
  fullName: string;
  position: string | null;
  category: string | null;
  photoUrl: string | null;
  experienceYears: number | null;
  specialties: string[];
  cities: string[];
};

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

export async function getDoctorsCatalog(opts?: {
  take?: number;
  skip?: number;
}): Promise<DoctorCatalogItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.doctor.findMany({
    select: {
      slug: true,
      firstName: true,
      lastName: true,
      middleName: true,
      photoUrl: true,
      position: true,
      category: true,
      experienceYears: true,
      specialties: {
        take: 3,
        include: { specialty: { select: { title: true } } },
      },
      clinics: {
        take: 5,
        include: { clinic: { select: { city: true } } },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    slug: r.slug,
    fullName: doctorFullName(r),
    position: r.position,
    category: r.category,
    photoUrl: r.photoUrl,
    experienceYears: r.experienceYears,
    specialties: r.specialties.map((s) => s.specialty.title),
    cities: [...new Set(r.clinics.map((c) => c.clinic.city).filter(Boolean) as string[])],
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
        take: 10,
        include: {
          clinic: {
            select: { slug: true, title: true, city: true, region: true, phones: true, website: true, networkName: true },
          },
        },
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
      scientificWorks: {
        where: publicScientificWorkWhere(),
        orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
        include: {
          diseases: {
            include: { disease: { select: { slug: true, title: true } } },
          },
          procedures: {
            include: { procedure: { select: { slug: true, title: true } } },
          },
          equipment: {
            include: {
              equipment: {
                select: { slug: true, title: true, manufacturer: true, images: true },
              },
            },
          },
        },
      },
      equipment: {
        include: {
          equipment: {
            select: { slug: true, title: true, manufacturer: true, images: true },
          },
        },
      },
    },
  });
}

// ─── Clinics ──────────────────────────────────────────────────────────────────

export type PublishedInvestigationReference = {
  slug: string;
  title: string;
  summary: string;
  status: string;
};

export type ClinicCardData = {
  slug: string;
  title: string;
  legalName: string | null;
  city: string | null;
  region: string | null;
  clinicType: string | null;
  networkName: string | null;
  status: string;
  omsEnabled: boolean;
  phones: string[];
  email: string | null;
  website: string | null;
  address: string | null;
  inn: string | null;
  license: string | null;
  logoUrl: string | null;
  specializationTags: string[];
  investigations: PublishedInvestigationReference[];
};

export async function getClinicsCatalog(): Promise<ClinicCardData[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.clinic.findMany({
    where: { status: "active" },
    select: {
      slug: true,
      title: true,
      legalName: true,
      city: true,
      region: true,
      clinicType: true,
      networkName: true,
      status: true,
      omsEnabled: true,
      phones: true,
      email: true,
      website: true,
      address: true,
      inn: true,
      license: true,
      logoUrl: true,
      specializationTags: true,
      investigations: {
        where: {
          ...publicInvestigationRelationWhere(),
          investigation: evidenceValidatedContentWhere(),
        },
        orderBy: { investigation: { publishedAt: "desc" } },
        select: {
          investigation: {
            select: { slug: true, title: true, summary: true, status: true },
          },
        },
      },
    },
    orderBy: { title: "asc" },
  });

  return rows.map(({ investigations, ...clinic }) => ({
    ...clinic,
    investigations: investigations.map((relation) => relation.investigation),
  }));
}

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
      status: "active",
      ...(opts?.omsEnabled != null ? { omsEnabled: opts.omsEnabled } : {}),
      ...(opts?.contractBased != null ? { contractBased: opts.contractBased } : {}),
    },
    select: { slug: true, title: true, description: true, region: true, city: true },
    orderBy: { title: "asc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.map((r) => ({
    href: `/clinics/${r.slug}`,
    title: r.title,
    description: r.city ? `${r.city} · ${r.region ?? ""}` : (r.region ?? r.description ?? ""),
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
        take: 12,
        include: {
          doctor: {
            select: {
              slug: true,
              firstName: true,
              lastName: true,
              middleName: true,
              photoUrl: true,
              experienceYears: true,
              position: true,
              category: true,
              // Клиника → Научные работы: через врачей, работающих в клинике
              scientificWorks: {
                where: publicScientificWorkWhere(),
                select: { slug: true, title: true, type: true, year: true },
                orderBy: { year: "desc" },
              },
            },
          },
        },
      },
      procedures: {
        take: 12,
        include: { procedure: { select: { slug: true, title: true, summary: true } } },
      },
      diseases: {
        take: 12,
        include: { disease: { select: { slug: true, title: true, summary: true } } },
      },
      publications: {
        take: 6,
        include: {
          publication: {
            select: { slug: true, title: true, abstract: true, publishedAt: true },
          },
        },
      },
      equipment: {
        include: {
          equipment: {
            select: { slug: true, title: true, manufacturer: true, country: true, images: true },
          },
        },
      },
      investigations: {
        where: {
          ...publicInvestigationRelationWhere(),
          investigation: evidenceValidatedContentWhere(),
        },
        orderBy: { investigation: { publishedAt: "desc" } },
        include: {
          investigation: {
            select: {
              slug: true,
              title: true,
              summary: true,
              status: true,
              documents: {
                where: {
                  isEvidence: true,
                  ...evidenceValidatedContentWhere(),
                },
                orderBy: { sortOrder: "asc" },
                select: {
                  slug: true,
                  kind: true,
                  title: true,
                  summary: true,
                  source: true,
                  documentDate: true,
                  mimeType: true,
                },
              },
              clinics: {
                where: publicInvestigationRelationWhere(),
                select: { clinic: { select: { slug: true, title: true, city: true } } },
              },
              equipment: {
                where: publicInvestigationRelationWhere(),
                select: { equipment: { select: { slug: true, title: true, manufacturer: true } } },
              },
              procedures: {
                where: publicInvestigationRelationWhere(),
                select: { procedure: { select: { slug: true, title: true } } },
              },
              diseases: {
                where: publicInvestigationRelationWhere(),
                select: { disease: { select: { slug: true, title: true } } },
              },
            },
          },
        },
      },
    },
  });
}

export type ClinicDbDetail = NonNullable<Awaited<ReturnType<typeof getClinic>>>;

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
  const item = await db.equipment.findUnique({
    where: { slug },
    include: {
      category: { select: { slug: true, title: true } },
      supplier: { select: { slug: true, title: true } },
      specs: { orderBy: { sortOrder: "asc" } },
      procedures: {
        include: { procedure: { select: { slug: true, title: true, summary: true } } },
      },
      clinics: {
        include: {
          clinic: {
            select: { slug: true, title: true, city: true, networkName: true, logoUrl: true },
          },
        },
      },
      diseases: {
        include: { disease: { select: { slug: true, title: true, summary: true } } },
      },
      doctors: {
        include: {
          doctor: {
            select: {
              slug: true,
              firstName: true,
              lastName: true,
              middleName: true,
              photoUrl: true,
              position: true,
              category: true,
            },
          },
        },
      },
      investigations: {
        where: {
          ...publicInvestigationRelationWhere(),
          investigation: evidenceValidatedContentWhere(),
        },
        orderBy: { investigation: { publishedAt: "desc" } },
        include: {
          investigation: {
            select: {
              slug: true,
              title: true,
              summary: true,
              status: true,
              news: {
                where: { news: publishedContentWhere() },
                orderBy: { news: { publishedAt: "desc" } },
                select: {
                  news: { select: { slug: true, title: true, summary: true, publishedAt: true } },
                },
              },
            },
          },
        },
      },
      scientificWorks: {
        where: { work: publicScientificWorkWhere() },
        include: {
          work: {
            select: {
              slug: true,
              title: true,
              type: true,
              year: true,
              summary: true,
              doctor: {
                select: { slug: true, firstName: true, lastName: true, middleName: true },
              },
            },
          },
        },
      },
    },
  });

  if (!item) return null;

  // Серия и позиция в линии хранятся как характеристики EquipmentSpec. Это
  // позволяет выводить эволюцию для любой линейки без self-relation, нового
  // поля или привязки к конкретному производителю. Год остаётся fallback для
  // линии, у которой пока не задана редакционная позиция.
  const series = item.specs.find(
    (spec) => spec.group === "Идентификация линейки" && spec.label === "Серия",
  )?.value;
  const editorial = getEquipmentEditorial(item.slug);
  const comparisonTitles = editorial?.comparisonTargets?.map((target) => target.title) ?? [];

  const [evolutionRows, comparisonEquipment] = await Promise.all([
    series
      ? db.equipment.findMany({
          where: {
            categoryId: item.categoryId,
            specs: {
              some: {
                group: "Идентификация линейки",
                label: "Серия",
                value: series,
              },
            },
          },
          select: {
            slug: true,
            title: true,
            summary: true,
            year: true,
            images: true,
            specs: {
              where: { group: "Идентификация линейки", label: "Позиция в линии" },
              select: { value: true },
            },
          },
        })
      : Promise.resolve([]),
    comparisonTitles.length > 0
      ? db.equipment.findMany({
          where: { title: { in: comparisonTitles } },
          select: { slug: true, title: true, summary: true, year: true, images: true },
        })
      : Promise.resolve([]),
  ]);

  const evolution = evolutionRows
    .sort((left, right) => {
      const leftPosition = Number(left.specs[0]?.value);
      const rightPosition = Number(right.specs[0]?.value);
      const normalizedLeft = Number.isFinite(leftPosition) ? leftPosition : Number.MAX_SAFE_INTEGER;
      const normalizedRight = Number.isFinite(rightPosition) ? rightPosition : Number.MAX_SAFE_INTEGER;
      return normalizedLeft - normalizedRight || (left.year ?? Number.MAX_SAFE_INTEGER) - (right.year ?? Number.MAX_SAFE_INTEGER) || left.title.localeCompare(right.title, "ru");
    })
    .map((equipment) => ({
      slug: equipment.slug,
      title: equipment.title,
      summary: equipment.summary,
      year: equipment.year,
      images: equipment.images,
    }));

  return { ...item, evolution, comparisonEquipment };
}
// ─── Investigations and news ─────────────────────────────────────────────────

export type InvestigationCatalogItem = {
  slug: string;
  title: string;
  summary: string;
  status: string;
  publishedAt: Date | null;
  clinicCount: number;
  equipmentCount: number;
  appealCount: number;
};

export async function getInvestigations(opts?: { take?: number; skip?: number }): Promise<InvestigationCatalogItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.investigation.findMany({
    where: evidenceValidatedContentWhere(),
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
    select: {
      slug: true,
      title: true,
      summary: true,
      status: true,
      publishedAt: true,
      _count: {
        select: {
          clinics: { where: publicInvestigationRelationWhere() },
          equipment: { where: publicInvestigationRelationWhere() },
          appeals: true,
        },
      },
    },
  });
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    status: row.status,
    publishedAt: row.publishedAt,
    clinicCount: row._count.clinics,
    equipmentCount: row._count.equipment,
    appealCount: row._count.appeals,
  }));
}

export async function getInvestigation(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  const now = new Date();
  const published = publishedContentWhere(now);
  const investigation = await db.investigation.findFirst({
    where: { slug, ...evidenceValidatedContentWhere(now) },
    include: {
      sections: {
        where: { evidenceValidatedAt: { not: null }, ...published },
        orderBy: { sortOrder: "asc" },
      },
      timeline: {
        where: { evidenceValidatedAt: { not: null }, ...published },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          equipmentInstanceId: true,
          date: true,
          dateLabel: true,
          title: true,
          description: true,
          equipmentInstance: {
            select: {
              id: true,
              model: true,
              serialNumber: true,
            },
          },
        },
      },
      documents: {
        where: { isEvidence: true, evidenceValidatedAt: { not: null }, ...published },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          slug: true,
          kind: true,
          title: true,
          summary: true,
          source: true,
          documentDate: true,
          fileUrl: true,
          previewImageUrl: true,
          mimeType: true,
          content: true,
          isEvidence: true,
        },
      },
      clinics: {
        where: publicInvestigationRelationWhere(now),
        include: { clinic: { select: { slug: true, title: true, city: true, legalName: true } } },
      },
      equipment: {
        where: publicInvestigationRelationWhere(now),
        include: { equipment: { select: { slug: true, title: true, manufacturer: true } } },
      },
      equipmentInstances: {
        where: publicInvestigationEquipmentInstanceWhere(now),
        orderBy: [{ manufactureYear: "asc" }, { model: "asc" }],
        include: {
          equipment: { select: { slug: true, title: true, manufacturer: true } },
          identificationEvidence: {
            where: {
              ...evidenceValidatedContentWhere(now),
              document: {
                isEvidence: true,
                ...evidenceValidatedContentWhere(now),
              },
            },
            include: {
              document: {
                select: {
                  slug: true,
                  title: true,
                  source: true,
                  documentDate: true,
                },
              },
            },
          },
        },
      },
      regulatoryAssessments: {
        where: {
          ...published,
          evidenceValidatedAt: { not: null },
          applicabilityStatus: "APPLICABLE",
          supportingEvidenceSearchCompleted: true,
          refutingEvidenceSearchCompleted: true,
          appliedEdition: published,
          regulatoryCheck: {
            ...published,
            provision: {
              ...published,
              edition: { ...published, regulation: published },
            },
          },
          AND: [
            {
              OR: [
                { clinicId: null },
                {
                  investigationClinic: {
                    is: publicInvestigationRelationWhere(now),
                  },
                },
              ],
            },
            {
              OR: [
                { procedureId: null },
                {
                  investigationProcedure: {
                    is: publicInvestigationRelationWhere(now),
                  },
                },
              ],
            },
            {
              OR: [
                { equipmentInstanceId: null },
                {
                  equipmentInstance: {
                    is: publicInvestigationEquipmentInstanceWhere(now),
                  },
                },
              ],
            },
          ],
        },
        orderBy: [{ eventFrom: "asc" }, { createdAt: "asc" }],
        include: {
          regulatoryCheck: {
            include: {
              provision: {
                include: {
                  edition: { include: { regulation: true } },
                  topic: true,
                },
              },
            },
          },
          appliedEdition: true,
          investigationClinic: {
            include: { clinic: { select: { slug: true, title: true } } },
          },
          investigationProcedure: {
            include: { procedure: { select: { slug: true, title: true } } },
          },
          equipmentInstance: {
            select: {
              equipmentId: true,
              isPublished: true,
              publishedAt: true,
              identificationEvidence: {
                where: {
                  ...evidenceValidatedContentWhere(now),
                  document: {
                    isEvidence: true,
                    ...evidenceValidatedContentWhere(now),
                  },
                },
                select: { documentId: true },
                take: 1,
              },
            },
          },
          evidence: {
            where: {
              provenanceVerifiedAt: { not: null },
              document: {
                isEvidence: true,
                evidenceValidatedAt: { not: null },
                ...published,
              },
            },
            select: {
              documentId: true,
              role: true,
              isPrimary: true,
              provenanceVerifiedAt: true,
              note: true,
              document: { select: { slug: true, title: true, source: true, documentDate: true } },
            },
          },
          registryChecks: {
            where: {
              ...published,
              snapshotDocument: {
                is: {
                  isEvidence: true,
                  evidenceValidatedAt: { not: null },
                  ...published,
                },
              },
            },
            orderBy: { searchedAt: "desc" },
            select: {
              id: true,
              registryName: true,
              query: true,
              searchedAt: true,
              officialUrl: true,
              result: true,
              resultSummary: true,
            },
          },
        },
      },
      independentControlAssessments: {
        where: publicIndependentControlAssessmentWhere(now),
        orderBy: [{ eventFrom: "asc" }, { createdAt: "asc" }],
        select: {
          key: true,
          appliedCriterionNormId: true,
          clinicId: true,
          eventFrom: true,
          eventTo: true,
          eventDateLabel: true,
          status: true,
          applicabilityStatus: true,
          restrictedSignals: true,
          neutralConclusion: true,
          alternativeVersion: true,
          evidenceGaps: true,
          supportingEvidenceSearchCompleted: true,
          refutingEvidenceSearchCompleted: true,
          isPublished: true,
          evidenceValidatedAt: true,
          publishedAt: true,
          appliedCriterionNorm: { select: { id: true } },
          investigationClinic: {
            select: {
              isPublished: true,
              publishedAt: true,
              evidenceValidatedAt: true,
              clinic: { select: { slug: true, title: true } },
            },
          },
          criterion: {
            select: {
              key: true,
              sourceLocator: true,
              sectionKey: true,
              sectionTitle: true,
              title: true,
              statement: true,
              whatIsChecked: true,
              checkQuestion: true,
              factToEstablish: true,
              confirmingDocument: true,
              evidenceRequired: true,
              evidenceThreshold: true,
              applicabilityNote: true,
              sourceDivergenceNote: true,
              basisKind: true,
              allowedStatuses: true,
              isSourceCriterion: true,
              effectiveFrom: true,
              effectiveTo: true,
              isPublished: true,
              evidenceValidatedAt: true,
              publishedAt: true,
              sortOrder: true,
              methodology: {
                select: {
                  slug: true,
                  title: true,
                  summary: true,
                  legalStatusNote: true,
                  bibliographicCitation: true,
                  officialMethodologyUrl: true,
                },
              },
              normLinks: {
                where: publicIndependentControlCriterionNormWhere(now),
                orderBy: [{ role: "asc" }, { verifiedAt: "desc" }],
                select: {
                  id: true,
                  role: true,
                  verifiedAt: true,
                  note: true,
                  isPublished: true,
                  evidenceValidatedAt: true,
                  publishedAt: true,
                  regulatoryCheck: {
                    select: {
                      key: true,
                      question: true,
                      factToEstablish: true,
                      primaryEvidenceType: true,
                      evidenceThreshold: true,
                      applicabilityNote: true,
                      officialSearchUrl: true,
                      officialSearchLabel: true,
                      nonCompliancePattern: true,
                      isPublished: true,
                      publishedAt: true,
                      provision: {
                        select: {
                          key: true,
                          locator: true,
                          title: true,
                          requirement: true,
                          applicability: true,
                          effectiveFrom: true,
                          effectiveTo: true,
                          isPublished: true,
                          publishedAt: true,
                          edition: {
                            select: {
                              key: true,
                              title: true,
                              effectiveFrom: true,
                              effectiveTo: true,
                              verifiedAt: true,
                              historicalUseAllowed: true,
                              isPublished: true,
                              publishedAt: true,
                              regulation: {
                                select: {
                                  slug: true,
                                  title: true,
                                  isPublished: true,
                                  publishedAt: true,
                                  sources: {
                                    where: publicRegulationSourceWhere(now),
                                    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
                                    select: { title: true, url: true, kind: true },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          evidence: {
            where: {
              document: {
                isEvidence: true,
                ...evidenceValidatedContentWhere(now),
              },
            },
            orderBy: [{ role: "asc" }, { createdAt: "asc" }],
            select: {
              role: true,
              isPrimary: true,
              provenanceVerifiedAt: true,
              note: true,
              document: {
                select: {
                  slug: true,
                  title: true,
                  source: true,
                  documentDate: true,
                },
              },
            },
          },
        },
      },
      registryChecks: {
        where: {
          ...published,
          snapshotDocument: {
            is: {
              isEvidence: true,
              evidenceValidatedAt: { not: null },
              ...published,
            },
          },
        },
        orderBy: { searchedAt: "desc" },
        select: {
          id: true,
          registryName: true,
          query: true,
          searchedAt: true,
          officialUrl: true,
          result: true,
          resultSummary: true,
        },
      },
      diseases: {
        where: publicInvestigationRelationWhere(now),
        include: { disease: { select: { slug: true, title: true } } },
      },
      procedures: {
        where: publicInvestigationRelationWhere(now),
        include: { procedure: { select: { slug: true, title: true } } },
      },
      news: {
        where: { news: publishedContentWhere(now) },
        orderBy: { news: { publishedAt: "desc" } },
        include: { news: { select: { slug: true, title: true, summary: true, publishedAt: true } } },
      },
      _count: { select: { appeals: true } },
    },
  });

  if (!investigation) return null;

  const publicEquipmentIds = new Set(
    investigation.equipment.map((relation) => relation.equipmentId),
  );
  const equipmentInstances = investigation.equipmentInstances.filter(
    (instance) =>
      instance.equipmentId == null || publicEquipmentIds.has(instance.equipmentId),
  );
  const publicEquipmentInstanceIds = new Set(
    equipmentInstances.map((instance) => instance.id),
  );
  const timeline = investigation.timeline.filter(
    (event) =>
      event.equipmentInstanceId == null ||
      publicEquipmentInstanceIds.has(event.equipmentInstanceId),
  );
  const independentControlAssessments =
    investigation.independentControlAssessments.flatMap((assessment) => {
      const publicNormLinks = assessment.criterion.normLinks.map((link) => {
        const provision = link.regulatoryCheck.provision;
        const edition = provision.edition;
        const regulation = edition.regulation;
        const editionBound =
          link.evidenceValidatedAt != null &&
          isPubliclyVisibleAt(link, now) &&
          isPubliclyVisibleAt(link.regulatoryCheck, now) &&
          isPubliclyVisibleAt(provision, now) &&
          isPubliclyVisibleAt(edition, now) &&
          isPubliclyVisibleAt(regulation, now) &&
          regulation.sources.length > 0;

        return {
          id: link.id,
          regulationKey: regulation.slug,
          editionKey: edition.key,
          provisionKey: provision.key,
          checkKey: link.regulatoryCheck.key,
          role: independentControlNormRole(link.role),
          editionBound,
          verifiedAt: link.verifiedAt,
          note: link.note,
          regulatoryCheck: {
            key: link.regulatoryCheck.key,
            question: link.regulatoryCheck.question,
            factToEstablish: link.regulatoryCheck.factToEstablish,
            primaryEvidenceType: link.regulatoryCheck.primaryEvidenceType,
            evidenceThreshold: link.regulatoryCheck.evidenceThreshold,
            applicabilityNote: link.regulatoryCheck.applicabilityNote,
            officialSearchUrl: link.regulatoryCheck.officialSearchUrl,
            officialSearchLabel: link.regulatoryCheck.officialSearchLabel,
            nonCompliancePattern: link.regulatoryCheck.nonCompliancePattern,
          },
          provision: {
            key: provision.key,
            locator: provision.locator,
            title: provision.title,
            requirement: provision.requirement,
            applicability: provision.applicability,
            effectiveFrom: provision.effectiveFrom,
            effectiveTo: provision.effectiveTo,
          },
          edition: {
            key: edition.key,
            title: edition.title,
            effectiveFrom: edition.effectiveFrom,
            effectiveTo: edition.effectiveTo,
            verifiedAt: edition.verifiedAt,
            historicalUseAllowed: edition.historicalUseAllowed,
          },
          regulation: {
            slug: regulation.slug,
            title: regulation.title,
            sources: regulation.sources,
          },
        };
      });
      const criterionForPublication = {
        stableKey: assessment.criterion.key,
        sourceLocator: assessment.criterion.sourceLocator,
        sectionKey: assessment.criterion.sectionKey,
        sectionTitle: assessment.criterion.sectionTitle,
        statement: assessment.criterion.statement,
        title: assessment.criterion.title,
        whatIsChecked: assessment.criterion.whatIsChecked,
        checkQuestion: assessment.criterion.checkQuestion,
        factToEstablish: assessment.criterion.factToEstablish,
        confirmingPrimaryDocument: assessment.criterion.confirmingDocument,
        evidenceRequired: assessment.criterion.evidenceRequired,
        evidenceThreshold: assessment.criterion.evidenceThreshold,
        applicabilityNote: assessment.criterion.applicabilityNote,
        sourceDivergenceNote: assessment.criterion.sourceDivergenceNote ?? "",
        basisKind: assessment.criterion.basisKind,
        allowedStatuses: assessment.criterion.allowedStatuses,
        normLinks: publicNormLinks.map((link) => ({
          id: link.id,
          regulationKey: link.regulationKey,
          editionKey: link.editionKey,
          provisionKey: link.provisionKey,
          checkKey: link.checkKey,
          role: link.role,
          editionBound: link.editionBound,
        })),
        isSourceCriterion: assessment.criterion.isSourceCriterion,
        isPublished: assessment.criterion.isPublished,
        publishedAt: assessment.criterion.publishedAt,
        evidenceValidatedAt: assessment.criterion.evidenceValidatedAt,
        sortOrder: assessment.criterion.sortOrder,
      };
      const conclusive = assessment.status !== "REQUIRES_VERIFICATION";
      const appliedPublicNormLinks = criterionForPublication.normLinks.filter(
        (link) =>
          link.id === assessment.appliedCriterionNorm?.id && link.editionBound,
      );
      const publication = canPublishIndependentControlAssessment(
        {
          status: assessment.status,
          isPublished: assessment.isPublished,
          publishedAt: assessment.publishedAt,
          evidenceValidatedAt: assessment.evidenceValidatedAt,
          investigationPublished: isPubliclyVisibleAt(investigation, now),
          investigationEvidenceValidatedAt: investigation.evidenceValidatedAt,
          criterion: {
            ...criterionForPublication,
            normLinks: conclusive
              ? appliedPublicNormLinks
              : criterionForPublication.normLinks,
          },
          neutralConclusion: assessment.neutralConclusion,
          alternativeVersion: assessment.alternativeVersion,
          evidenceGaps: assessment.evidenceGaps ?? "",
          temporalApplicability: assessment.applicabilityStatus,
          legalNonApplicabilityProven: false,
          supportingEvidenceSearchCompleted:
            assessment.supportingEvidenceSearchCompleted,
          refutingEvidenceSearchCompleted:
            assessment.refutingEvidenceSearchCompleted,
          primaryEvidence: assessment.evidence.map((item) => ({
            role: item.role,
            isPrimary: item.isPrimary,
            provenanceVerifiedAt: item.provenanceVerifiedAt,
            isRestrictedSignal: assessment.restrictedSignals.length > 0,
          })),
          restrictedSignals: assessment.restrictedSignals,
        },
        now,
      );
      const hasAppliedDirectNorm = appliedPublicNormLinks.some(
        (link) => link.role === "DIRECT_REQUIREMENT",
      );

      if (
        !publication.allowed ||
        (conclusive &&
          (appliedPublicNormLinks.length === 0 || !hasAppliedDirectNorm))
      ) {
        return [];
      }

      const appliedCriterionNorm = publicNormLinks.find(
        (link) => link.id === assessment.appliedCriterionNorm?.id,
      );
      return [{
        key: assessment.key,
        eventFrom: assessment.eventFrom,
        eventTo: assessment.eventTo,
        eventDateLabel: assessment.eventDateLabel,
        status: assessment.status,
        applicabilityStatus: assessment.applicabilityStatus,
        restrictedSignals: assessment.restrictedSignals,
        neutralConclusion: assessment.neutralConclusion,
        alternativeVersion: assessment.alternativeVersion,
        evidenceGaps: assessment.evidenceGaps,
        supportingEvidenceSearchCompleted:
          assessment.supportingEvidenceSearchCompleted,
        refutingEvidenceSearchCompleted:
          assessment.refutingEvidenceSearchCompleted,
        clinic: assessment.investigationClinic?.clinic ?? null,
        methodology: assessment.criterion.methodology,
        criterion: {
          key: assessment.criterion.key,
          sourceLocator: assessment.criterion.sourceLocator,
          sectionKey: assessment.criterion.sectionKey,
          sectionTitle: assessment.criterion.sectionTitle,
          title: assessment.criterion.title,
          statement: assessment.criterion.statement,
          whatIsChecked: assessment.criterion.whatIsChecked,
          checkQuestion: assessment.criterion.checkQuestion,
          factToEstablish: assessment.criterion.factToEstablish,
          confirmingDocument: assessment.criterion.confirmingDocument,
          evidenceRequired: assessment.criterion.evidenceRequired,
          evidenceThreshold: assessment.criterion.evidenceThreshold,
          applicabilityNote: assessment.criterion.applicabilityNote,
          sourceDivergenceNote: assessment.criterion.sourceDivergenceNote,
          basisKind: assessment.criterion.basisKind,
          allowedStatuses: assessment.criterion.allowedStatuses,
          isSourceCriterion: assessment.criterion.isSourceCriterion,
          effectiveFrom: assessment.criterion.effectiveFrom,
          effectiveTo: assessment.criterion.effectiveTo,
          normLinks: publicNormLinks.map(({ id, ...link }) => ({
            ...link,
            isApplied: id === assessment.appliedCriterionNorm?.id,
          })),
        },
        appliedCriterionNorm: appliedCriterionNorm
          ? {
              regulationKey: appliedCriterionNorm.regulationKey,
              editionKey: appliedCriterionNorm.editionKey,
              provisionKey: appliedCriterionNorm.provisionKey,
              checkKey: appliedCriterionNorm.checkKey,
              role: appliedCriterionNorm.role,
              editionBound: appliedCriterionNorm.editionBound,
              verifiedAt: appliedCriterionNorm.verifiedAt,
              note: appliedCriterionNorm.note,
              regulatoryCheck: appliedCriterionNorm.regulatoryCheck,
              provision: appliedCriterionNorm.provision,
              edition: appliedCriterionNorm.edition,
              regulation: appliedCriterionNorm.regulation,
            }
          : null,
        evidence: assessment.evidence,
      }];
    });

  return {
    ...investigation,
    equipmentInstances,
    timeline,
    independentControlAssessments,
    regulatoryAssessments: investigation.regulatoryAssessments.flatMap(
      (assessment) => {
        const {
          equipmentInstance,
          equipmentInstanceId,
          investigationClinic,
          investigationProcedure,
          ...publicAssessment
        } = assessment;
        const edition = assessment.appliedEdition;
        const primaryEvidence = assessment.evidence
          .filter((item) => item.isPrimary)
          .map((item) => ({
            role: item.role,
            provenanceVerifiedAt: item.provenanceVerifiedAt,
          }));

        return canPublishInvestigationAssessment({
          status: assessment.status,
          isPublished: assessment.isPublished,
          publishedAt: assessment.publishedAt,
          evidenceValidatedAt: assessment.evidenceValidatedAt,
          investigationPublished: isPubliclyVisibleAt(investigation, now),
          regulationPublished: isPubliclyVisibleAt(
            assessment.regulatoryCheck.provision.edition.regulation,
            now,
          ),
          editionPublished: isPubliclyVisibleAt(
            assessment.regulatoryCheck.provision.edition,
            now,
          ),
          provisionPublished: isPubliclyVisibleAt(
            assessment.regulatoryCheck.provision,
            now,
          ),
          regulatoryCheckPublished: isPubliclyVisibleAt(
            assessment.regulatoryCheck,
            now,
          ),
          applicabilityStatus: assessment.applicabilityStatus,
          appliedEdition: edition,
          provisionEffectiveFrom:
            assessment.regulatoryCheck.provision.effectiveFrom ??
            assessment.regulatoryCheck.provision.edition.effectiveFrom,
          provisionEffectiveTo:
            assessment.regulatoryCheck.provision.effectiveTo ??
            assessment.regulatoryCheck.provision.edition.effectiveTo,
          eventFrom: assessment.eventFrom,
          eventTo: assessment.eventTo,
          restrictedSignals: assessment.restrictedSignals,
          primaryEvidence,
          appliedEditionPublished: edition
            ? isPubliclyVisibleAt(edition, now)
            : false,
          appliedEditionMatchesProvision:
            assessment.appliedEditionId ===
            assessment.regulatoryCheck.provision.editionId,
          supportingEvidenceSearchCompleted:
            assessment.supportingEvidenceSearchCompleted,
          refutingEvidenceSearchCompleted:
            assessment.refutingEvidenceSearchCompleted,
          subjectRelationsPublished:
            (assessment.clinicId == null ||
              (investigationClinic?.evidenceValidatedAt != null &&
                isPubliclyVisibleAt(investigationClinic, now))) &&
            (assessment.procedureId == null ||
              (investigationProcedure?.evidenceValidatedAt != null &&
                isPubliclyVisibleAt(investigationProcedure, now))) &&
            (equipmentInstanceId == null ||
              (equipmentInstance != null &&
                isPubliclyVisibleAt(equipmentInstance, now) &&
                (equipmentInstance.equipmentId == null ||
                  publicEquipmentIds.has(equipmentInstance.equipmentId)) &&
                equipmentInstance.identificationEvidence.length > 0)),
          neutralConclusion: assessment.neutralConclusion,
          alternativeVersion: assessment.alternativeVersion,
        }, now).allowed
          ? [
              {
                ...publicAssessment,
                clinic: investigationClinic?.clinic ?? null,
                procedure: investigationProcedure?.procedure ?? null,
              },
            ]
          : [];
      },
    ),
  };
}

export type NewsCatalogItem = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: Date | null;
  investigationSlugs: string[];
};

export async function getNews(opts?: { take?: number; skip?: number }): Promise<NewsCatalogItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const rows = await db.news.findMany({
    where: publishedContentWhere(),
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
    include: {
      investigations: {
        where: { investigation: evidenceValidatedContentWhere() },
        select: { investigation: { select: { slug: true } } },
      },
    },
  });
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    publishedAt: row.publishedAt,
    investigationSlugs: row.investigations.map((relation) => relation.investigation.slug),
  }));
}

export async function getNewsItem(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  return db.news.findFirst({
    where: { slug, ...publishedContentWhere() },
    include: {
      investigations: {
        where: { investigation: evidenceValidatedContentWhere() },
        orderBy: { investigation: { publishedAt: "desc" } },
        include: {
          investigation: {
            select: {
              slug: true,
              title: true,
              summary: true,
              status: true,
              documents: {
                where: {
                  isEvidence: true,
                  ...evidenceValidatedContentWhere(),
                },
                orderBy: { sortOrder: "asc" },
                select: {
                  slug: true,
                  kind: true,
                  title: true,
                  summary: true,
                  source: true,
                  documentDate: true,
                  mimeType: true,
                },
              },
              clinics: {
                where: publicInvestigationRelationWhere(),
                select: { clinic: { select: { slug: true, title: true, city: true } } },
              },
              equipment: {
                where: publicInvestigationRelationWhere(),
                select: { equipment: { select: { slug: true, title: true, manufacturer: true } } },
              },
              procedures: {
                where: publicInvestigationRelationWhere(),
                select: { procedure: { select: { slug: true, title: true } } },
              },
              diseases: {
                where: publicInvestigationRelationWhere(),
                select: { disease: { select: { slug: true, title: true } } },
              },
            },
          },
        },
      },
    },
  });
}

// ─── Publications ─────────────────────────────────────────────────────────────

// ─── Scientific works (каталог /publications) ─────────────────────────────────

/**
 * Единый элемент каталога научных публикаций.
 * `kind` разделяет научные работы (ScientificWork) и редакционные материалы
 * (Publication), не смешивая их семантику на общем маршруте.
 */
export type PublicationCatalogItem = {
  kind: "scientific" | "editorial";
  slug: string;
  type: string;
  title: string;
  authorName: string;
  authorSlug: string | null;
  year: number | null;
  organization: string | null;
  diseases: { slug: string; title: string }[];
  procedures: { slug: string; title: string }[];
};

/** Каталог /publications показывает только прошедшие свой публичный workflow записи. */
export async function getPublicationsCatalog(): Promise<PublicationCatalogItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const [works, editorialPublications, reservedScientificSlugs] = await Promise.all([
    db.scientificWork.findMany({
      where: publicScientificWorkWhere(),
      orderBy: [{ year: "desc" }, { sortOrder: "asc" }],
      include: {
        doctor: { select: { slug: true, firstName: true, lastName: true, middleName: true } },
        diseases: { include: { disease: { select: { slug: true, title: true } } } },
        procedures: { include: { procedure: { select: { slug: true, title: true } } } },
      },
    }),
    db.publication.findMany({
      include: {
        doctor: { select: { slug: true, firstName: true, lastName: true, middleName: true } },
        diseases: { include: { disease: { select: { slug: true, title: true } } } },
        procedures: { include: { procedure: { select: { slug: true, title: true } } } },
      },
    }),
    db.scientificWork.findMany({
      where: { slug: { not: null } },
      select: { slug: true },
    }),
  ]);

  const scientificItems = works.map((w) => ({
    kind: "scientific" as const,
    slug: w.slug as string,
    type: w.type,
    title: w.title,
    authorName: doctorFullName(w.doctor),
    authorSlug: w.doctor.slug,
    year: w.year,
    organization: w.journal ?? w.organization,
    diseases: w.diseases.map((r) => r.disease),
    procedures: w.procedures.map((r) => r.procedure),
  }));

  const reserved = new Set(reservedScientificSlugs.flatMap((item) => item.slug ?? []));
  const editorialItems = editorialPublications
    .filter((publication) => !reserved.has(publication.slug))
    .map((publication) => ({
      kind: "editorial" as const,
      slug: publication.slug,
      type: publication.publicationType ?? "Публикация",
      title: publication.title,
      authorName:
        publication.authorName ??
        (publication.doctor ? doctorFullName(publication.doctor) : "Редакция энциклопедии"),
      authorSlug: publication.doctor?.slug ?? null,
      year: publication.publishedAt?.getFullYear() ?? null,
      organization: null,
      diseases: publication.diseases.map((relation) => relation.disease),
      procedures: publication.procedures.map((relation) => relation.procedure),
    }));

  return [...scientificItems, ...editorialItems].sort(
    (left, right) =>
      (right.year ?? Number.NEGATIVE_INFINITY) -
        (left.year ?? Number.NEGATIVE_INFINITY) || left.title.localeCompare(right.title, "ru"),
  );
}

/** Детальная страница /publications/[slug] для научной работы. */
export async function getScientificWork(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  const work = await db.scientificWork.findFirst({
    where: { ...publicScientificWorkWhere(), slug },
    include: {
      doctor: {
        select: {
          slug: true,
          firstName: true,
          lastName: true,
          middleName: true,
          photoUrl: true,
          position: true,
          category: true,
          // Клиники автора: работа привязана к клиникам через врача (без отдельной таблицы)
          clinics: {
            include: { clinic: { select: { slug: true, title: true, city: true } } },
          },
        },
      },
      diseases: { include: { disease: { select: { slug: true, title: true, summary: true } } } },
      procedures: { include: { procedure: { select: { slug: true, title: true, summary: true } } } },
      equipment: {
        include: {
          equipment: {
            select: {
              slug: true,
              title: true,
              summary: true,
              manufacturer: true,
              images: true,
            },
          },
        },
      },
    },
  });

  if (!work) return null;

  const relatedWorks = await db.scientificWork.findMany({
    where: {
      ...publicScientificWorkWhere(),
      id: { not: work.id },
      OR: [
        { doctorId: work.doctorId },
        ...work.diseases.map((relation) => ({
          diseases: { some: { diseaseId: relation.diseaseId } },
        })),
        ...work.procedures.map((relation) => ({
          procedures: { some: { procedureId: relation.procedureId } },
        })),
        ...work.equipment.map((relation) => ({
          equipment: { some: { equipmentId: relation.equipmentId } },
        })),
      ],
    },
    orderBy: [{ year: "desc" }, { sortOrder: "asc" }],
    take: 4,
    select: {
      slug: true,
      title: true,
      type: true,
      year: true,
      doctor: { select: { slug: true, firstName: true, lastName: true, middleName: true } },
    },
  });

  return { ...work, relatedWorks };
}

export type ScientificWorkDetail = NonNullable<Awaited<ReturnType<typeof getScientificWork>>>;

/**
 * Резервирует slug за ScientificWork даже когда запись скрыта publication gate.
 * Это не даёт одноимённой editorial Publication подменить черновик на общем URL.
 */
export async function hasScientificWorkSlug(slug: string) {
  const db = getPrisma();
  if (!db) return false;
  const work = await db.scientificWork.findFirst({
    where: { slug },
    select: { id: true },
  });
  return work !== null;
}

export async function getPublications(opts?: {
  take?: number;
  skip?: number;
}): Promise<CatalogGridItem[]> {
  const db = getPrisma();
  if (!db) return [];
  const reserved = await db.scientificWork.findMany({
    where: { slug: { not: null } },
    select: { slug: true },
  });
  const rows = await db.publication.findMany({
    where: { slug: { notIn: reserved.flatMap((record) => record.slug ?? []) } },
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

// ─── Independent control methodology ────────────────────────────────────────

export async function getIndependentControlMethodologies() {
  const db = getPrisma();
  if (!db) return [];
  const now = new Date();
  const rows = await db.independentControlMethodology.findMany({
    where: publicIndependentControlMethodologyWhere(now),
    orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
    select: {
      slug: true,
      title: true,
      summary: true,
      description: true,
      legalStatusNote: true,
      bibliographicCitation: true,
      officialMethodologyUrl: true,
      isPublished: true,
      evidenceValidatedAt: true,
      publishedAt: true,
      seoTitle: true,
      seoDescription: true,
      sources: {
        where: publicIndependentControlSourceWhere(now),
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        select: {
          key: true,
          kind: true,
          title: true,
          bibliographicCitation: true,
          sourceUrl: true,
          sha256: true,
          rightsBasis: true,
          rightsVerifiedAt: true,
          rightsNote: true,
          publicFileUrl: true,
        },
      },
      criteria: {
        where: publicIndependentControlCriterionWhere(now),
        orderBy: [
          { sortOrder: "asc" },
          { sectionKey: "asc" },
          { sourceLocator: "asc" },
        ],
        select: {
          key: true,
          sourceLocator: true,
          sectionKey: true,
          sectionTitle: true,
          title: true,
          statement: true,
          whatIsChecked: true,
          checkQuestion: true,
          factToEstablish: true,
          confirmingDocument: true,
          evidenceRequired: true,
          evidenceThreshold: true,
          applicabilityNote: true,
          sourceDivergenceNote: true,
          basisKind: true,
          allowedStatuses: true,
          isSourceCriterion: true,
          effectiveFrom: true,
          effectiveTo: true,
          isPublished: true,
          evidenceValidatedAt: true,
          publishedAt: true,
          sortOrder: true,
          normLinks: {
            where: publicIndependentControlCriterionNormWhere(now),
            orderBy: [{ role: "asc" }, { verifiedAt: "desc" }],
            select: {
              role: true,
              verifiedAt: true,
              note: true,
              regulatoryCheck: {
                select: {
                  key: true,
                  question: true,
                  factToEstablish: true,
                  primaryEvidenceType: true,
                  evidenceThreshold: true,
                  applicabilityNote: true,
                  officialSearchUrl: true,
                  officialSearchLabel: true,
                  nonCompliancePattern: true,
                  provision: {
                    select: {
                      key: true,
                      locator: true,
                      title: true,
                      requirement: true,
                      applicability: true,
                      effectiveFrom: true,
                      effectiveTo: true,
                      edition: {
                        select: {
                          key: true,
                          title: true,
                          effectiveFrom: true,
                          effectiveTo: true,
                          verifiedAt: true,
                          historicalUseAllowed: true,
                          regulation: {
                            select: {
                              slug: true,
                              title: true,
                              sources: {
                                where: publicRegulationSourceWhere(now),
                                orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
                                select: { title: true, url: true, kind: true },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return rows.flatMap((row) => {
    const sourceContract = row.sources.map((source) => ({
      key: source.key,
      title: source.title,
      kind: source.kind === "LOCAL_DOCUMENT"
        ? "LOCAL_BIBLIOGRAPHIC" as const
        : "OFFICIAL_METHODOLOGY" as const,
      url: source.sourceUrl,
      sha256: source.sha256 ?? "",
      rightsStatus: source.rightsBasis,
      rightsNote: source.rightsNote ?? "",
      rightsVerifiedAt: source.rightsVerifiedAt,
      publicFileUrl: source.publicFileUrl,
    }));
    const criterionContract = row.criteria.map((criterion) => ({
      stableKey: criterion.key,
      sourceLocator: criterion.sourceLocator,
      sectionKey: criterion.sectionKey,
      sectionTitle: criterion.sectionTitle,
      statement: criterion.statement,
      title: criterion.title,
      whatIsChecked: criterion.whatIsChecked,
      checkQuestion: criterion.checkQuestion,
      factToEstablish: criterion.factToEstablish,
      confirmingPrimaryDocument: criterion.confirmingDocument,
      evidenceRequired: criterion.evidenceRequired,
      evidenceThreshold: criterion.evidenceThreshold,
      applicabilityNote: criterion.applicabilityNote,
      sourceDivergenceNote: criterion.sourceDivergenceNote ?? "",
      basisKind: criterion.basisKind,
      allowedStatuses: criterion.allowedStatuses,
      normLinks: criterion.normLinks.map((link) => ({
        regulationKey: link.regulatoryCheck.provision.edition.regulation.slug,
        editionKey: link.regulatoryCheck.provision.edition.key,
        provisionKey: link.regulatoryCheck.provision.key,
        checkKey: link.regulatoryCheck.key,
        role: independentControlNormRole(link.role),
        editionBound:
          link.regulatoryCheck.provision.edition.regulation.sources.length > 0,
      })),
      isSourceCriterion: criterion.isSourceCriterion,
      isPublished: criterion.isPublished,
      publishedAt: criterion.publishedAt,
      evidenceValidatedAt: criterion.evidenceValidatedAt,
      sortOrder: criterion.sortOrder,
    }));
    const publication = canPublishIndependentControlMethodology({
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      legalStatusNote: row.legalStatusNote,
      bibliographicDetails: row.bibliographicCitation,
      officialMethodologyUrl: row.officialMethodologyUrl,
      rightsNote: row.description ?? "",
      sources: sourceContract,
      criteria: criterionContract,
      seo: {
        title: row.seoTitle ?? "",
        description: row.seoDescription ?? "",
      },
      isPublished: row.isPublished,
      publishedAt: row.publishedAt,
      evidenceValidatedAt: row.evidenceValidatedAt,
    }, now);
    if (!publication.allowed) return [];

    return [{
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      description: row.description,
      legalStatusNote: row.legalStatusNote,
      bibliographicCitation: row.bibliographicCitation,
      officialMethodologyUrl: row.officialMethodologyUrl,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      sources: row.sources,
      criteria: row.criteria.map((criterion) => ({
        key: criterion.key,
        sourceLocator: criterion.sourceLocator,
        sectionKey: criterion.sectionKey,
        sectionTitle: criterion.sectionTitle,
        title: criterion.title,
        statement: criterion.statement,
        whatIsChecked: criterion.whatIsChecked,
        checkQuestion: criterion.checkQuestion,
        factToEstablish: criterion.factToEstablish,
        confirmingDocument: criterion.confirmingDocument,
        evidenceRequired: criterion.evidenceRequired,
        evidenceThreshold: criterion.evidenceThreshold,
        applicabilityNote: criterion.applicabilityNote,
        sourceDivergenceNote: criterion.sourceDivergenceNote,
        basisKind: criterion.basisKind,
        allowedStatuses: criterion.allowedStatuses,
        isSourceCriterion: criterion.isSourceCriterion,
        effectiveFrom: criterion.effectiveFrom,
        effectiveTo: criterion.effectiveTo,
        normLinks: criterion.normLinks.map((link) => ({
          role: independentControlNormRole(link.role),
          verifiedAt: link.verifiedAt,
          note: link.note,
          regulatoryCheck: {
            key: link.regulatoryCheck.key,
            question: link.regulatoryCheck.question,
            factToEstablish: link.regulatoryCheck.factToEstablish,
            primaryEvidenceType: link.regulatoryCheck.primaryEvidenceType,
            evidenceThreshold: link.regulatoryCheck.evidenceThreshold,
            applicabilityNote: link.regulatoryCheck.applicabilityNote,
            officialSearchUrl: link.regulatoryCheck.officialSearchUrl,
            officialSearchLabel: link.regulatoryCheck.officialSearchLabel,
            nonCompliancePattern: link.regulatoryCheck.nonCompliancePattern,
          },
          provision: {
            key: link.regulatoryCheck.provision.key,
            locator: link.regulatoryCheck.provision.locator,
            title: link.regulatoryCheck.provision.title,
            requirement: link.regulatoryCheck.provision.requirement,
            applicability: link.regulatoryCheck.provision.applicability,
            effectiveFrom: link.regulatoryCheck.provision.effectiveFrom,
            effectiveTo: link.regulatoryCheck.provision.effectiveTo,
          },
          edition: {
            key: link.regulatoryCheck.provision.edition.key,
            title: link.regulatoryCheck.provision.edition.title,
            effectiveFrom: link.regulatoryCheck.provision.edition.effectiveFrom,
            effectiveTo: link.regulatoryCheck.provision.edition.effectiveTo,
            verifiedAt: link.regulatoryCheck.provision.edition.verifiedAt,
            historicalUseAllowed:
              link.regulatoryCheck.provision.edition.historicalUseAllowed,
          },
          regulation: {
            slug: link.regulatoryCheck.provision.edition.regulation.slug,
            title: link.regulatoryCheck.provision.edition.regulation.title,
            sources: link.regulatoryCheck.provision.edition.regulation.sources,
          },
        })),
      })),
    }];
  });
}

// ─── Regulations ──────────────────────────────────────────────────────────────

export async function getRegulations(opts?: {
  topicSlug?: string;
  legalStatus?: "IN_FORCE" | "FUTURE" | "EXPIRED";
  effectiveOn?: Date;
  take?: number;
  skip?: number;
}) {
  const db = getPrisma();
  if (!db) return [];
  const now = new Date();
  const published = publishedContentWhere(now);
  const publicCheck = publicRegulatoryCheckWhere(now);
  const applicableEdition = opts?.effectiveOn
    ? {
        effectiveFrom: { lte: opts.effectiveOn },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: opts.effectiveOn } },
        ],
      }
    : {};
  const hasWorkingProvision = {
    editions: {
      some: {
        ...published,
        ...applicableEdition,
        provisions: {
          some: {
            ...published,
            checks: { some: publicCheck },
          },
        },
      },
    },
  } as const;
  const rows = await db.regulation.findMany({
    where: {
      ...publicRegulationWhere(now),
      ...hasWorkingProvision,
      ...(opts?.topicSlug
        ? { topics: { some: { topic: { slug: opts.topicSlug, isPublished: true } } } }
        : {}),
      ...(opts?.legalStatus ? { legalStatus: opts.legalStatus } : {}),
    },
    select: {
      slug: true,
      title: true,
      summary: true,
      documentType: true,
      number: true,
      issuingAuthority: true,
      legalStatus: true,
      effectiveFrom: true,
      effectiveTo: true,
      officialPublicationUrl: true,
      topics: {
        where: { topic: { isPublished: true } },
        select: { topic: { select: { slug: true, title: true } } },
      },
      editions: {
        where: { ...published, ...applicableEdition },
        select: {
          provisions: {
            where: { ...published, checks: { some: publicCheck } },
            select: {
              isPublished: true,
              publishedAt: true,
              checks: {
                where: publicCheck,
                select: {
                  isPublished: true,
                  publishedAt: true,
                  question: true,
                  factToEstablish: true,
                  primaryEvidenceType: true,
                  officialSearchUrl: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ legalStatus: "asc" }, { title: "asc" }],
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
  });
  return rows.flatMap((row) => {
    const provisions = row.editions
      .flatMap((edition) => edition.provisions)
      .filter((provision) =>
        canPublishRegulationProvision(
          {
            ...provision,
            editionPublished: true,
            regulationPublished: true,
          },
          now,
        ).allowed,
      );
    return provisions.length > 0 ? [{
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      documentType: row.documentType,
      number: row.number,
      issuingAuthority: row.issuingAuthority,
      legalStatus: row.legalStatus,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      officialPublicationUrl: row.officialPublicationUrl,
      topics: row.topics.map(({ topic }) => topic),
      provisionCount: provisions.length,
      checkCount: provisions.reduce((total, provision) => total + provision.checks.length, 0),
    }] : [];
  });
}

export async function getRegulationTopics() {
  const db = getPrisma();
  if (!db) return [];
  const now = new Date();
  const published = publishedContentWhere(now);
  const publicCheck = publicRegulatoryCheckWhere(now);
  const topics = await db.regulationTopic.findMany({
    where: { isPublished: true },
    select: {
      slug: true,
      title: true,
      description: true,
      regulations: {
        where: {
          regulation: {
            ...publicRegulationWhere(now),
            editions: {
              some: {
                ...published,
                provisions: {
                  some: { ...published, checks: { some: publicCheck } },
                },
              },
            },
          },
        },
        select: { regulationId: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return topics.map(({ regulations, ...topic }) => ({
    ...topic,
    count: regulations.length,
  }));
}

export async function getRegulation(slug: string) {
  const db = getPrisma();
  if (!db) return null;
  const now = new Date();
  const published = publishedContentWhere(now);
  const publicCheck = publicRegulatoryCheckWhere(now);
  const regulation = await db.regulation.findFirst({
    where: {
      slug,
      ...publicRegulationWhere(now),
      editions: {
        some: {
          ...published,
          provisions: { some: { ...published, checks: { some: publicCheck } } },
        },
      },
    },
    include: {
      sources: {
        where: {
          ...publicRegulationSourceWhere(now),
          OR: [
            { editionId: null },
            { edition: published },
          ],
        },
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      },
      topics: {
        where: { topic: { isPublished: true } },
        include: { topic: true },
      },
      editions: {
        where: {
          ...published,
          provisions: { some: { ...published, checks: { some: publicCheck } } },
        },
        orderBy: { effectiveFrom: "desc" },
        include: {
          sources: {
            where: publicRegulationSourceWhere(now),
            orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
          },
          provisions: {
            where: { ...published, checks: { some: publicCheck } },
            orderBy: [{ sortOrder: "asc" }, { locator: "asc" }],
            include: {
              topic: true,
              checks: {
                where: publicCheck,
                orderBy: [{ sortOrder: "asc" }, { question: "asc" }],
              },
              equipmentRequirements: {
                where: published,
                orderBy: [{ sortOrder: "asc" }, { position: "asc" }],
              },
            },
          },
        },
      },
      outgoingRelations: {
        where: {
          isPublished: true,
          targetRegulation: publicRegulationWhere(now),
        },
        orderBy: { legalEffectFrom: "desc" },
        include: { targetRegulation: true },
      },
      incomingRelations: {
        where: {
          isPublished: true,
          sourceRegulation: publicRegulationWhere(now),
        },
        orderBy: { legalEffectFrom: "desc" },
        include: { sourceRegulation: true },
      },
    },
  });
  if (!regulation) return null;

  const editions = regulation.editions
    .map((edition) => ({
      ...edition,
      provisions: edition.provisions.filter((provision) =>
        canPublishRegulationProvision(
          {
            ...provision,
            editionPublished: isPubliclyVisibleAt(edition, now),
            regulationPublished: isPubliclyVisibleAt(regulation, now),
          },
          now,
        ).allowed,
      ),
    }))
    .filter((edition) => edition.provisions.length > 0);
  if (editions.length === 0) return null;

  return {
    ...regulation,
    topics: regulation.topics.map(({ topic }) => topic),
    editions,
  };
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
  // Раздел /publications наполняется научными работами (ScientificWork) и, в перспективе,
  // редакционными материалами (Publication). Счётчик = сумма обоих типов контента.
  const reservedScientificSlugs = await db.scientificWork.findMany({
    where: { slug: { not: null } },
    select: { slug: true },
  });
  const reservedSlugs = reservedScientificSlugs.flatMap((record) => record.slug ?? []);
  const [diseases, procedures, doctors, clinics, suppliers, equipment, editorial, scientific] =
    await Promise.all([
      db.disease.count(),
      db.procedure.count(),
      db.doctor.count(),
      db.clinic.count(),
      db.supplier.count(),
      db.equipment.count(),
      db.publication.count({ where: { slug: { notIn: reservedSlugs } } }),
      db.scientificWork.count({ where: publicScientificWorkWhere() }),
    ]);
  return {
    diseases,
    procedures,
    doctors,
    clinics,
    suppliers,
    equipment,
    publications: editorial + scientific,
  };
}
