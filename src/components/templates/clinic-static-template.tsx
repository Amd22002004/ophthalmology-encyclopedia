import { Badge } from "@/components/ui/badge";
import { EntityBlock } from "@/components/entity/entity-block";
import { ClinicLogo, getClinicInitial } from "@/components/entity/clinic-logo";
import { RelatedBlock } from "@/components/entity/related-block";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SchemaOrg } from "@/components/seo/schema-org";
import {
  CLINIC_TYPE_LABEL,
  getClinicBySlug,
  type StaticClinic,
} from "@/lib/clinics-data";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function ClinicStaticTemplate({ data }: { data: StaticClinic }) {
  const eyebrow = `${data.city} · ${data.region}`;
  const initial = getClinicInitial(data.networkName, data.title);

  const badges = [
    data.omsEnabled ? "ОМС" : null,
    CLINIC_TYPE_LABEL[data.clinicType],
    data.networkName ?? null,
  ].filter((x): x is string => x !== null);

  const relatedClinics = (data.relatedSlugs ?? [])
    .map(getClinicBySlug)
    .filter((c): c is StaticClinic => c !== undefined)
    .map((c) => ({
      href: `/clinics/${c.slug}`,
      title: c.title,
      meta: c.city,
    }));

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[{ href: "/clinics", label: "Клиники" }, { label: data.title }]}
      />

      {/* Header with logo */}
      <header className="rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <ClinicLogo
            alt={data.title}
            initial={initial}
            logo={data.logo}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {data.title}
            </h1>
            {badges.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {badges.map((b) => (
                  <Badge key={b} variant="secondary">
                    {b}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {data.legalName && data.legalName !== data.title && (
            <EntityBlock title="Юридическое наименование">
              {data.legalName}
            </EntityBlock>
          )}

          {(data.website || data.address) && (
            <EntityBlock title="Контакты">
              <div className="space-y-1">
                {data.address && <div>{data.address}</div>}
                {data.website && (
                  <a
                    className="text-primary hover:underline"
                    href={data.website}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {data.website}
                  </a>
                )}
              </div>
            </EntityBlock>
          )}

          <EntityBlock title="Формы работы">
            {data.omsEnabled
              ? "Принимает пациентов по полису ОМС."
              : "Информация о формах работы уточняется."}
          </EntityBlock>
        </div>

        <div className="space-y-5">
          {relatedClinics.length > 0 && (
            <RelatedBlock
              empty=""
              items={relatedClinics}
              title="Организации по тому же адресу"
            />
          )}
        </div>
      </div>

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/clinics", label: "Клиники" },
          { href: `/clinics/${data.slug}`, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalOrganization",
          name: data.title,
          url: absoluteUrl(`/clinics/${data.slug}`),
          ...(data.address ? { address: data.address } : {}),
          ...(data.website ? { sameAs: data.website } : {}),
        }}
      />
    </div>
  );
}
