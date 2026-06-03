import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClinicLogo, getClinicInitial } from "@/components/entity/clinic-logo";
import { CLINIC_TYPE_LABEL, type StaticClinic } from "@/lib/clinics-data";

export function ClinicCard({ clinic }: { clinic: StaticClinic }) {
  const initial = getClinicInitial(clinic.networkName, clinic.title);

  const badges = [
    clinic.omsEnabled ? "ОМС" : null,
    CLINIC_TYPE_LABEL[clinic.clinicType],
    clinic.networkName ?? null,
  ].filter((x): x is string => x !== null);

  return (
    <Link href={`/clinics/${clinic.slug}`}>
      <Card className="h-full transition-colors hover:bg-accent">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <ClinicLogo
              alt={clinic.title}
              className="mt-0.5"
              initial={initial}
              logo={clinic.logo}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="leading-6">{clinic.title}</CardTitle>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              {badges.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {badges.map((b) => (
                    <Badge key={b} className="font-normal" variant="secondary">
                      {b}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            {clinic.city} · {clinic.region}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
