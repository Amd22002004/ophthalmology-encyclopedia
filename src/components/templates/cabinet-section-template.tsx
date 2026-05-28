import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EntityBlock } from "@/components/entity/entity-block";
import { EntityHeader } from "@/components/entity/entity-header";
import { Button } from "@/components/ui/button";

export function CabinetSectionTemplate({
  title,
  description,
  blocks,
}: {
  title: string;
  description: string;
  blocks: { title: string; body: string }[];
}) {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ href: "/cabinet", label: "Кабинет" }, { label: title }]} />
      <EntityHeader
        description={description}
        eyebrow="Личный кабинет"
        title={title}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-5">
          {blocks.map((block) => (
            <EntityBlock key={block.title} title={block.title}>
              {block.body}
            </EntityBlock>
          ))}
        </div>
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold">Навигация кабинета</h2>
          <div className="mt-4 grid gap-2">
            {[
              ["/cabinet/profile", "Профиль"],
              ["/cabinet/publications", "Публикации"],
              ["/cabinet/publications/new", "Новая публикация"],
            ].map(([href, label]) => (
              <Button asChild key={href} variant="outline">
                <Link href={href}>
                  {label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
