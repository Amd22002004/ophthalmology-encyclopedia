import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  FileText,
  FlaskConical,
  Globe2,
  Handshake,
  Landmark,
  Mail,
  MapPin,
  Network,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Wrench,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { doctorFullName, type ClinicCardData, type DoctorDetail } from "@/lib/loaders";
import { associationAboutContent as content } from "@/lib/association-content";
import {
  AboutAnchorNav,
  AboutPageTracker,
  AboutTrackedLink,
} from "./about-interactions";

type AboutCounts = {
  diseases: number;
  procedures: number;
  doctors: number;
  clinics: number;
  suppliers: number;
  equipment: number;
  publications: number;
};

type AssociationAboutPageProps = {
  counts: AboutCounts | null;
  clinics: ClinicCardData[];
  doctor: DoctorDetail | null;
};

type AboutLeader = {
  name: string;
  role?: string;
  credential?: string;
  initials: string;
  profileSlug?: string;
  photoUrl?: string;
};

type AboutInfrastructureItem = {
  title: string;
  body: string;
  href: string;
  cta?: string;
};

const joinUrl = "/cooperation?utm_source=about&utm_medium=website&utm_campaign=association_membership";
const clinicJoinUrl = `${joinUrl}&utm_content=clinic`;
const doctorJoinUrl = `${joinUrl}&utm_content=doctor`;
const partnerJoinUrl = `${joinUrl}&utm_content=partner`;

const goalIcons = [Globe2, Network, FlaskConical, Handshake, Wrench, Landmark, BookOpen];
const infrastructureIcons = [BookOpen, Users, FlaskConical, Wrench, FileText];
const principleIcons = [ShieldCheck, FileText, CircleDashed, Sparkles, Network, Users];

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24 space-y-4" id={id}>
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function CheckList({ items, icon = CheckCircle2 }: { items: readonly string[]; icon?: typeof CheckCircle2 }) {
  const Icon = icon;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li className="flex items-start gap-3 text-sm leading-6 text-muted-foreground" key={item}>
          <Icon aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BenefitsGrid({ items, icon }: { items: readonly { title: string; body: string }[]; icon: typeof Users }) {
  const Icon = icon;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card className="h-full" key={item.title}>
          <CardHeader className="pb-2">
            <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
            <CardTitle className="pt-1 text-base leading-5">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InitialsPlaceholder({ initials }: { initials: string }) {
  return (
    <div
      aria-label={`Портрет ${initials} пока не добавлен`}
      className="flex aspect-[4/5] items-center justify-center rounded-lg border bg-muted/60 text-2xl font-semibold tracking-[0.18em] text-primary"
      role="img"
    >
      {initials}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <p className="text-2xl font-semibold tabular-nums text-primary">
        {value.toLocaleString("ru-RU")}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{label}</p>
    </div>
  );
}

export function AssociationAboutPage({ counts, clinics, doctor }: AssociationAboutPageProps) {
  const cities = [...new Set(clinics.map((clinic) => clinic.city).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b, "ru"),
  );
  const leaders = content.leaders as readonly AboutLeader[];
  const infrastructure = content.infrastructure as readonly AboutInfrastructureItem[];
  const doctorLeader = leaders.find((leader) => leader.profileSlug);
  const publicDoctorName = doctor ? doctorFullName(doctor) : doctorLeader?.name;
  const publicDoctorPhoto = doctor?.photoUrl || doctorLeader?.photoUrl;
  const publicDoctorSpecialties = doctor?.specialties.map((item) => item.specialty.title).slice(0, 3) ?? [];

  return (
    <div className="space-y-6 overflow-x-clip pb-8">
      <AboutPageTracker />
      <Breadcrumbs items={[{ label: "Об Ассоциации" }]} />

      <section className="relative overflow-hidden rounded-2xl border bg-card" id="about">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
          <div className="relative z-[1] flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {content.hero.eyebrow}
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {content.hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              {content.hero.description}
            </p>
            <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-foreground">
              {content.hero.accent}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <AboutTrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                event="about_join_clicked"
                href={joinUrl}
                section="hero"
                targetType="membership"
              >
                Стать участником
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </AboutTrackedLink>
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                href="#participants"
              >
                Посмотреть участников
              </a>
            </div>
            <a className="mt-5 inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline" href="#projects">
              Познакомиться с проектами <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <div className="relative min-h-[300px] overflow-hidden border-t bg-muted/20 lg:min-h-[440px] lg:border-l lg:border-t-0">
            <Image
              alt="Иллюстративное изображение профессиональной офтальмологической среды"
              className="object-cover"
              fill
              sizes="(max-width: 1023px) 100vw, 55vw"
              src="/images/association-home-hero.png"
            />
            <div aria-hidden="true" className="absolute right-6 top-6 h-16 w-16 rounded-full border border-primary/30 motion-safe:animate-pulse" />
          </div>
        </div>
      </section>

      <AboutAnchorNav items={content.nav} />

      <Section
        description="Ассоциация связывает профессиональные знания, специалистов, организации, исследования, технологии и нормативную информацию в единую отраслевую среду."
        eyebrow="Зачем создана Ассоциация"
        id="purpose"
        title={content.purpose.title}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.84fr)] lg:items-stretch">
          <Card>
            <CardContent className="space-y-4 p-5 sm:p-7">
              {content.purpose.paragraphs.map((paragraph) => (
                <p className="text-sm leading-7 text-muted-foreground" key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </CardContent>
          </Card>
          <div className="relative min-h-[260px] overflow-hidden rounded-xl border bg-muted/20">
            <Image
              alt="Иллюстративное изображение медицинского оборудования и профессиональных материалов"
              className="object-cover"
              fill
              sizes="(max-width: 1023px) 100vw, 40vw"
              src="/images/about-association-workspace.png"
            />
            <p className="absolute bottom-3 left-3 rounded-md bg-background/90 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
              Иллюстративный визуал
            </p>
          </div>
        </div>
      </Section>

      <Section id="mission" title="Миссия и цели">
        <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)]">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">
                {content.mission.title}
              </p>
              <p className="mt-5 text-xl font-semibold leading-8">{content.mission.body}</p>
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {content.goals.map((goal, index) => {
              const Icon = goalIcons[index];
              return (
                <Card className="h-full" key={goal.title}>
                  <CardContent className="p-5">
                    <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
                    <h3 className="mt-3 font-semibold">{goal.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{goal.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </Section>

      <Section
        description="Структура Ассоциации развивается вокруг существующих сущностей и разделов платформы, без создания дублирующих витрин."
        eyebrow="Что создаёт Ассоциация"
        id="projects"
        title="Профессиональная инфраструктура офтальмологии"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {infrastructure.map((item, index) => {
            const Icon = infrastructureIcons[index];
            const featured = index === 0;
            return (
              <Card className={featured ? "h-full border-primary/30 bg-primary/[0.04] sm:col-span-2 lg:col-span-2" : "h-full"} key={item.title}>
                <CardContent className="flex h-full flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                    {featured && <span className="text-xs font-semibold uppercase tracking-wide text-primary">Цифровой проект</span>}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{item.body}</p>
                  <div className="mt-auto pt-5">
                    <AboutTrackedLink
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      event="about_project_opened"
                      href={item.href}
                      section="projects"
                      targetType={item.title}
                    >
                      {item.cta || "Открыть раздел"}
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </AboutTrackedLink>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      <section className="scroll-mt-24 rounded-xl border bg-card p-5 sm:p-6" id="services">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Уже доступно</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{content.liveServices.title}</h2>
            <div className="mt-5">
              <CheckList items={content.liveServices.available} />
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Развивается</p>
            <ul className="mt-4 space-y-3">
              {content.liveServices.developing.map((item) => (
                <li className="flex items-start gap-3 text-sm leading-6 text-muted-foreground" key={item}>
                  <CircleDashed aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">
              Личные кабинеты и связанные сервисы будут называться доступными только после отдельного релиза и проверки.
            </p>
          </div>
        </div>
      </section>

      {counts && (
        <section className="scroll-mt-24 space-y-4" id="metrics">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Цифровая инфраструктура</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Данные профессиональных каталогов платформы</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Показатели загружаются тем же источником, что и на главной странице; число клиник не трактуется как число членов Ассоциации.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="заболеваний" value={counts.diseases} />
            <Stat label="процедур" value={counts.procedures} />
            <Stat label="врачей" value={counts.doctors} />
            <Stat label="клиник в каталоге" value={counts.clinics} />
            <Stat label="единиц оборудования" value={counts.equipment} />
            <Stat label="публикаций" value={counts.publications} />
          </div>
        </section>
      )}

      <Section
        description="Участие в профессиональном сообществе не заменяет собственный бренд клиники и не превращает организацию в часть другой медицинской сети."
        id="clinics"
        title="Для клиники — профессиональное присутствие и новые связи"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <Card className="h-fit bg-muted/30">
            <CardContent className="p-5 sm:p-6">
              <Building2 aria-hidden="true" className="h-7 w-7 text-primary" />
              <p className="mt-5 text-lg font-semibold leading-7">Профессиональное присутствие при сохранении собственного бренда</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Клиника сохраняет собственный бренд, руководство и клиническую самостоятельность.</p>
              <AboutTrackedLink
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                event="about_clinic_application_clicked"
                href={clinicJoinUrl}
                section="clinics"
                targetType="clinic"
              >
                Подать заявку от клиники
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </AboutTrackedLink>
            </CardContent>
          </Card>
          <BenefitsGrid icon={Building2} items={content.clinicBenefits} />
        </div>
      </Section>

      <Section
        description="Профессиональная деятельность врача включает клинический опыт, специализацию, научные интересы, публикации, профессиональные связи и вклад в развитие отрасли."
        id="doctors"
        title="Для врача — профессиональный профиль, научное портфолио и сообщество"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.28fr)_minmax(280px,0.72fr)]">
          <BenefitsGrid icon={Stethoscope} items={content.doctorBenefits} />
          <Card className="h-fit bg-primary/[0.04]">
            <CardContent className="p-5 sm:p-6">
              <Stethoscope aria-hidden="true" className="h-7 w-7 text-primary" />
              <p className="mt-5 text-lg font-semibold leading-7">Подать заявку специалиста</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Сведения рассматриваются отдельно; отправка заявки не означает автоматического вступления.</p>
              <AboutTrackedLink
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                event="about_doctor_application_clicked"
                href={doctorJoinUrl}
                section="doctors"
                targetType="doctor"
              >
                Подать заявку специалиста
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </AboutTrackedLink>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section
        description="Структурированный профессиональный профиль помогает представить проверяемые сведения о клинике, специалистах, направлениях работы и связанных материалах."
        id="principles"
        title="Принципы профессиональной работы"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {content.principles.map((principle, index) => {
            const Icon = principleIcons[index];
            return (
              <Card className="h-full" key={principle.title}>
                <CardContent className="p-5">
                  <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 font-semibold">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{principle.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section
        description="Публично показываются только подтверждённые роли и существующие профессиональные профили. Для отсутствующих портретов используются инициалы, а не вымышленные лица."
        id="people"
        title="Люди Ассоциации"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {leaders.map((leader) => {
            const isDoctor = leader.profileSlug === doctorLeader?.profileSlug;
            const photoUrl = isDoctor ? publicDoctorPhoto : undefined;
            return (
              <Card className="h-full overflow-hidden" key={leader.name}>
                <div className="relative bg-muted/30 p-3">
                  {photoUrl ? (
                    <Image
                      alt={`Портрет ${publicDoctorName ?? leader.name}`}
                      className="aspect-[4/5] rounded-lg object-cover"
                      height={560}
                      unoptimized
                      src={photoUrl}
                      width={448}
                    />
                  ) : (
                    <InitialsPlaceholder initials={leader.initials} />
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold leading-6">{leader.name}</h3>
                  {leader.role && <p className="mt-2 text-sm leading-5 text-primary">{leader.role}</p>}
                  {leader.credential && <p className="mt-2 text-sm leading-5 text-muted-foreground">{leader.credential}</p>}
                  {isDoctor && publicDoctorSpecialties.length > 0 && (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Направления профиля: {publicDoctorSpecialties.join(", ")}
                    </p>
                  )}
                  {leader.profileSlug && (
                    <AboutTrackedLink
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      event="about_participant_profile_opened"
                      href={`/doctors/${leader.profileSlug}`}
                      participantId={leader.profileSlug}
                      section="people"
                      targetType="doctor"
                    >
                      Открыть профиль <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </AboutTrackedLink>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Card className="border-primary/20 bg-primary/[0.04]">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Основной контакт Ассоциации: <a className="font-semibold text-primary hover:underline" href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a>.</p>
            <AboutTrackedLink
              className="inline-flex min-h-10 shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline"
              event="about_contact_clicked"
              href={`mailto:${content.contactEmail}`}
              section="people"
              targetType="email"
            >
              <Mail aria-hidden="true" className="h-4 w-4" /> Написать
            </AboutTrackedLink>
          </CardContent>
        </Card>
      </Section>

      <Section
        description="Каталог клиник и официальный список участников — разные понятия. В этой версии страницы отображаются только организации, представленные в информационном каталоге платформы."
        eyebrow="Источник данных: активный каталог клиник"
        id="participants"
        title="География профессионального сообщества"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.68fr)_minmax(0,1.32fr)]">
          <Card className="h-fit bg-muted/30">
            <CardContent className="p-5 sm:p-6">
              <MapPin aria-hidden="true" className="h-7 w-7 text-primary" />
              <h3 className="mt-5 text-lg font-semibold">Города, представленные в каталоге</h3>
              {cities.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {cities.map((city) => (
                    <span className="rounded-md border bg-background px-2.5 py-1.5 text-sm" key={city}>{city}</span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">Список городов появится после доступности данных каталога.</p>
              )}
              <p className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">Это не утверждение о членстве в Ассоциации и не рейтинг организаций.</p>
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {clinics.slice(0, 12).map((clinic) => (
              <Card className="h-full" key={clinic.slug}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Building2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-5">{clinic.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{[clinic.city, clinic.region].filter(Boolean).join(" · ") || "Регион уточняется"}</p>
                      <AboutTrackedLink
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        event="about_participant_profile_opened"
                        href={`/clinics/${clinic.slug}`}
                        participantId={clinic.slug}
                        section="participants"
                        targetType="clinic"
                      >
                        Профиль клиники <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </AboutTrackedLink>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {clinics.length === 0 && (
              <Card className="sm:col-span-2">
                <CardContent className="p-6 text-sm leading-6 text-muted-foreground">Публичные карточки клиник будут показаны после загрузки данных активного каталога.</CardContent>
              </Card>
            )}
          </div>
        </div>
      </Section>

      <Section id="editions" title={content.publications.title}>
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
            <FileText aria-hidden="true" className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">Редакционный каталог готовится</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{content.publications.empty}</p>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section id="events" title={content.events.title}>
        <Card className="bg-muted/30">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <CalendarDays aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="text-sm leading-6 text-muted-foreground">{content.events.body}</p>
                {!content.events.available && <p className="mt-2 text-xs leading-5 text-muted-foreground">Раздел мероприятий готовится; ссылка не публикуется до появления канонического маршрута.</p>}
              </div>
            </div>
            {content.events.available && (
              <AboutTrackedLink
                className="inline-flex min-h-10 shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline"
                event="about_event_opened"
                href="/events"
                section="events"
                targetType="events"
              >
                Посмотреть мероприятия <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </AboutTrackedLink>
            )}
          </CardContent>
        </Card>
      </Section>

      <Section id="join" title="Как стать участником">
        <div className="grid gap-3 md:grid-cols-5">
          {content.joinSteps.map((step, index) => (
            <Card className="relative h-full" key={step.title}>
              <CardContent className="p-5">
                <p className="text-2xl font-semibold text-primary">{index + 1}</p>
                <h3 className="mt-4 font-semibold leading-5">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-primary/20 bg-primary/[0.04]">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="max-w-3xl text-sm font-medium leading-6 text-foreground">Отправка заявки не означает автоматического вступления в Ассоциацию. После рассмотрения одобренному пользователю может быть направлено персональное приглашение для дальнейшего оформления профессионального профиля.</p>
            <AboutTrackedLink
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              event="about_join_clicked"
              href={joinUrl}
              section="join"
              targetType="membership"
            >
              Перейти к подаче заявки <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </AboutTrackedLink>
          </CardContent>
        </Card>
      </Section>

      <section className="scroll-mt-24 overflow-hidden rounded-2xl border bg-primary p-6 text-primary-foreground sm:p-8" id="final-cta">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">Профессиональное взаимодействие</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Развиваем офтальмологию вместе</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/80">Ассоциация открыта для клиник, врачей, исследователей, экспертов и профессиональных партнёров, готовых участвовать в развитии отрасли.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AboutTrackedLink
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/60"
              event="about_join_clicked"
              href={joinUrl}
              section="final-cta"
              targetType="membership"
            >
              Стать участником
            </AboutTrackedLink>
            <AboutTrackedLink
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary-foreground/40 px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60"
              event="about_partner_application_clicked"
              href={partnerJoinUrl}
              section="final-cta"
              targetType="partner"
            >
              Предложить сотрудничество
            </AboutTrackedLink>
            <AboutTrackedLink
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary-foreground/40 px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60"
              event="about_contact_clicked"
              href={`mailto:${content.contactEmail}`}
              section="final-cta"
              targetType="email"
            >
              <Mail aria-hidden="true" className="h-4 w-4" /> Связаться
            </AboutTrackedLink>
          </div>
        </div>
      </section>
    </div>
  );
}
