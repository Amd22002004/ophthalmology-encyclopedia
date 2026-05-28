import { EntityBadge } from "@/components/entity/entity-badge";

export function EntityHeader({
  eyebrow,
  title,
  description,
  badges = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  badges?: string[];
}) {
  return (
    <header className="rounded-lg border bg-card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-primary">
        {eyebrow}
      </div>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        {badges.length ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {badges.map((badge) => (
              <EntityBadge key={badge}>{badge}</EntityBadge>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
