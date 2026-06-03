import Image from "next/image";
import { cn } from "@/lib/utils";

export function getClinicInitial(networkName: string | undefined, title: string): string {
  const source = networkName ?? title;
  const match = source.match(/[А-ЯЁA-Z]/);
  return match ? match[0] : source[0]?.toUpperCase() ?? "?";
}

const SIZE = {
  sm: { cls: "h-10 w-10 text-sm", px: 40 },
  md: { cls: "h-12 w-12 text-base", px: 48 },
  lg: { cls: "h-16 w-16 text-xl", px: 64 },
} as const;

export function ClinicLogo({
  logo,
  initial,
  alt,
  size = "md",
  className,
}: {
  logo?: string;
  initial: string;
  alt: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const { cls, px } = SIZE[size];

  if (logo) {
    return (
      <div className={cn("shrink-0 overflow-hidden rounded-lg border bg-card", cls, className)}>
        <Image
          alt={alt}
          className="h-full w-full object-contain"
          height={px}
          src={logo}
          width={px}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-lg border bg-primary/10 font-bold text-primary",
        cls,
        className,
      )}
    >
      {initial}
    </div>
  );
}
