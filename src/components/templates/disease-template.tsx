import { EntityBlock } from "@/components/entity/entity-block";
import { RelatedBlock } from "@/components/entity/related-block";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { DiseaseDetail } from "@/lib/loaders";
import { doctorFullName } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function DiseaseTemplate({ data }: { data: DiseaseDetail }) {
  const badges = [
    data.category?.title,
    data.icdCode ? `МКБ: ${data.icdCode}` : null,
  ].filter(Boolean) as string[];

  const doctors = data.doctors.map((r) => ({
    href: `/doctors/${r.doctor.slug}`,
    title: doctorFullName(r.doctor),
  }));
  const guidelines = data.guidelines.map((r) => ({
    href: `/guidelines/${r.guideline.slug}`,
    title: r.guideline.title,
  }));
  const publications = data.publications.map((r) => ({
    href: `/publications/${r.publication.slug}`,
    title: r.publication.title,
  }));
  const procedures = data.procedures.map((r) => ({
    href: `/procedures/${r.procedure.slug}`,
    title: r.procedure.title,
  }));
  // Заболевание → Оборудование (двусторонняя связь с разделом оборудования)
  const equipment = data.equipment.map((r) => ({
    href: `/equipment/${r.equipment.slug}`,
    title: r.equipment.title,
    meta: r.equipment.manufacturer ?? undefined,
  }));

  return (
    <TemplateShell
      badges={badges}
      breadcrumbs={[{ href: "/diseases", label: "Заболевания" }, { label: data.title }]}
      description={data.summary ?? ""}
      eyebrow={data.category?.title ?? "Заболевание органа зрения"}
      title={data.title}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {data.description && (
            <EntityBlock title="Описание">{data.description}</EntityBlock>
          )}
          {data.symptoms.length > 0 && (
            <EntityBlock title="Симптомы">
              <ul className="list-disc space-y-1 pl-4">
                {data.symptoms.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </EntityBlock>
          )}
          {data.diagnostics && (
            <EntityBlock title="Диагностика">{data.diagnostics}</EntityBlock>
          )}
          {data.treatment && (
            <EntityBlock title="Лечение и коррекция">{data.treatment}</EntityBlock>
          )}
        </div>
        <div className="space-y-5">
          <RelatedBlock
            empty="Врачи, специализирующиеся на данном заболевании, пока не добавлены."
            items={doctors}
            title="Врачи"
          />
          <RelatedBlock
            empty="Клинические рекомендации будут связаны при наполнении раздела."
            items={guidelines}
            title="Клинические рекомендации"
          />
          <RelatedBlock
            empty="Научные публикации будут связаны при наполнении раздела."
            items={publications}
            title="Публикации"
          />
          <RelatedBlock
            empty="Процедуры будут связаны при наполнении раздела."
            items={procedures}
            title="Процедуры"
          />
          {equipment.length > 0 && (
            <RelatedBlock empty="" items={equipment} title="Оборудование" />
          )}
        </div>
      </div>
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/diseases", label: "Заболевания" },
          { href: `/diseases/${data.slug}`, label: data.title },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalCondition",
          name: data.title,
          url: absoluteUrl(`/diseases/${data.slug}`),
          ...(data.icdCode
            ? { code: { "@type": "MedicalCode", codeValue: data.icdCode, codingSystem: "ICD-10" } }
            : {}),
        }}
      />
    </TemplateShell>
  );
}
