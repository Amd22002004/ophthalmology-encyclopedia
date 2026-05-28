import { ClipboardList } from "lucide-react";

export function CatalogEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed bg-card p-6 text-center">
      <ClipboardList className="h-8 w-8 text-primary" />
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
