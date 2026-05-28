import { Badge } from "@/components/ui/badge";

export function EntityBadge({ children }: { children: React.ReactNode }) {
  return <Badge variant="secondary">{children}</Badge>;
}
