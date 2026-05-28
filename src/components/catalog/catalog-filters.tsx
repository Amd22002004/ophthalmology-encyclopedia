import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CatalogFilters({ placeholder }: { placeholder: string }) {
  return (
    <form action="/search" className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_auto]">
      <Input name="q" placeholder={placeholder} />
      <Button type="submit" variant="secondary">
        <Search className="h-4 w-4" />
        Фильтровать
      </Button>
    </form>
  );
}
