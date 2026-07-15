import { EntityBlock } from "@/components/entity/entity-block";
import { RelatedBlock } from "@/components/entity/related-block";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { ProcedureDetail } from "@/lib/loaders";
import { doctorFullName } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function ProcedureTemplate({ data }: { data: ProcedureDetail }) {
  const badges = data.category?.title ? [data.category.title] : [];

  const diseases = data.diseases.map((r) => ({
    href: `/diseases/${r.disease.slug}`,
    title: r.disease.title,
  }));
  const doctors = data.doctors.map((r) => ({
    href: `/doctors/${r.doctor.slug}`,
    title: doctorFullName(r.doctor),
  }));
  const equipment = data.equipment.map((r) => ({
    href: `/equipment/${r.equipment.slug}`,
    title: r.equipment.title,
  }));
  // Процедура → Научные работы (прямая связь: работа реально исследует эту методику)
  const scientificWorks = data.scientificWorks
    .filter((r) => r.work.slug)
    .map((r) => ({
      href: `/publications/${r.work.slug}`,
      title: r.work.title,
      meta: [r.work.type, doctorFullName(r.work.doctor), r.work.year].filter(Boolean).join(" · "),
    }));

  return (
    <TemplateShell
      badges={badges}
      breadcrumbs={[{ href: "/procedures", label: "Процедуры" }, { label: data.title }]}
      description={data.summary ?? ""}
      eyebrow={data.category?.title ?? "Диагностика и лечение"}
      title={data.title}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {data.description && (
            <EntityBlock title="Описание">{data.description}</EntityBlock>
          )}
        </div>
        <div className="space-y-5">
          <RelatedBlock
            empty="Заболевания, при которых применяется процедура, пока не добавлены."
            items={diseases}
            title="Заболевания"
          />
          <RelatedBlock
            empty="Врачи, выполняющие данную процедуру, пока не добавлены."
            items={doctors}
            title="Врачи"
          />
          {scientificWorks.length > 0 && (
            <RelatedBlock empty="" items={scientificWorks} title="Научные работы" />
          )}
          <RelatedBlock
            empty="Используемое оборудование будет связано при наполнении раздела."
            items={equipment}
            title="Оборудование"
          />
        </div>
      </div>
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/procedures", label: "Процедуры" },
          { href: `/procedures/${data.slug}`, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalProcedure",
          name: data.title,
          url: absoluteUrl(`/procedures/${data.slug}`),
        }}
      />
    </TemplateShell>
  );
}
