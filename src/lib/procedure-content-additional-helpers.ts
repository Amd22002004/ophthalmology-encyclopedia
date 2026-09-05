import type {
  ProcedureContent,
  ProcedureContentSectionKey,
  ProcedureSource,
} from "./procedure-content";

export const additionalProcedureSections: ProcedureContentSectionKey[] = [
  "definition",
  "principle",
  "steps",
  "applications",
  "features",
  "limitations",
  "preparation",
  "recovery",
  "risks",
  "faq",
];

const accessedAt = "2026-08-24";

export function procedureSources(
  items: Array<{ name: string; url: string; updatedAt?: string }>,
): ProcedureSource[] {
  return items.map((item) => ({
    ...item,
    accessedAt,
    sections: additionalProcedureSections,
  }));
}

export function procedureImage(slug: string, alt: string): ProcedureContent["image"] {
  const extension = "webp";
  return { src: `/images/procedures/${slug}.${extension}`, alt, width: 1536, height: 1024 };
}

export function buildProcedure(
  value: Omit<ProcedureContent, "image" | "sources"> & {
    imageAlt: string;
    sourceSeeds: Array<{ name: string; url: string; updatedAt?: string }>;
  },
): ProcedureContent {
  const { imageAlt, sourceSeeds, slug, ...rest } = value;
  return {
    ...rest,
    slug,
    image: procedureImage(slug, imageAlt),
    sources: procedureSources(sourceSeeds),
  };
}
