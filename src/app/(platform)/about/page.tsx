import Image from "next/image";
import {
  Building2,
  CheckCircle2,
  FlaskConical,
  Globe,
  Heart,
  MapPin,
  Megaphone,
  Network,
  Package,
  Star,
  Users,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SchemaOrg } from "@/components/seo/schema-org";
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Об ассоциации",
  description:
    "Ассоциация офтальмологических клиник — профессиональное объединение клиник, врачей и партнёров в области офтальмологии в регионах Урала, Западной Сибири и Арктической зоны России.",
  path: "/about",
});

const mission = [
  "Развитие офтальмологии как медицинской дисциплины",
  "Повышение качества и доступности медицинской помощи",
  "Обмен клиническим опытом между участниками",
  "Поддержка врачей и научных инициатив",
  "Развитие отраслевого сотрудничества с производителями и поставщиками",
];

const unites = [
  {
    icon: Building2,
    title: "Клиники",
    body: "Офтальмологические центры, специализированные кабинеты и учреждения, работающие по единым профессиональным стандартам.",
  },
  {
    icon: Users,
    title: "Врачи",
    body: "Специалисты в области хирургии, диагностики и консервативного лечения органа зрения — офтальмологи, хирурги, ретинологи.",
  },
  {
    icon: FlaskConical,
    title: "Научные и образовательные инициативы",
    body: "Клинические исследования, профессиональные публикации, учебные программы и методические разработки.",
  },
  {
    icon: Package,
    title: "Поставщики и технологические партнёры",
    body: "Производители оборудования, расходных материалов и программных решений для офтальмологии.",
  },
];

const cities = [
  { city: "Тюмень", region: "Тюменская область" },
  { city: "Курган", region: "Курганская область" },
  { city: "Сургут", region: "ХМАО — Югра" },
  { city: "Нижневартовск", region: "ХМАО — Югра" },
  { city: "Ноябрьск", region: "ЯНАО" },
  { city: "Салехард", region: "ЯНАО" },
  { city: "Екатеринбург", region: "Свердловская область" },
  { city: "Шадринск", region: "Курганская область" },
  { city: "Ишим", region: "Тюменская область" },
  { city: "Тобольск", region: "Тюменская область" },
];

const benefits = [
  {
    icon: Star,
    title: "Единый профессиональный бренд",
    body: "Участие в ассоциации подчёркивает принадлежность к профессиональному сообществу с общими стандартами качества.",
  },
  {
    icon: Eye,
    title: "Видимость в отраслевом каталоге",
    body: "Профиль клиники, её специалистов и услуг представлен в профессиональном справочнике по офтальмологии.",
  },
  {
    icon: Network,
    title: "Профессиональные связи",
    body: "Прямые контакты между клиниками, врачами и партнёрами для консультаций, направлений и совместной работы.",
  },
  {
    icon: Heart,
    title: "Доверие пациентов",
    body: "Ассоциированный статус помогает пациентам ориентироваться при выборе клиники и врача.",
  },
  {
    icon: Megaphone,
    title: "Информационная поддержка",
    body: "Включение в профессиональные публикации, анонсы мероприятий и новости отрасли.",
  },
  {
    icon: Globe,
    title: "Участие в сообществе",
    body: "Доступ к совместным образовательным программам, профессиональным мероприятиям и отраслевым дискуссиям.",
  },
];

const membersVizus1 = [
  { name: "Центр микрохирургии глаза «Визус-1»", city: "Тюмень" },
  { name: "Офтальмологический центр «Визус-1»", city: "Тюмень" },
  { name: "«Визус-1» (ОМС)", city: "Тюмень" },
  { name: "Центр микрохирургии глаза «Визус-1»", city: "Курган" },
  { name: "Офтальмологический центр «Визус-1»", city: "Сургут" },
  { name: "Центр микрохирургии глаза «Визус-1»", city: "Нижневартовск" },
  { name: "Офтальмологический кабинет «Визус-1»", city: "Шадринск" },
  { name: "Офтальмологический кабинет «Визус-1»", city: "Ишим" },
  { name: "Офтальмологический кабинет «Визус-1»", city: "Тобольск" },
];

const membersIndependent = [
  { name: "МНТК микрохирургии глаза им. Фёдорова", city: "Екатеринбург" },
  { name: "ООО «Север»", city: "Салехард" },
  { name: "Прозрение-Север", city: "Ноябрьск" },
  { name: "Полярный круг", city: "Ноябрьск" },
];

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Об ассоциации" }]} />

      {/* Hero */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="h-1 bg-primary" />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8">
          <div className="shrink-0">
            <Image
              src="/association-logo.png"
              alt="Ассоциация офтальмологических клиник"
              width={96}
              height={96}
              className="rounded-lg"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Профессиональное объединение
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Ассоциация офтальмологических клиник
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Профессиональное объединение офтальмологических клиник, врачей-специалистов
              и медицинских партнёров, работающих в нескольких регионах России.
              Участники ассоциации разделяют общие стандарты качества медицинской
              помощи и профессиональные ценности.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Ассоциация создаёт среду, в которой клиники, врачи и исследователи
              могут обмениваться опытом, развивать профессиональные связи и совместно
              повышать доступность офтальмологической помощи.
            </p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <section className="space-y-3">
        <h2 className="px-1 text-lg font-semibold">Миссия</h2>
        <Card>
          <CardContent className="pt-5">
            <ul className="space-y-3">
              {mission.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* What we unite */}
      <section className="space-y-3">
        <h2 className="px-1 text-lg font-semibold">Что объединяет ассоциация</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {unites.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <CardTitle>{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Geography */}
      <section className="space-y-3">
        <h2 className="px-1 text-lg font-semibold">География</h2>
        <Card>
          <CardContent className="pt-5">
            <p className="mb-4 text-sm text-muted-foreground">
              Участники ассоциации представлены в городах Урала, Западной Сибири
              и Арктической зоны России.
            </p>
            <div className="flex flex-wrap gap-2">
              {cities.map(({ city, region }) => (
                <div
                  key={city}
                  className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1.5"
                >
                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">{city}</span>
                  <span className="text-xs text-muted-foreground">— {region}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Benefits */}
      <section className="space-y-3">
        <h2 className="px-1 text-lg font-semibold">Преимущества участия</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <CardTitle className="text-sm">{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-5 text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Members */}
      <section className="space-y-3">
        <h2 className="px-1 text-lg font-semibold">Участники</h2>
        <Card>
          <CardContent className="pt-5">
            <div className="space-y-5">
              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Сеть «Визус-1»
                </p>
                <ul className="space-y-2">
                  {membersVizus1.map((m) => (
                    <li
                      key={`${m.city}-${m.name}`}
                      className="flex items-baseline gap-2 text-sm"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="font-medium text-foreground">{m.city}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="text-muted-foreground">{m.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Независимые участники
                </p>
                <ul className="space-y-2">
                  {membersIndependent.map((m) => (
                    <li
                      key={`${m.city}-${m.name}`}
                      className="flex items-baseline gap-2 text-sm"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="font-medium text-foreground">{m.city}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="text-muted-foreground">{m.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/about", label: "Об ассоциации" },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Ассоциация офтальмологических клиник",
          description:
            "Профессиональное объединение офтальмологических клиник, врачей и партнёров в регионах России.",
          url: absoluteUrl("/about"),
        }}
      />
    </div>
  );
}
