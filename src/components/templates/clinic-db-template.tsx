import {
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClinicLogo, getClinicInitial } from "@/components/entity/clinic-logo";
import { EntityBlock } from "@/components/entity/entity-block";
import { RelatedBlock } from "@/components/entity/related-block";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SchemaOrg } from "@/components/seo/schema-org";
import type { ClinicDbDetail } from "@/lib/loaders";
import { breadcrumbJsonLd, clinicJsonLd, faqPageJsonLd } from "@/lib/seo";

const CLINIC_TYPE_LABEL: Record<string, string> = {
  centre: "Центр",
  cabinet: "Кабинет",
  mntk: "МНТК",
  clinic: "Клиника",
  oms: "ОМС-точка",
};

const BADGE_STYLE = {
  oms:  { background: "#e7f4ec", color: "#137a4c" },
  net:  { background: "#e9f0fb", color: "#1f5fae" },
  type: { background: "#eef1f5", color: "#475569" },
};

/** «Куницкий К. В.» — фамилия + инициалы имени и отчества */
function doctorInitialsName(d: {
  firstName: string;
  lastName: string;
  middleName?: string | null;
}) {
  const initials = [d.firstName, d.middleName]
    .filter(Boolean)
    .map((part) => `${(part as string).charAt(0)}.`)
    .join(" ");
  return initials ? `${d.lastName} ${initials}` : d.lastName;
}

/** «КК» — инициалы для аватара-заглушки при отсутствии фото */
function doctorAvatarInitials(d: { firstName: string; lastName: string }) {
  return `${d.lastName.charAt(0)}${d.firstName.charAt(0)}`.toUpperCase();
}

function formatLicenseDate(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function mapHref(data: ClinicDbDetail) {
  if (data.latitude != null && data.longitude != null) {
    return `https://yandex.ru/maps/?pt=${data.longitude},${data.latitude}&z=16&l=map`;
  }
  if (data.address) {
    return `https://yandex.ru/maps/?text=${encodeURIComponent(data.address)}`;
  }
  return null;
}

function buildFaqItems(data: ClinicDbDetail): { question: string; answer: string }[] {
  const items: { question: string; answer: string }[] = [
    {
      question: `Принимает ли клиника «${data.title}» пациентов по полису ОМС?`,
      answer: data.omsEnabled
        ? "Да, клиника оказывает офтальмологическую помощь по полису ОМС."
        : "Клиника работает на платной основе, приём по полису ОМС не осуществляется.",
    },
  ];

  if (data.workingHours) {
    items.push({
      question: `Какой график работы клиники «${data.title}»?`,
      answer: data.workingHours,
    });
  }

  if (data.address) {
    items.push({
      question: `Где находится клиника «${data.title}»?`,
      answer: `Клиника расположена по адресу: ${data.address}.`,
    });
  }

  if (data.appointmentUrl || data.phones.length > 0) {
    const ways = [
      data.appointmentUrl ? `онлайн через форму записи (${data.appointmentUrl})` : null,
      data.phones.length > 0 ? `по телефону ${data.phones[0]}` : null,
    ].filter((w): w is string => Boolean(w));
    items.push({
      question: `Как записаться на приём в клинику «${data.title}»?`,
      answer: `Записаться можно ${ways.join(" или ")}.`,
    });
  }

  return items;
}

export function ClinicDbTemplate({ data }: { data: ClinicDbDetail }) {
  const cityRegion = [data.city, data.region].filter(Boolean).join(" · ");
  const headerAddress = data.address ? `${cityRegion} — ${data.address}` : cityRegion;

  const badges = [
    data.omsEnabled ? { label: "ОМС", variant: "oms" as const } : null,
    data.networkName ? { label: data.networkName, variant: "net" as const } : null,
    data.clinicType && CLINIC_TYPE_LABEL[data.clinicType]
      ? { label: CLINIC_TYPE_LABEL[data.clinicType], variant: "type" as const }
      : null,
  ].filter((x): x is { label: string; variant: keyof typeof BADGE_STYLE } => x !== null);

  const initial = getClinicInitial(data.networkName ?? undefined, data.title);

  const procedures = data.procedures.map((r) => ({
    href: `/procedures/${r.procedure.slug}`,
    title: r.procedure.title,
    meta: r.procedure.summary ?? undefined,
  }));

  const diseases = data.diseases.map((r) => ({
    href: `/diseases/${r.disease.slug}`,
    title: r.disease.title,
    meta: r.disease.summary ?? undefined,
  }));

  const publications = data.publications.map((r) => ({
    href: `/publications/${r.publication.slug}`,
    title: r.publication.title,
    meta: r.publication.abstract ?? undefined,
  }));

  const map = mapHref(data);
  const licenseDateLabel = formatLicenseDate(data.licenseDate);
  const faqItems = buildFaqItems(data);

  const hasRequisites = Boolean(
    data.inn ||
      data.kpp ||
      data.ogrn ||
      data.license ||
      licenseDateLabel ||
      data.directorName ||
      data.foundedYear,
  );

  const hasCta = data.phones.length > 0 || !!data.website || !!data.email || !!data.appointmentUrl;

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ href: "/clinics", label: "Клиники" }, { label: data.title }]} />

      {/* Header: identity left + CTA right */}
      <header className="overflow-hidden rounded-lg border bg-card">
        {data.coverImageUrl && (
          <div className="h-48 w-full overflow-hidden bg-muted sm:h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={data.title}
              className="h-full w-full object-cover"
              src={data.coverImageUrl}
            />
          </div>
        )}

        <div className="grid gap-5 p-5 sm:items-start sm:grid-cols-[1fr_280px]">
          {/* Identity */}
          <div className="flex gap-4 items-start">
            <ClinicLogo alt={data.title} initial={initial} logo={data.logoUrl ?? undefined} size="lg" />
            <div className="min-w-0 flex-1">
              {badges.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {badges.map((b) => (
                    <span
                      key={b.label}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-bold leading-snug whitespace-nowrap"
                      style={BADGE_STYLE[b.variant]}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{data.title}</h1>
              {data.legalName && data.legalName !== data.title && (
                <p className="mt-1 text-sm text-muted-foreground">{data.legalName}</p>
              )}
              {headerAddress && (
                <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{headerAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          {hasCta && (
            <div className="rounded-lg border bg-background p-4 shadow-sm flex flex-col gap-3">
              {data.phones[0] && (
                <a
                  className="text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors"
                  href={`tel:${data.phones[0].replace(/\s/g, "")}`}
                >
                  {data.phones[0]}
                </a>
              )}
              {(data.appointmentUrl || data.phones.length > 0) && (
                <Button asChild>
                  <a
                    href={data.appointmentUrl || `tel:${data.phones[0]?.replace(/\s/g, "")}`}
                    rel={data.appointmentUrl ? "noopener noreferrer" : undefined}
                    target={data.appointmentUrl ? "_blank" : undefined}
                  >
                    Записаться
                  </a>
                </Button>
              )}
              {data.website && (
                <a
                  className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                  href={data.website}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Globe className="h-4 w-4 shrink-0" />
                  {data.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {data.email && (
                <a
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary break-all"
                  href={`mailto:${data.email}`}
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {data.email}
                </a>
              )}
              {(data.vkUrl || data.telegramUrl || data.youtubeUrl) && (
                <div className="flex flex-wrap gap-3 pt-1 text-sm">
                  {data.vkUrl && (
                    <a className="text-primary hover:underline" href={data.vkUrl} rel="noopener noreferrer" target="_blank">
                      VKontakte
                    </a>
                  )}
                  {data.telegramUrl && (
                    <a className="text-primary hover:underline" href={data.telegramUrl} rel="noopener noreferrer" target="_blank">
                      Telegram
                    </a>
                  )}
                  {data.youtubeUrl && (
                    <a className="text-primary hover:underline" href={data.youtubeUrl} rel="noopener noreferrer" target="_blank">
                      YouTube
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {data.facadeImageUrl && (
          <div className="border-t px-5 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Фасад здания
            </p>
            <div className="h-40 w-full max-w-md overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`Фасад клиники «${data.title}»`}
                className="h-full w-full object-cover"
                src={data.facadeImageUrl}
              />
            </div>
          </div>
        )}
      </header>

      {/* Body: main + sidebar */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main */}
        <div className="space-y-5">
          {data.specializationTags && data.specializationTags.length > 0 && (
            <EntityBlock title="Специализации">
              <div className="flex flex-wrap gap-2">
                {data.specializationTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm rounded-md px-3 py-1"
                    style={{ background: "#e6f4f5", color: "#0a5d65" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </EntityBlock>
          )}

          {data.description && (
            <EntityBlock title="О клинике">
              <p className="whitespace-pre-line text-foreground">{data.description}</p>
            </EntityBlock>
          )}

          {/* Doctors */}
          {data.doctors.length > 0 && (
            <EntityBlock title={`Врачи клиники · ${data.doctors.length}`}>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.doctors.slice(0, 4).map((r) => {
                  const role = r.doctor.position ?? r.doctor.category;
                  return (
                    <a
                      key={r.doctor.slug}
                      href={`/doctors/${r.doctor.slug}`}
                      className="group flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
                    >
                      {/* Avatar */}
                      <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                        {r.doctor.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={doctorInitialsName(r.doctor)}
                            src={r.doctor.photoUrl}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-primary">
                            {doctorAvatarInitials(r.doctor)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug truncate">
                          {doctorInitialsName(r.doctor)}
                        </p>
                        {role && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {role}
                          </p>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
              {data.doctors.length > 4 && (
                <Link
                  href="/doctors"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Показать всех {data.doctors.length} врачей →
                </Link>
              )}
            </EntityBlock>
          )}

          {/* Оборудование клиники: Clinic → Equipment */}
          {data.equipment.length > 0 && (
            <EntityBlock title={`Оборудование клиники · ${data.equipment.length}`}>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.equipment.map((r) => (
                  <div
                    className="flex items-center gap-3 rounded-lg border bg-background p-3"
                    key={r.equipment.slug}
                  >
                    {r.equipment.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={r.equipment.title}
                        className="h-14 w-20 shrink-0 rounded-md border object-cover"
                        decoding="async"
                        loading="lazy"
                        src={r.equipment.images[0]}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-foreground">
                        {r.equipment.title}
                      </p>
                      {(r.equipment.manufacturer || r.equipment.country) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[r.equipment.manufacturer, r.equipment.country]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      <Link
                        className="mt-1 inline-flex text-xs font-semibold text-primary hover:text-primary/80"
                        href={`/equipment/${r.equipment.slug}`}
                      >
                        Подробнее →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </EntityBlock>
          )}

          {procedures.length > 0 && <RelatedBlock empty="" items={procedures} title="Процедуры" />}
          {diseases.length > 0 && <RelatedBlock empty="" items={diseases} title="Заболевания" />}
          {publications.length > 0 && <RelatedBlock empty="" items={publications} title="Публикации" />}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {(data.address || map) && (
            <EntityBlock title="Адрес и карта">
              <div className="space-y-3">
                {data.address && <p className="text-sm text-foreground">{data.address}</p>}
                {data.mapEmbed ? (
                  <div className="overflow-hidden rounded-md border">
                    <iframe
                      className="h-72 w-full"
                      loading="lazy"
                      src={data.mapEmbed}
                      title={`Карта проезда — ${data.title}`}
                    />
                  </div>
                ) : (
                  map && (
                    <Button asChild variant="outline">
                      <a href={map} rel="noopener noreferrer" target="_blank">
                        <MapPin className="h-4 w-4" />
                        Показать на карте
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )
                )}
              </div>
            </EntityBlock>
          )}

          {data.workingHours && (
            <EntityBlock title="Режим работы">
              <div className="flex gap-2 text-sm text-foreground">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="whitespace-pre-line">{data.workingHours}</p>
              </div>
            </EntityBlock>
          )}

          {hasRequisites && (
            <EntityBlock title="Реквизиты и лицензия">
              <dl className="grid gap-x-6 gap-y-2 text-sm">
                {data.inn && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">ИНН:</dt>
                    <dd className="font-mono text-foreground">{data.inn}</dd>
                  </div>
                )}
                {data.kpp && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">КПП:</dt>
                    <dd className="font-mono text-foreground">{data.kpp}</dd>
                  </div>
                )}
                {data.ogrn && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">ОГРН:</dt>
                    <dd className="font-mono text-foreground">{data.ogrn}</dd>
                  </div>
                )}
                {data.license && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">Лицензия:</dt>
                    <dd className="text-foreground">{data.license}</dd>
                  </div>
                )}
                {licenseDateLabel && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">Дата:</dt>
                    <dd className="text-foreground">{licenseDateLabel}</dd>
                  </div>
                )}
                {data.directorName && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">Руководитель:</dt>
                    <dd className="text-foreground">{data.directorName}</dd>
                  </div>
                )}
                {data.foundedYear && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">Основана:</dt>
                    <dd className="text-foreground">{data.foundedYear}</dd>
                  </div>
                )}
              </dl>
            </EntityBlock>
          )}
        </div>
      </div>

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/clinics", label: "Клиники" },
          { href: `/clinics/${data.slug}`, label: data.title },
        ])}
      />
      <SchemaOrg data={clinicJsonLd(data)} />
      {faqItems.length > 0 && <SchemaOrg data={faqPageJsonLd(faqItems)} />}
    </div>
  );
}
