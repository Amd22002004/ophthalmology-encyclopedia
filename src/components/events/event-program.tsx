import type { STO2026ProgramItem, STO2026Speaker } from "@/lib/events/sto-2026";
import { formatSto2026Interval } from "@/lib/events/sto-2026";

export function EventProgram({
  program,
  speakers,
}: {
  program: readonly STO2026ProgramItem[];
  speakers: readonly STO2026Speaker[];
}) {
  const speakersByOrder = new Map(speakers.map((speaker) => [speaker.order, speaker]));

  return (
    <ol className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" data-event-program="sto-2026">
      {program.map((item) => {
        const speaker = item.speakerOrder ? speakersByOrder.get(item.speakerOrder) : undefined;
        const interval = formatSto2026Interval(item);
        if (item.kind === "section") {
          return (
            <li
              className="border-b border-border bg-accent px-4 py-3 last:border-b-0 sm:px-5"
              data-program-item={item.order}
              data-program-kind={item.kind}
              key={item.order}
            >
              <p className="text-sm font-semibold tracking-tight text-primary">
                <time dateTime={item.startTime}>{interval}</time>
                <span className="mx-2 text-primary/50" aria-hidden>
                  ·
                </span>
                {item.title}
              </p>
            </li>
          );
        }

        return (
          <li
            className="grid grid-cols-[7.75rem_minmax(0,1fr)] gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[8.25rem_minmax(0,1fr)] sm:gap-4 sm:px-5 sm:py-4"
            data-program-item={item.order}
            data-program-kind={item.kind}
            key={item.order}
          >
            <time className="self-start whitespace-nowrap pt-0.5 text-sm font-semibold tabular-nums text-foreground" dateTime={item.startTime}>
              {interval}
            </time>
            <div className="min-w-0">
              <p className={item.kind === "talk" ? "text-sm font-medium leading-6 text-foreground" : "text-sm font-semibold leading-6 text-foreground"}>
                {item.title}
              </p>
              {speaker && (
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {speaker.fullName}
                  <span className="text-muted-foreground/80"> — {speaker.credentials}</span>
                </p>
              )}
              {item.detail && <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
