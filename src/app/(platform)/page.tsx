import Link from "next/link";
import { ArrowRight, Building2, Check, Stethoscope, type LucideIcon } from "lucide-react";
import { associationPrincipleIcons } from "@/components/association/principle-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EntityCard } from "@/components/entity/entity-card";
import {
  DrawnStepsList,
  HomeMotionProvider,
  PressScale,
  RevealSection,
  StaggerIcon,
  StaggerIconList,
  StepConnector,
} from "@/components/home/home-motion";
import { SchemaOrg } from "@/components/seo/schema-org";
import { audienceHubs, homeMembersAnchorId } from "@/lib/content-model";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import { associationHomeContent as content } from "@/lib/association-content";

export const metadata = createPageMetadata({
  title: "Ассоциация офтальмологических клиник — федеральное профессиональное объединение",
  description: content.about.lead,
  path: "/",
  absoluteTitle: true,
});

function AudienceCard({
  audience,
  icon: Icon,
  moreLabel,
}: {
  audience: typeof content.audiences.clinics | typeof content.audiences.doctors;
  icon: LucideIcon;
  moreLabel: string;
}) {
  return (
    <Card className="flex h-full flex-col p-5 sm:p-6">
      <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
      <h3 className="mt-3 text-lg font-semibold tracking-tight">{audience.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{audience.intro}</p>
      <ul className="mt-4 space-y-2">
        {audience.benefits.map((benefit) => (
          <li className="flex items-start gap-2.5 text-sm font-medium leading-6" key={benefit}>
            <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm font-semibold leading-6 text-primary">{audience.closing}</p>
      <div className="mt-auto pt-4">
        <Link
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href={audience.href}
        >
          {moreLabel}
          <span className="sr-only">: {audience.title.toLowerCase()}</span>
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}

export default function HomePage() {
  const { hero, about, audiences, join, members } = content;

  return (
    <HomeMotionProvider>
      <div className="space-y-5 md:space-y-6">
        <section
          aria-labelledby="home-hero-title"
          className="home-hero relative isolate overflow-hidden rounded-xl border bg-card bg-cover bg-center"
        >
          <div className="relative z-10 p-5 sm:p-6 md:max-w-[62%] md:p-8 lg:max-w-[58%] lg:p-10">
            <div className="home-hero-reveal">
              <h1
                className="text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-foreground sm:text-3xl lg:text-[2.35rem]"
                id="home-hero-title"
              >
                {hero.title}
              </h1>
              <p className="mt-3 text-base font-medium leading-6 text-foreground sm:text-lg sm:leading-7">
                {hero.subtitle}
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-primary">{hero.directions}</p>
            </div>
            <p className="home-hero-reveal mt-4 max-w-xl text-sm leading-6 text-foreground [--hero-reveal-delay:80ms] sm:text-base sm:leading-7">
              {hero.lead}
            </p>
            <div className="home-hero-reveal mt-6 flex flex-col gap-3 [--hero-reveal-delay:160ms] sm:flex-row sm:flex-wrap">
              <PressScale className="w-full sm:w-auto">
                <Button asChild className="min-h-12 w-full sm:min-h-11 sm:w-auto" size="lg">
                  <Link href={join.href}>{hero.primaryCta}</Link>
                </Button>
              </PressScale>
              <Button
                asChild
                className="min-h-12 w-full border-primary text-primary hover:bg-primary/5 hover:text-primary sm:min-h-11 sm:w-auto"
                size="lg"
                variant="outline"
              >
                <a href={`#${homeMembersAnchorId}`}>{hero.secondaryCta}</a>
              </Button>
            </div>
          </div>
        </section>

        <RevealSection
          aria-labelledby="home-about-title"
          className="rounded-xl border bg-card p-5 sm:p-6 lg:p-8"
        >
          <div className="max-w-4xl">
            <h2 className="text-2xl font-semibold tracking-tight" id="home-about-title">
              {about.title}
            </h2>
            <p className="mt-3 text-base leading-7 text-foreground">{about.lead}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-primary">{about.bridge}</p>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <figure className="rounded-lg border-l-4 border-primary bg-primary/[0.04] p-5 sm:p-6">
              <figcaption className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {about.missionTitle}
              </figcaption>
              <blockquote className="mt-3 text-lg font-semibold leading-8 text-foreground sm:text-xl sm:leading-9">
                <p>{about.mission}</p>
              </blockquote>
            </figure>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {about.principlesTitle}
              </h3>
              <StaggerIconList className="mt-3 space-y-3">
                {about.principles.map((title, index) => {
                  const Icon = associationPrincipleIcons[index];
                  return (
                    <li className="flex items-center gap-3" key={title}>
                      <StaggerIcon className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-[18px] w-[18px]" />
                      </StaggerIcon>
                      <p className="min-w-0 text-sm font-semibold leading-6">{title}</p>
                    </li>
                  );
                })}
              </StaggerIconList>
            </div>
          </div>
        </RevealSection>

        <RevealSection aria-labelledby="home-audiences-title">
          <h2 className="sr-only" id="home-audiences-title">
            {audiences.title}
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <AudienceCard audience={audiences.clinics} icon={Building2} moreLabel={audiences.moreLabel} />
            <AudienceCard audience={audiences.doctors} icon={Stethoscope} moreLabel={audiences.moreLabel} />
          </div>
          <p className="mt-4 text-center text-sm font-medium leading-6 text-muted-foreground">{audiences.caption}</p>
        </RevealSection>

        <section aria-labelledby="home-join-title" className="rounded-xl border bg-card p-5 sm:p-6 lg:p-8">
          <h2 className="text-2xl font-semibold tracking-tight" id="home-join-title">
            {join.title}
          </h2>
          <DrawnStepsList className="mt-6 grid gap-5 md:grid-cols-4">
            {join.steps.map((step, index) => (
              <li className="relative flex gap-4 md:flex-col md:gap-3" key={step}>
                {index < join.steps.length - 1 && <StepConnector index={index} />}
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-4 ring-card">
                  {index + 1}
                </span>
                <p className="min-w-0 pt-2 text-sm leading-6 text-foreground md:pt-0 md:pr-2">{step}</p>
              </li>
            ))}
          </DrawnStepsList>
          <div className="mt-7 flex flex-col gap-4 rounded-lg bg-primary/[0.05] p-5 md:flex-row md:items-center md:justify-between">
            <p className="max-w-3xl text-sm font-medium leading-6 text-foreground sm:text-base sm:leading-7">
              {join.callToAction}
            </p>
            <PressScale className="w-full shrink-0 md:w-auto">
              <Button asChild className="min-h-12 w-full md:min-h-11 md:w-auto" size="lg">
                <Link href={join.href}>{join.cta}</Link>
              </Button>
            </PressScale>
          </div>
        </section>

        <RevealSection aria-labelledby="home-members-title" className="scroll-mt-24" id={homeMembersAnchorId}>
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <h2 className="text-2xl font-semibold tracking-tight" id="home-members-title">
              {members.title}
            </h2>
            <Link
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={members.allHref}
            >
              {members.allLabel}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {members.clinics.map((clinic) => (
              <li className="flex h-full items-start gap-3 rounded-lg border bg-card p-4 shadow-sm" key={clinic.name}>
                <Building2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="font-semibold leading-6">{clinic.name}</p>
                  <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{clinic.city}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{members.more}</p>
        </RevealSection>

        <section aria-labelledby="home-directories-title">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight" id="home-directories-title">
            {content.directoriesTitle}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {audienceHubs.map((hub) => (
              <EntityCard key={hub.href} {...hub} />
            ))}
          </div>
        </section>

        <SchemaOrg
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Ассоциация офтальмологических клиник",
            url: absoluteUrl("/"),
            potentialAction: {
              "@type": "SearchAction",
              target: `${absoluteUrl("/search")}?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }}
        />
      </div>
    </HomeMotionProvider>
  );
}
