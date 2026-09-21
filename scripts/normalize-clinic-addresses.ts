import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { removeLeadingClinicCity } from "../src/lib/clinic-address";

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.production.local", override: true, quiet: true });

const apply = process.argv.includes("--apply");

type ClinicAddressRow = {
  id: string;
  slug: string;
  city: string | null;
  address: string | null;
};

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");

  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });

  try {
    const clinics = await db.clinic.findMany({
      select: { id: true, slug: true, city: true, address: true },
      orderBy: { slug: "asc" },
    });
    const updates = clinics.flatMap((clinic: ClinicAddressRow) => {
      const nextAddress = removeLeadingClinicCity(clinic.address, clinic.city);
      return nextAddress !== clinic.address
        ? [{ ...clinic, nextAddress }]
        : [];
    });

    console.log(JSON.stringify({
      mode: apply ? "apply" : "dry-run",
      inspected: clinics.length,
      matching: updates.length,
      slugs: updates.map(({ slug }) => slug),
    }));

    if (!apply || updates.length === 0) return;

    let updated = 0;
    await db.$transaction(async (tx) => {
      for (const clinic of updates) {
        const result = await tx.clinic.updateMany({
          where: { id: clinic.id, address: clinic.address },
          data: { address: clinic.nextAddress },
        });
        if (result.count !== 1) {
          throw new Error(`Clinic changed during normalization: ${clinic.slug}`);
        }
        updated += result.count;
      }
    });

    console.log(JSON.stringify({ mode: "apply", updated }));
  } finally {
    await db.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Clinic address normalization failed");
  process.exitCode = 1;
});
