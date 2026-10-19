import Link from "next/link";
import { associationHomeContent } from "@/lib/association-content";
import { homeMembersAnchorId } from "@/lib/content-model";
import { Button } from "@/components/ui/button";

export function NewsMembershipCta() {
  const { audiences, join } = associationHomeContent;

  return (
    <section aria-labelledby="news-membership-title" className="rounded-lg border border-primary/20 bg-secondary p-5">
      <h2 className="sr-only" id="news-membership-title">
        Вступить в Ассоциацию
      </h2>
      <p className="text-base leading-7 text-foreground">{join.callToAction}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <BenefitColumn items={audiences.clinics.benefits} title={audiences.clinics.title} />
        <BenefitColumn items={audiences.doctors.benefits} title={audiences.doctors.title} />
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href={join.href}>Вступить в Ассоциацию</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/#${homeMembersAnchorId}`}>Клиники-участники</Link>
        </Button>
      </div>
    </section>
  );
}

function BenefitColumn({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground">
        {items.map((item) => (
          <li className="relative pl-4 before:absolute before:left-0 before:top-[0.65em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
