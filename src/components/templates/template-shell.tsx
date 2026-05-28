import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EntityHeader } from "@/components/entity/entity-header";

export function TemplateShell({
  breadcrumbs,
  eyebrow,
  title,
  description,
  badges,
  children,
}: {
  breadcrumbs: BreadcrumbItem[];
  eyebrow: string;
  title: string;
  description: string;
  badges: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={breadcrumbs} />
      <EntityHeader
        badges={badges}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      {children}
    </div>
  );
}
