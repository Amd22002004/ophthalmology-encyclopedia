import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RelatedItem = {
  href: string;
  title: string;
  meta?: string;
};

export function RelatedBlock({
  title,
  empty,
  items = [],
}: {
  title: string;
  empty: string;
  items?: RelatedItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent"
                href={item.href}
                key={item.href}
              >
                <span>
                  <span className="font-medium text-foreground">{item.title}</span>
                  {item.meta ? (
                    <span className="ml-2 text-muted-foreground">{item.meta}</span>
                  ) : null}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  );
}
