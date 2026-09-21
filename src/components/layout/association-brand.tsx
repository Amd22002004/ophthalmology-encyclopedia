import Image from "next/image";
import Link from "next/link";

type AssociationLogoProps = {
  size?: "hero" | "sidebar" | "compact";
  className?: string;
};

const logoSizes = {
  hero: { width: 96, height: 96, className: "rounded-lg" },
  sidebar: { width: 48, height: 48, className: "rounded-md" },
  compact: { width: 32, height: 32, className: "rounded-md" },
} as const;

export function AssociationLogo({ size = "sidebar", className }: AssociationLogoProps) {
  const dimensions = logoSizes[size];
  return (
    <Image
      src="/association-logo.png"
      alt=""
      width={dimensions.width}
      height={dimensions.height}
      className={`${dimensions.className}${className ? ` ${className}` : ""}`}
    />
  );
}

export function AssociationBrand({ variant = "sidebar" }: { variant?: "sidebar" | "compact" }) {
  if (variant === "compact") {
    return (
      <Link
        href="/"
        aria-label="Ассоциация офтальмологических клиник — профессиональное объединение"
        className="flex min-w-0 shrink items-center gap-1.5 max-[359px]:gap-1"
      >
        <AssociationLogo className="h-9 w-9 shrink-0 max-[359px]:h-[34px] max-[359px]:w-[34px]" size="compact" />
        <span className="min-w-0 max-w-[230px] text-center text-[14px] font-semibold leading-[1.05] text-foreground min-[400px]:text-[15px] max-[374px]:max-w-[195px] max-[374px]:text-[13px] max-[374px]:tracking-[-0.015em] max-[359px]:max-w-[171px] max-[359px]:text-[12.5px] max-[359px]:tracking-[-0.04em]">
          <span className="block whitespace-nowrap">Ассоциация</span>
          <span className="block whitespace-nowrap">офтальмологических клиник</span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/"
      aria-label="Ассоциация офтальмологических клиник — профессиональное объединение"
      className="flex min-w-0 items-center gap-3"
    >
      <AssociationLogo size="sidebar" />
      <span className="min-w-0 leading-tight">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
          Профессиональное объединение
        </span>
        <span className="mt-1 block text-sm font-semibold text-foreground">
          Ассоциация офтальмологических клиник
        </span>
      </span>
    </Link>
  );
}
