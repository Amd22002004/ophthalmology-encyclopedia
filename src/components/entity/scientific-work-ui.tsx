import { Check, ExternalLink, FileText, Lightbulb } from "lucide-react";

/**
 * Общий UI научной работы.
 * Используется и в блоке «Научная деятельность» на странице врача,
 * и на отдельной странице работы /publications/[slug] — чтобы оформление
 * этих разделов не расходилось.
 */

/** Поле информационного блока: подпись сверху, значение снизу. */
export function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-[3px]">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="text-[13.5px] leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

/** Карточка научной новизны. */
export function NoveltyCard({ text }: { text: string }) {
  return (
    <div className="flex gap-[10px] rounded-[11px] border border-[#d8e3e1] bg-gradient-to-br from-[#e6f4f5]/60 to-[#f0faf8]/40 p-[13px_14px] shadow-[0_1px_3px_rgba(15,33,31,0.04)]">
      <span
        aria-hidden
        className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-primary/15"
      >
        <Check className="h-[13px] w-[13px] text-primary" />
      </span>
      <p className="text-[13px] leading-relaxed text-foreground/85">{text}</p>
    </div>
  );
}

/** Карточка практической значимости. */
export function PracticalCard({ text }: { text: string }) {
  return (
    <div className="flex gap-[10px] rounded-[11px] border border-[#d8e3e1] bg-gradient-to-br from-[#fff8eb]/50 to-[#fffdf5]/30 p-[13px_14px] shadow-[0_1px_3px_rgba(15,33,31,0.04)]">
      <span
        aria-hidden
        className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#f59e0b]/15"
      >
        <Lightbulb className="h-[13px] w-[13px] text-[#d97706]" />
      </span>
      <p className="text-[13px] leading-relaxed text-foreground/85">{text}</p>
    </div>
  );
}

/**
 * Достаёт из текста результата ведущий числовой показатель для крупного акцента.
 * Значение берётся ДОСЛОВНО из строки — ничего не додумывается.
 * Если показателя нет, вернётся null и карточка покажет только текст.
 */
export function extractMetric(text: string): string | null {
  const m = text.match(/(\d+[.,]?\d*)\s*(%|мкм|D\b|раза|раз)/);
  return m ? `${m[1]} ${m[2]}` : null;
}

/** Карточка результата: крупная величина из текста + полный текст под ней. */
export function ResultCard({ text }: { text: string }) {
  const metric = extractMetric(text);
  return (
    <div className="rounded-[11px] border border-[#d8e3e1] bg-card p-[13px_14px] shadow-[0_1px_3px_rgba(15,33,31,0.04)]">
      {metric && (
        <p className="text-[20px] font-extrabold leading-none tracking-[-0.01em] text-primary">
          {metric}
        </p>
      )}
      <p
        className={`text-[12.5px] leading-relaxed text-foreground/80 ${metric ? "mt-[6px]" : ""}`}
      >
        {text}
      </p>
    </div>
  );
}

/** Карточка документа PDF: действие названо явно. */
export function DocCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description?: string;
}) {
  return (
    <a
      className="group flex flex-1 items-start gap-[12px] rounded-[11px] border border-[#d8e3e1] bg-card p-[14px_16px] shadow-[0_1px_3px_rgba(15,33,31,0.04)] transition-all duration-200 hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-[0_2px_10px_rgba(15,118,110,0.1)]"
      href={href}
      rel="noopener"
      target="_blank"
    >
      <span
        aria-hidden
        className="mt-[1px] flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] bg-primary/10 transition-colors group-hover:bg-primary/20"
      >
        <FileText className="h-[17px] w-[17px] text-primary" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-foreground transition-colors group-hover:text-primary">
          {title}
        </span>
        {description && (
          <span className="mt-[2px] block text-[11.5px] text-muted-foreground">{description}</span>
        )}
        {/* Явное действие: понятно, что откроется документ */}
        <span className="mt-[4px] inline-flex items-center gap-[4px] text-[12px] font-medium text-primary/80 transition-colors group-hover:text-primary">
          Посмотреть
          <ExternalLink className="h-[11px] w-[11px] transition-transform duration-200 group-hover:translate-x-[2px]" />
        </span>
      </span>
    </a>
  );
}

/** Разбивает организацию на строки по «;», выделяя город из скобок. */
export function parseOrganization(raw: string): { lines: string[]; city: string | null } {
  const cityMatch = raw.match(/\(([^)]+)\)\s*$/);
  const city = cityMatch ? cityMatch[1] : null;
  const clean = city ? raw.replace(/\s*\([^)]+\)\s*$/, "") : raw;
  const lines = clean
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  return { lines, city };
}

/** Разбирает «ФИО, степень, звание» на имя и регалии. */
export function parseSupervisor(raw: string): { name: string; titles: string[] } {
  const parts = raw.split(",").map((s) => s.trim());
  return { name: parts[0], titles: parts.slice(1) };
}

/**
 * Разбивает сплошной текст аннотации на абзацы по ~2 предложения —
 * чтобы описание не читалось «простынёй».
 */
export function splitIntoParagraphs(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(
      sentences
        .slice(i, i + 2)
        .map((s) => s.trim())
        .join(" "),
    );
  }
  return paragraphs;
}
