import type { MetadataRoute } from "next";
import { getPrisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

const staticRoutes = [
  "/",
  "/search",
  "/about",
  "/news",
  "/cooperation",
  "/contact",
  "/questions",
  "/register/doctor",
  "/register/clinic",
  "/diseases",
  "/procedures",
  "/doctors",
  "/clinics",
  "/clinics/oms",
  "/clinics/contract",
  "/suppliers",
  "/equipment",
  "/guidelines",
  "/regulations",
  "/history",
  "/innovations",
  "/publications",
];

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const db = getPrisma();

  const static_ = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: (route === "/" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  if (!db) return static_;

  const [
    diseases,
    procedures,
    doctors,
    clinics,
    suppliers,
    equipment,
    publications,
    guidelines,
    regulations,
    history,
    innovations,
  ] = await Promise.all([
    db.disease.findMany({ select: { slug: true, updatedAt: true } }),
    db.procedure.findMany({ select: { slug: true, updatedAt: true } }),
    db.doctor.findMany({ select: { slug: true, updatedAt: true } }),
    db.clinic.findMany({ select: { slug: true, updatedAt: true } }),
    db.supplier.findMany({ select: { slug: true, updatedAt: true } }),
    db.equipment.findMany({ select: { slug: true, updatedAt: true } }),
    db.publication.findMany({ select: { slug: true, updatedAt: true } }),
    db.clinicalGuideline.findMany({ select: { slug: true, updatedAt: true } }),
    db.regulation.findMany({ select: { slug: true, updatedAt: true } }),
    db.historyEntry.findMany({ select: { slug: true, updatedAt: true } }),
    db.innovation.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const entityEntries: MetadataRoute.Sitemap = [
    ...diseases.map((r) => ({ path: `/diseases/${r.slug}`, updatedAt: r.updatedAt })),
    ...procedures.map((r) => ({ path: `/procedures/${r.slug}`, updatedAt: r.updatedAt })),
    ...doctors.map((r) => ({ path: `/doctors/${r.slug}`, updatedAt: r.updatedAt })),
    ...clinics.map((r) => ({ path: `/clinics/${r.slug}`, updatedAt: r.updatedAt })),
    ...suppliers.map((r) => ({ path: `/suppliers/${r.slug}`, updatedAt: r.updatedAt })),
    ...equipment.map((r) => ({ path: `/equipment/${r.slug}`, updatedAt: r.updatedAt })),
    ...publications.map((r) => ({ path: `/publications/${r.slug}`, updatedAt: r.updatedAt })),
    ...guidelines.map((r) => ({ path: `/guidelines/${r.slug}`, updatedAt: r.updatedAt })),
    ...regulations.map((r) => ({ path: `/regulations/${r.slug}`, updatedAt: r.updatedAt })),
    ...history.map((r) => ({ path: `/history/${r.slug}`, updatedAt: r.updatedAt })),
    ...innovations.map((r) => ({ path: `/innovations/${r.slug}`, updatedAt: r.updatedAt })),
  ].map(({ path, updatedAt }) => ({
    url: absoluteUrl(path),
    lastModified: updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...static_, ...entityEntries];
}
