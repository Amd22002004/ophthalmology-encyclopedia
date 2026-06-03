"use client";

import { useState } from "react";
import { ClinicCard } from "@/components/entity/clinic-card";
import { Button } from "@/components/ui/button";
import type { StaticClinic } from "@/lib/clinics-data";

type FilterKey =
  | "all"
  | "oms"
  | "vizus1"
  | "centres"
  | "cabinets"
  | "tyumen"
  | "hmao"
  | "yanao";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "oms", label: "ОМС" },
  { key: "vizus1", label: "Визус-1" },
  { key: "centres", label: "Центры" },
  { key: "cabinets", label: "Кабинеты" },
  { key: "tyumen", label: "Тюменская область" },
  { key: "hmao", label: "ХМАО" },
  { key: "yanao", label: "ЯНАО" },
];

function matches(c: StaticClinic, key: FilterKey): boolean {
  switch (key) {
    case "all":      return true;
    case "oms":      return c.omsEnabled;
    case "vizus1":   return c.networkName === "Визус-1";
    case "centres":  return c.clinicType === "centre";
    case "cabinets": return c.clinicType === "cabinet";
    case "tyumen":   return c.region === "Тюменская область";
    case "hmao":     return c.region.includes("ХМАО");
    case "yanao":    return c.region === "ЯНАО";
  }
}

export function ClinicsFilteredGrid({ clinics }: { clinics: StaticClinic[] }) {
  const [active, setActive] = useState<FilterKey>("all");
  const filtered = clinics.filter((c) => matches(c, active));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => {
            const count = clinics.filter((c) => matches(c, key)).length;
            return (
              <Button
                key={key}
                size="sm"
                variant={active === key ? "default" : "outline"}
                onClick={() => setActive(key)}
              >
                {label}
                <span className="ml-1 opacity-60">{count}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          По этому фильтру клиник не найдено
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <ClinicCard key={c.slug} clinic={c} />
          ))}
        </div>
      )}
    </div>
  );
}
