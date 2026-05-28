import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EntityBlock } from "@/components/entity/entity-block";
import { EntityHeader } from "@/components/entity/entity-header";
import { SchemaOrg } from "@/components/seo/schema-org";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function StaticSectionTemplate({
  title,
  eyebrow,
  description,
  path,
  blocks,
}: {
  title: string;
  eyebrow: string;
  description: string;
  path: string;
  blocks: { title: string; body: string }[];
}) {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: title }]} />
      <EntityHeader
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {blocks.map((block) => (
          <EntityBlock key={block.title} title={block.title}>
            {block.body}
          </EntityBlock>
        ))}
      </div>
      <SchemaOrg data={breadcrumbJsonLd([{ href: "/", label: "Главная" }, { href: path, label: title }])} />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          description,
          url: absoluteUrl(path),
        }}
      />
    </div>
  );
}
