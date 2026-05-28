import { UserRound } from "lucide-react";
import { EntityBlock } from "@/components/entity/entity-block";
import { RelatedBlock } from "@/components/entity/related-block";
import { SchemaOrg } from "@/components/seo/schema-org";
import { TemplateShell } from "@/components/templates/template-shell";
import type { DoctorDetail } from "@/lib/loaders";
import { doctorFullName } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function DoctorTemplate({ data }: { data: DoctorDetail }) {
  const fullName = doctorFullName(data);
  const specialtyTitles = data.specialties.map((s) => s.specialty.title);

  const clinics = data.clinics.map((r) => ({
    href: `/clinics/${r.clinic.slug}`,
    title: r.clinic.title,
  }));
  const procedures = data.procedures.map((r) => ({
    href: `/procedures/${r.procedure.slug}`,
    title: r.procedure.title,
  }));
  const diseases = data.diseases.map((r) => ({
    href: `/diseases/${r.disease.slug}`,
    title: r.disease.title,
  }));
  const publications = data.publications.map((r) => ({
    href: `/publications/${r.slug}`,
    title: r.title,
    meta: r.publishedAt ? String(new Date(r.publishedAt).getFullYear()) : undefined,
  }));

  const badges = specialtyTitles.length ? specialtyTitles.slice(0, 3) : ["Офтальмолог"];

  return (
    <TemplateShell
      badges={badges}
      breadcrumbs={[{ href: "/doctors", label: "Врачи" }, { label: fullName }]}
      description={data.bio?.slice(0, 200) ?? ""}
      eyebrow={specialtyTitles[0] ?? "Врач-офтальмолог"}
      title={fullName}
    >
      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted">
            {data.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={fullName} className="h-full w-full object-cover" src={data.photoUrl} />
            ) : (
              <UserRound className="h-16 w-16 text-primary" />
            )}
          </div>
          <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            {(data.regionEntity?.title ?? data.region) && (
              <div>{data.regionEntity?.title ?? data.region}</div>
            )}
            {data.experienceYears != null && (
              <div>Опыт: {data.experienceYears} лет</div>
            )}
            {specialtyTitles.length > 0 && (
              <div>{specialtyTitles.join(", ")}</div>
            )}
          </div>
        </div>
        <div className="space-y-5">
          {data.bio && (
            <EntityBlock title="Биография">{data.bio}</EntityBlock>
          )}
          {data.career && (
            <EntityBlock title="Карьера">{data.career}</EntityBlock>
          )}
        </div>
        <div className="space-y-5">
          <RelatedBlock
            empty="Клиники будут добавлены при наполнении профиля."
            items={clinics}
            title="Клиники"
          />
          <RelatedBlock
            empty="Процедуры будут добавлены при наполнении профиля."
            items={procedures}
            title="Процедуры"
          />
          <RelatedBlock
            empty="Заболевания будут добавлены при наполнении профиля."
            items={diseases}
            title="Заболевания"
          />
          <RelatedBlock
            empty="Публикации будут добавлены при наполнении профиля."
            items={publications}
            title="Публикации"
          />
        </div>
      </div>
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/doctors", label: "Врачи" },
          { href: `/doctors/${data.slug}`, label: fullName },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "Physician",
          name: fullName,
          url: absoluteUrl(`/doctors/${data.slug}`),
        }}
      />
    </TemplateShell>
  );
}
