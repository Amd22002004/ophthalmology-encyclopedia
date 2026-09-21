import { UserRound } from "lucide-react";
import Link from "next/link";
import type { DoctorCatalogItem } from "@/lib/loaders";

export function DoctorCard({ doctor }: { doctor: DoctorCatalogItem }) {
  const { slug, fullName, position, photoUrl, experienceYears, specialties, cities } = doctor;

  const visibleSpecialties = specialties.slice(0, 3);
  const specialtyOverflow = Math.max(0, specialties.length - 3);
  const visibleCities = cities.slice(0, 3);
  const cityOverflow = Math.max(0, cities.length - 3);

  return (
    <div className="flex flex-col rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(15,33,31,0.04),0_4px_14px_rgba(15,33,31,0.05)] w-full max-w-sm">

      {/* Header: photo + name/role/experience */}
      <div className="flex items-start gap-[13px] p-[16px_17px_0]">
        {/* Photo */}
        <div className="h-[72px] w-[58px] shrink-0 overflow-hidden rounded-[10px] bg-muted">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={fullName}
              className="h-full w-full object-cover"
              decoding="async"
              src={photoUrl}
              style={{ objectPosition: "center 24%" }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <UserRound className="h-6 w-6 text-primary/40" />
            </div>
          )}
        </div>

        {/* Name + Role + Experience */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/doctors/${slug}`}
            className="block text-[15.5px] font-bold leading-tight text-foreground hover:text-primary transition-colors"
          >
            {fullName}
          </Link>
          {position && (
            <p className="mt-0.5 text-[12.5px] font-semibold text-foreground leading-snug line-clamp-2">
              {position}
            </p>
          )}
          {experienceYears != null && (
            <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
              Стаж {experienceYears} {pluralYears(experienceYears)}
            </p>
          )}
        </div>
      </div>

      {/* Directions */}
      {specialties.length > 0 && (
        <div className="px-[17px] mt-[12px]">
          <p className="mb-[6px] text-[10.5px] font-bold text-muted-foreground">
            Направления · в энциклопедии
          </p>
          <div className="flex flex-wrap gap-[6px]">
            {visibleSpecialties.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium"
                style={{ background: "#e6f4f5", color: "#0a5d65" }}
              >
                {s}
              </span>
            ))}
            {specialtyOverflow > 0 && (
              <Link
                href={`/doctors/${slug}`}
                className="inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-semibold"
                style={{ color: "#64748b" }}
              >
                +{specialtyOverflow}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Cities */}
      {cities.length > 0 && (
        <p className="px-[17px] mt-[12px] text-[12.5px] text-muted-foreground leading-snug">
          Принимает: {visibleCities.join(" · ")}
          {cityOverflow > 0 && ` · ещё ${cityOverflow}`}
        </p>
      )}

      {/* Footer CTA */}
      <div className="flex items-center justify-end px-[17px] pb-[14px] mt-[12px]">
        <Link
          href={`/doctors/${slug}`}
          className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Подробнее →
        </Link>
      </div>
    </div>
  );
}

function pluralYears(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "год";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "года";
  return "лет";
}
