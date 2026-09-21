import Link from "next/link";
import { ArrowLeft, BellRing, CalendarDays, Clock3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STO_2026_EVENT, STO_2026_EVENT_PATH } from "@/lib/events/sto-2026";

export function EventRegistrationClosed() {
  return (
    <Card className="mx-auto max-w-2xl border-primary/20">
      <CardHeader className="bg-primary/5">
        <div className="flex items-start gap-3">
          <BellRing aria-hidden className="mt-1 h-6 w-6 shrink-0 text-primary" />
          <div>
            <CardTitle className="text-xl">Регистрация скоро откроется</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Программа конференции уже опубликована. Форма регистрации станет доступна после утверждения юридического текста согласия.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <ClosedFact icon={<CalendarDays aria-hidden />} text={STO_2026_EVENT.dateLabel} />
          <ClosedFact icon={<Clock3 aria-hidden />} text="Регистрация с 14:00 · начало в 15:00" />
          <ClosedFact icon={<MapPin aria-hidden />} text={STO_2026_EVENT.venueName} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={STO_2026_EVENT_PATH}><ArrowLeft aria-hidden className="h-4 w-4" /> Вернуться к конференции</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`${STO_2026_EVENT_PATH}#program`}>Изучить программу</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ClosedFact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex gap-2 rounded-md border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
      <span className="mt-0.5 shrink-0 text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
