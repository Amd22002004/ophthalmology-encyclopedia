import { DoctorCard } from "@/components/entity/doctor-card";
import { getCatalogConfig } from "@/lib/content-model";
import { getDoctorsCatalog } from "@/lib/loaders";
import { createCatalogMetadata } from "@/lib/seo";

const config = getCatalogConfig("doctors");

export const revalidate = 3600;
export const metadata = createCatalogMetadata(config);

export default async function DoctorsPage() {
  const doctors = await getDoctorsCatalog();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          {config.eyebrow}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {config.title}
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl">
          {config.description}
        </p>
      </div>

      {/* Grid */}
      {doctors.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">{config.emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{config.emptyDescription}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.slug} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}
