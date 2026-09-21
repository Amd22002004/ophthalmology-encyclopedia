import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildAppealHref } from "@/lib/appeals/navigation";
import { cn } from "@/lib/utils";

export function AppealInvitation({
  investigationSlug,
  compact = false,
  title = "Есть информация по данному расследованию?",
  description = "Если вы располагаете документами или считаете, что ваша ситуация может быть связана с опубликованными материалами, направьте обращение в Ассоциацию.",
  actionLabel,
}: {
  investigationSlug?: string;
  compact?: boolean;
  title?: string;
  description?: string;
  actionLabel?: string;
}) {
  const href = buildAppealHref(investigationSlug);

  return (
    <section
      className={cn(
        "rounded-lg border border-primary/20 bg-primary/5",
        compact ? "p-4" : "p-5 sm:p-6",
      )}
      aria-label={title}
    >
      <div className={cn("flex gap-3", !compact && "sm:items-start")}>
        <MessageSquareText aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className={cn("font-semibold text-foreground", compact ? "text-base" : "text-lg")}>{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          {!compact && (
            <div className="mt-3 space-y-1 text-xs leading-5 text-muted-foreground">
              <p>Каждое обращение рассматривается индивидуально.</p>
              <p>Представленные материалы используются для проверки изложенных обстоятельств и формирования доказательной базы.</p>
            </div>
          )}
          <Button asChild className="mt-4" size={compact ? "sm" : "default"}>
            <Link href={href}>{actionLabel ?? (compact ? "Подать обращение" : "Отправить обращение")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
