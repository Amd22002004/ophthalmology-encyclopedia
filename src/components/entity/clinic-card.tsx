import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClinicLogo, getClinicInitial } from "@/components/entity/clinic-logo";
import type { ClinicCardData } from "@/lib/loaders";

const CLINIC_TYPE_LABEL: Record<string, string> = {
  centre: "Центр",
  cabinet: "Кабинет",
  mntk: "МНТК",
  clinic: "Клиника",
};

const BADGE_STYLE = {
  oms:  { background: "#e7f4ec", color: "#137a4c" },
  net:  { background: "#e9f0fb", color: "#1f5fae" },
  type: { background: "#eef1f5", color: "#475569" },
};

function ClinicBadge({ label, variant }: { label: string; variant: keyof typeof BADGE_STYLE }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-bold leading-snug whitespace-nowrap"
      style={BADGE_STYLE[variant]}
    >
      {label}
    </span>
  );
}

export function ClinicCard({ clinic }: { clinic: ClinicCardData }) {
  const initial = getClinicInitial(clinic.networkName ?? undefined, clinic.title);
  const typeLabel = clinic.clinicType ? (CLINIC_TYPE_LABEL[clinic.clinicType] ?? null) : null;

  const addressText = clinic.city
    ? clinic.address
      ? `${clinic.city} — ${clinic.address}`
      : clinic.city
    : (clinic.address ?? null);

  const visibleTags = clinic.specializationTags.slice(0, 4);
  const extraCount = Math.max(0, clinic.specializationTags.length - 4);
  const phone = clinic.phones[0];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <ClinicLogo
            alt={clinic.title}
            className="mt-0.5 shrink-0"
            initial={initial}
            logo={clinic.logoUrl ?? undefined}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/clinics/${clinic.slug}`}
              className="font-semibold leading-snug hover:text-primary hover:underline line-clamp-2"
            >
              {clinic.title}
            </Link>
            {(clinic.omsEnabled || clinic.networkName || typeLabel) && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {clinic.omsEnabled && <ClinicBadge label="ОМС" variant="oms" />}
                {clinic.networkName && <ClinicBadge label={clinic.networkName} variant="net" />}
                {typeLabel && <ClinicBadge label={typeLabel} variant="type" />}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        {addressText && (
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{addressText}</span>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
            {visibleTags.length > 0 ? "Специализации" : "Профиль"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.length > 0 ? (
              <>
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs rounded-md px-2 py-0.5"
                    style={{ background: "#e6f4f5", color: "#0a5d65" }}
                  >
                    {tag}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="text-xs font-semibold px-1 py-0.5" style={{ color: "#64748b" }}>
                    +{extraCount}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>
                Профиль уточняется
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center border-t pt-3">
          <div className="flex-1 min-w-0">
            {clinic.license && (
              <span
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: "#0a5d65" }}
              >
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="13"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  width="13"
                >
                  <path d="M4 12.5l5 5 11-11" />
                </svg>
                Лицензия
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {phone && (
              <a
                className="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                href={`tel:${phone.replace(/\s/g, "")}`}
                title={phone}
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
            <Link
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              href={`/clinics/${clinic.slug}`}
            >
              Профиль →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
