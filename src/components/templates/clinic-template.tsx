import { EntityBlock } from "@/components/entity/entity-block";
import { RelatedBlock } from "@/components/entity/related-block";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { ClinicDetail } from "@/lib/loaders";
import { doctorFullName } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function ClinicTemplate({ data }: { data: ClinicDetail }) {
  const badges = [
    data.omsEnabled ? "ОМС" : null,
    data.contractBased ? "Договорная основа" : null,
    data.regionEntity?.title ?? data.region ?? null,
  ].filter(Boolean) as string[];

  const doctors = data.doctors.map((r) => ({
    href: `/doctors/${r.doctor.slug}`,
    title: doctorFullName(r.doctor),
  }));
  const specialties = data.specialties.map((r) => ({
    href: `/procedures`,
    title: r.specialty.title,
  }));

  return (
    <TemplateShell
      badges={badges}
      breadcrumbs={[{ href: "/clinics", label: "Клиники" }, { label: data.title }]}
      description={data.description ?? ""}
      eyebrow={data.regionEntity?.title ?? data.region ?? "Медицинская организация"}
      title={data.title}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {data.description && (
            <EntityBlock title="Описание">{data.description}</EntityBlock>
          )}
          {(data.phone || data.email || data.website || data.address) && (
            <EntityBlock title="Контакты">
              <div className="space-y-1">
                {data.address && <div>{data.address}</div>}
                {data.phone && <div>Тел.: {data.phone}</div>}
                {data.email && <div>Email: {data.email}</div>}
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
          {(data.licenseStatus || data.omsEnabled || data.contractBased) && (
            <EntityBlock title="Статус и формы работы">
              <div className="space-y-1">
                {data.licenseStatus && <div>Лицензия: {data.licenseStatus}</div>}
                {data.omsEnabled && <div>Принимает по ОМС</div>}
                {data.contractBased && <div>Работает на договорной основе</div>}
              </div>
            </EntityBlock>
          )}
        </div>
        <div className="space-y-5">
          <RelatedBlock
            empty="Врачи будут добавлены при наполнении профиля клиники."
            items={doctors}
            title="Врачи"
          />
          <RelatedBlock
            empty="Специализации будут добавлены при наполнении профиля."
            items={specialties}
            title="Специализации"
          />
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
        }}
      />
    </TemplateShell>
  );
}
