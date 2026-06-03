import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EntityCard({
  href,
  title,
  description,
  badges,
}: {
  href: string;
  title: string;
  description: string;
  badges?: string[];
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-accent">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="leading-6">{title}</CardTitle>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {badges.map((b) => (
                <Badge key={b} variant="secondary" className="font-normal">
                  {b}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <CardDescription className="leading-6">{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
