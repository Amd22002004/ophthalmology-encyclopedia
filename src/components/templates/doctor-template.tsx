import { BookOpen, Check, ExternalLink, FileText, GraduationCap, Lightbulb, UserRound } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SchemaOrg } from "@/components/seo/schema-org";
import type { DoctorDetail } from "@/lib/loaders";
import { doctorFullName } from "@/lib/loaders";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

// Дизайн-токены из audit/Дизайн врача - Евдокимов.html (секция 3)
const CARD =
  "rounded-[13px] border border-[#d8e3e1] bg-card p-[17px_18px] shadow-[0_1px_2px_rgba(15,33,31,0.04),0_4px_14px_rgba(15,33,31,0.05)]";

function pluralYears(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "год";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "года";
  return "лет";
}

/** «Фамилия И. О.» для хлебных крошек и компактных подписей */
function doctorShortName(d: {
  firstName: string;
  lastName: string;
  middleName?: string | null;
}): string {
  const initials = [d.firstName, d.middleName]
    .filter(Boolean)
    .map((part) => `${(part as string).charAt(0)}.`)
    .join(" ");
  return initials ? `${d.lastName} ${initials}` : d.lastName;
}

function Section({
  title,
  children,
  annotation,
}: {
  title: string;
  children: React.ReactNode;
  annotation?: string;
}) {
  return (
    <section className={CARD}>
      <h3 className="mb-[13px] text-[14.5px] font-bold text-foreground">{title}</h3>
      {children}
      {annotation && (
        <p className="mt-[10px] text-[12.5px] text-muted-foreground">{annotation}</p>
      )}
    </section>
  );
}

/** Пилюля-ссылка в энциклопедию: фон #e6f4f5, текст #0a5d65, стрелка ↗ */
function EncyclopediaPill({ href, title }: { href: string; title: string }) {
  return (
    <Link
      className="inline-flex items-center gap-1 rounded-[7px] px-[9px] py-[3px] text-[12px] font-medium transition-opacity hover:opacity-80"
      href={href}
      style={{ background: "#e6f4f5", color: "#0a5d65" }}
    >
      {title} <span aria-hidden>↗</span>
    </Link>
  );
}

/* ── Научная деятельность: вспомогательные компоненты ── */

/** Labeled-поле в информационном блоке (label сверху, value снизу). */
function InfoField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
function NoveltyCard({ text }: { text: string }) {
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
function PracticalCard({ text }: { text: string }) {
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

/** Карточка документа PDF (автореферат / диссертация / любой тип). */
function DocCard({ href, title, description }: { href: string; title: string; description?: string }) {
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
          <span className="mt-[2px] block text-[11.5px] text-muted-foreground">
            {description}
          </span>
        )}
        <span className="mt-[4px] inline-flex items-center gap-[4px] text-[12px] font-medium text-primary/80 transition-colors group-hover:text-primary">
          Посмотреть
          <ExternalLink className="h-[11px] w-[11px] transition-transform duration-200 group-hover:translate-x-[2px]" />
        </span>
      </span>
    </a>
  );
}

/**
 * Разбивает summary на абзацы по ~2 предложения для удобочитаемости.
 * Предложения разделяются по точке + пробел + заглавная буква.
 */
function splitIntoParagraphs(text: string): string[] {
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



/**
 * Парсит строку supervisor: "ФИО, степень, звание" → {name, titles[]}
 */
function parseSupervisor(raw: string): { name: string; titles: string[] } {
  const parts = raw.split(",").map((s) => s.trim());
  return { name: parts[0], titles: parts.slice(1) };
}

/**
 * Разделяет organization на строки по ";".
 * Последнюю часть в скобках (город) выделяет отдельно.
 */
function parseOrganization(raw: string): { lines: string[]; city: string | null } {
  const cityMatch = raw.match(/\(([^)]+)\)\s*$/);
  const city = cityMatch ? cityMatch[1] : null;
  const clean = city ? raw.replace(/\s*\([^)]+\)\s*$/, "") : raw;
  const lines = clean.split(";").map((s) => s.trim()).filter(Boolean);
  return { lines, city };
}

export function DoctorTemplate({ data }: { data: DoctorDetail }) {
  const fullName = doctorFullName(data);
  const shortName = doctorShortName(data);
  const specialtiesLine = data.specialties.map((s) => s.specialty.title).join(" · ");
  const networkName = data.clinics.find((r) => r.clinic.networkName)?.clinic.networkName;

  const diseases = data.diseases.map((r) => ({
    href: `/diseases/${r.disease.slug}`,
    title: r.disease.title,
  }));
  const procedures = data.procedures.map((r) => ({
    href: `/procedures/${r.procedure.slug}`,
    title: r.procedure.title,
  }));
  const publications = data.publications.map((r) => ({
    href: `/publications/${r.slug}`,
    title: r.title,
    year: r.publishedAt ? String(new Date(r.publishedAt).getFullYear()) : null,
  }));
  // Резервируем места под оба типа, чтобы процедуры не вытеснялись заболеваниями
  const relatedPages = [...diseases.slice(0, 4), ...procedures.slice(0, 2)];
  if (relatedPages.length < 6) {
    const used = new Set(relatedPages.map((p) => p.href));
    for (const p of [...diseases, ...procedures]) {
      if (relatedPages.length >= 6) break;
      if (!used.has(p.href)) relatedPages.push(p);
    }
  }
  const appointmentUrl = data.prodoctorovUrl ?? data.siteUrl;

  const hasMainContent =
    Boolean(data.bio || data.credo || data.career) ||
    diseases.length > 0 ||
    procedures.length > 0 ||
    publications.length > 0;
  const hasGraph =
    data.clinics.length > 0 ||
    diseases.length > 0 ||
    procedures.length > 0 ||
    publications.length > 0;
  const hasSidebar = data.clinics.length > 0 || relatedPages.length > 0;

  return (
    <>
      <Breadcrumbs
        items={[{ href: "/doctors", label: "Врачи и специалисты" }, { label: shortName }]}
      />

      <div className="mt-5 space-y-4">
        {/* ── HEADER ── */}
        <header className={CARD}>
          <div className="grid gap-[18px] sm:grid-cols-[118px_minmax(0,1fr)] lg:grid-cols-[118px_minmax(0,1fr)_auto] items-start">
            {/* Photo 118×150, r=11 */}
            <div className="h-[150px] w-[118px] shrink-0 overflow-hidden rounded-[11px] bg-muted">
              {data.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={fullName}
                  className="h-full w-full object-cover"
                  src={data.photoUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <UserRound className="h-12 w-12 text-primary/30" />
                </div>
              )}
            </div>

            {/* Name / specialties / position / стаж */}
            <div className="min-w-0">
              {networkName && (
                <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-primary">
                  Сеть «{networkName}»
                </p>
              )}
              <h1 className="mt-1 text-[23px] font-bold leading-tight tracking-[-0.02em] text-foreground">
                {fullName}
              </h1>
              {specialtiesLine && (
                <p className="mt-1 text-[12.5px] font-semibold" style={{ color: "#0a5d65" }}>
                  {specialtiesLine}
                </p>
              )}
              {data.position && (
                <p className="mt-1.5 text-[13px] text-muted-foreground">{data.position}</p>
              )}
              {data.experienceYears != null && (
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Стаж {data.experienceYears} {pluralYears(data.experienceYears)}
                </p>
              )}
            </div>

            {/* CTA column */}
            {appointmentUrl && (
              <div className="flex flex-col items-start gap-2 lg:items-end">
                {data.prodoctorovUrl && (
                  <a
                    className="text-[12.5px] text-muted-foreground transition-colors hover:text-primary"
                    href={data.prodoctorovUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span style={{ color: "#e0a92e" }}>★</span> ПроДокторов ↗
                  </a>
                )}
                <a
                  className="inline-flex items-center rounded-[10px] bg-primary px-[15px] py-[9px] text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  href={appointmentUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Записаться на приём
                </a>
              </div>
            )}
          </div>
        </header>

        {/* ── CONTENT: main + sidebar ── */}
        <div
          className={`grid items-start gap-4 ${
            hasSidebar ? "lg:grid-cols-[minmax(0,1fr)_300px]" : ""
          }`}
        >
          <main className="space-y-4">
            {/* Экспертиза */}
            {(data.bio || data.credo) && (
              <Section title="Экспертиза">
                {data.bio && (
                  <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-foreground/80">
                    {data.bio}
                  </p>
                )}
                {data.credo && (
                  <p className="mt-2 text-[13px] italic" style={{ color: "#0a5d65" }}>
                    {data.credo.startsWith("«") ? data.credo : `«${data.credo}»`}
                  </p>
                )}
              </Section>
            )}

            {/* Научная деятельность: Doctor → ScientificWork.
                Только структурированные данные; полный текст работы не хранится —
                оригиналы отдаются PDF-файлами. Пустые разделы не рендерятся. */}
            {data.scientificWorks.length > 0 && (
              <section className="overflow-hidden rounded-[13px] border border-[#d8e3e1] bg-card shadow-[0_1px_2px_rgba(15,33,31,0.04),0_4px_14px_rgba(15,33,31,0.05)]">
                {/* Gradient top accent */}
                <div className="h-[3px] bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

                <div className="p-[20px_18px]">
                  {data.scientificWorks.map((w) => {
                    const supervisor = w.supervisor ? parseSupervisor(w.supervisor) : null;
                    const org = w.organization ? parseOrganization(w.organization) : null;
                    const summaryParagraphs = w.summary ? splitIntoParagraphs(w.summary) : [];



                    return (
                      <article className="space-y-[20px]" key={w.id}>
                        {/* ── Бейдж + заголовок ── */}
                        <header>
                          <span className="inline-flex items-center gap-[6px] rounded-[7px] bg-primary/10 px-[10px] py-[4px] text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                            <GraduationCap className="h-[14px] w-[14px]" /> Научная деятельность
                          </span>
                          <h4 className="mt-[10px]">
                            <span className="block text-[17px] font-bold leading-snug tracking-[-0.01em] text-foreground">
                              {w.type}
                            </span>
                          </h4>
                        </header>

                        {/* ── Информационный блок ── */}
                        <div className="grid gap-[16px] rounded-[11px] border border-[#e8efed] bg-[#fafcfb] p-[16px] sm:grid-cols-2">
                          {/* Автор */}
                          <InfoField label="Автор">
                            <p className="font-semibold">{fullName}</p>
                            {w.degree && (
                              <p className="text-[12.5px] text-muted-foreground">{w.degree}</p>
                            )}
                          </InfoField>

                          {/* Тема исследования */}
                          <InfoField label="Тема исследования">
                            <p className="font-semibold">«{w.title}»</p>
                          </InfoField>

                          {/* Место защиты */}
                          {org && (
                            <InfoField label="Место защиты">
                              {org.lines.map((line) => (
                                <p key={line}>{line}</p>
                              ))}
                              {org.city && (
                                <p className="font-medium text-foreground/70">{org.city}</p>
                              )}
                              {w.year != null && (
                                <p className="font-medium text-foreground/70">{w.year} год</p>
                              )}
                            </InfoField>
                          )}

                          {/* Научный руководитель */}
                          {supervisor && (
                            <InfoField label="Научный руководитель">
                              <p className="font-semibold">{supervisor.name}</p>
                              {supervisor.titles.map((t) => (
                                <p className="text-[12.5px] text-muted-foreground" key={t}>
                                  {t}
                                </p>
                              ))}
                            </InfoField>
                          )}

                          {/* Специальность */}
                          {w.speciality && (
                            <InfoField label="Специальность ВАК">
                              <p>{w.speciality}</p>
                            </InfoField>
                          )}

                          {/* Публикации */}
                          {w.publicationCount != null && w.publicationCount > 0 && (
                            <InfoField label="Публикации по теме">
                              <p className="font-semibold">{w.publicationCount} публикаций</p>
                            </InfoField>
                          )}
                        </div>

                        {/* ── Аннотация ── */}
                        {summaryParagraphs.length > 0 && (
                          <div className="rounded-[11px] border-l-[3px] border-primary bg-primary/[0.04] p-[16px_18px]">
                            <h5 className="mb-[10px] text-[12px] font-bold uppercase tracking-[0.06em] text-primary">
                              Аннотация
                            </h5>
                            <div className="space-y-[10px]">
                              {summaryParagraphs.map((para, i) => (
                                <p
                                  className="text-[13.5px] leading-[1.7] text-foreground/85"
                                  key={i}
                                >
                                  {para}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Научная новизна ── */}
                        {w.novelty.length > 0 && (
                          <div>
                            <h5 className="mb-[10px] text-[12.5px] font-bold text-foreground">
                              Научная новизна
                            </h5>
                            <div className="space-y-[8px]">
                              {w.novelty.map((item) => (
                                <NoveltyCard key={item} text={item} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Практическая значимость ── */}
                        {w.practicalValue.length > 0 && (
                          <div>
                            <h5 className="mb-[10px] text-[12.5px] font-bold text-foreground">
                              Практическая значимость
                            </h5>
                            <div className="space-y-[8px]">
                              {w.practicalValue.map((item) => (
                                <PracticalCard key={item} text={item} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Основные результаты ── */}
                        {w.results.length > 0 && (
                          <div>
                            <h5 className="mb-[10px] text-[12.5px] font-bold text-foreground">
                              Основные результаты
                            </h5>
                            <div className="space-y-[6px]">
                              {w.results.map((r) => (
                                <p
                                  className="relative pl-[14px] text-[13px] leading-relaxed text-foreground/80 before:absolute before:left-0 before:top-[7px] before:h-[4px] before:w-[4px] before:rounded-full before:bg-primary/60"
                                  key={r}
                                >
                                  {r}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Документы исследования ── */}
                        {(w.abstractUrl || w.pdfUrl) && (
                          <div className="rounded-[11px] border border-[#e8efed] bg-[#fafcfb] p-[16px]">
                            <h5 className="mb-[12px] flex items-center gap-[6px] text-[12.5px] font-bold text-foreground">
                              <BookOpen className="h-[14px] w-[14px] text-muted-foreground" /> Документы исследования
                            </h5>
                            <div className="grid gap-[10px] sm:grid-cols-2">
                              {w.abstractUrl && (
                                <DocCard
                                  description="PDF · Краткое изложение диссертации"
                                  href={w.abstractUrl}
                                  title="Автореферат"
                                />
                              )}
                              {w.pdfUrl && (
                                <DocCard
                                  description="PDF · Полный текст научной работы"
                                  href={w.pdfUrl}
                                  title="Диссертация"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Основные направления: Врач → Заболевания */}
            {diseases.length > 0 && (
              <Section
                annotation="Врач → Заболевания: ссылки ведут в энциклопедию."
                title="Основные направления"
              >
                <div className="flex flex-wrap gap-[8px]">
                  {diseases.map((d) => (
                    <EncyclopediaPill href={d.href} key={d.href} title={d.title} />
                  ))}
                </div>
              </Section>
            )}

            {/* Выполняемые операции и процедуры: Врач → Процедуры.
                Отдельный блок «Владеет методиками» отложен: для него нет
                источника данных, отличного от procedures (поля «методики» в
                модели Doctor нет), — иначе список дублировался бы. */}
            {procedures.length > 0 && (
              <Section
                annotation="Врач → Процедуры: ссылки ведут в энциклопедию."
                title="Выполняемые операции и процедуры"
              >
                <div className="space-y-[8px]">
                  {procedures.map((p) => (
                    <Link
                      className="group flex items-center justify-between rounded-[11px] border border-[#d8e3e1] bg-background p-[10px_12px] transition-colors hover:border-primary/50 hover:bg-primary/5"
                      href={p.href}
                      key={p.href}
                    >
                      <span className="text-[13.5px] font-semibold text-foreground transition-colors group-hover:text-primary">
                        {p.title}
                      </span>
                      <span aria-hidden className="text-muted-foreground">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Публикации и статьи */}
            {publications.length > 0 && (
              <Section annotation="Врач → Публикации." title="Публикации и статьи">
                <div className="space-y-[10px]">
                  {publications.map((p) => (
                    <Link
                      className="group block border-l-2 border-[#d8e3e1] pl-[11px] transition-colors hover:border-primary"
                      href={p.href}
                      key={p.href}
                    >
                      <span className="block text-[12.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {p.title}
                      </span>
                      {p.year && (
                        <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                          {p.year}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Образование и карьера (единым блоком: отдельные «Образование» и
                «Сертификаты» отложены до согласования новых полей БД) */}
            {data.career && (
              <Section title="Образование и карьера">
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-foreground/80">
                  {data.career}
                </p>
              </Section>
            )}

            {/* Empty state */}
            {!hasMainContent && (
              <Section title="О враче">
                <p className="text-[13px] text-muted-foreground">
                  Подробная информация будет добавлена при наполнении профиля.
                </p>
              </Section>
            )}
          </main>

          {/* ── SIDEBAR ── */}
          {hasSidebar && (
          <aside className="space-y-4">
            {/* Работает в клиниках */}
            {data.clinics.length > 0 && (
              <Section annotation="Врач → Клиники." title="Работает в клиниках">
                <div className="space-y-[8px]">
                  {data.clinics.map((r) => (
                    <Link
                      className="group flex items-center gap-[11px] rounded-[11px] border border-[#d8e3e1] bg-background p-[10px_11px] transition-colors hover:border-primary/50 hover:bg-primary/5"
                      href={`/clinics/${r.clinic.slug}`}
                      key={r.clinic.slug}
                    >
                      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] bg-primary text-[13px] font-extrabold text-primary-foreground">
                        {(r.clinic.networkName ?? r.clinic.title)
                          .replace(/^[«"']+/, "")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                          {r.clinic.title}
                        </span>
                        {r.clinic.city && (
                          <span className="block text-[12px] text-muted-foreground">
                            {r.clinic.city}
                          </span>
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Оборудование: Врач → Оборудование (двусторонняя связь) */}
            {data.equipment.length > 0 && (
              <Section annotation="Врач → Оборудование." title="Работает на оборудовании">
                <div className="space-y-[8px]">
                  {data.equipment.map((r) => (
                    <Link
                      className="group flex items-center gap-[11px] rounded-[11px] border border-[#d8e3e1] bg-background p-[10px_11px] transition-colors hover:border-primary/50 hover:bg-primary/5"
                      href={`/equipment/${r.equipment.slug}`}
                      key={r.equipment.slug}
                    >
                      {r.equipment.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={r.equipment.title}
                          className="h-[34px] w-[46px] shrink-0 rounded-[6px] border border-[#d8e3e1] object-cover"
                          decoding="async"
                          loading="lazy"
                          src={r.equipment.images[0]}
                        />
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                          {r.equipment.title}
                        </span>
                        {r.equipment.manufacturer && (
                          <span className="block text-[12px] text-muted-foreground">
                            {r.equipment.manufacturer}
                          </span>
                        )}
                      </span>
                      <span aria-hidden className="text-muted-foreground">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Связанные страницы энциклопедии */}
            {relatedPages.length > 0 && (
              <Section title="Связанные страницы энциклопедии">
                <div className="flex flex-wrap gap-[6px]">
                  {relatedPages.map((p) => (
                    <EncyclopediaPill href={p.href} key={p.href} title={p.title} />
                  ))}
                </div>
              </Section>
            )}
          </aside>
          )}
        </div>

        {/* ── СВЯЗИ В ЭНЦИКЛОПЕДИИ (граф) ── */}
        {hasGraph && (
          <Section title="Связи в энциклопедии">
            <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-5">
              {/* Врач */}
              <div className="flex flex-col gap-[8px]">
                <p className="text-[11.5px] font-bold text-foreground">Врач</p>
                <span className="rounded-[11px] border border-primary bg-primary p-[11px_13px] text-[12.5px] font-semibold leading-snug text-primary-foreground">
                  {fullName}
                </span>
              </div>

              {data.clinics.length > 0 && (
                <GraphColumn
                  label="→ Клиники"
                  nodes={data.clinics.slice(0, 3).map((r) => ({
                    href: `/clinics/${r.clinic.slug}`,
                    title: r.clinic.city
                      ? `${r.clinic.networkName ?? r.clinic.title} ${r.clinic.city}`
                      : r.clinic.title,
                  }))}
                />
              )}
              {diseases.length > 0 && (
                <GraphColumn label="→ Заболевания" nodes={diseases.slice(0, 3)} />
              )}
              {procedures.length > 0 && (
                <GraphColumn label="→ Процедуры" nodes={procedures.slice(0, 3)} />
              )}
              {publications.length > 0 && (
                <GraphColumn label="→ Публикации" nodes={publications.slice(0, 2)} />
              )}
            </div>
          </Section>
        )}
      </div>

      {/* Schema.org */}
      <SchemaOrg
        data={breadcrumbJsonLd([
          { href: "/", label: "Главная" },
          { href: "/doctors", label: "Врачи и специалисты" },
          { href: `/doctors/${data.slug}`, label: fullName },
        ])}
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "Physician",
          name: fullName,
          url: absoluteUrl(`/doctors/${data.slug}`),
          jobTitle: data.position ?? undefined,
          ...(data.clinics.length > 0
            ? {
                worksFor: data.clinics.map((r) => ({
                  "@type": "MedicalOrganization",
                  name: r.clinic.title,
                  url: absoluteUrl(`/clinics/${r.clinic.slug}`),
                })),
              }
            : {}),
        }}
      />
    </>
  );
}

function GraphColumn({
  label,
  nodes,
}: {
  label: string;
  nodes: { href: string; title: string }[];
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <p className="text-[11.5px] font-bold text-primary">{label}</p>
      {nodes.map((n) => (
        <Link
          className="rounded-[11px] border border-[#d8e3e1] bg-background p-[11px_13px] text-[12.5px] font-semibold leading-snug text-foreground shadow-[0_1px_2px_rgba(15,33,31,0.04),0_4px_14px_rgba(15,33,31,0.05)] transition-colors hover:border-primary/50 hover:text-primary"
          href={n.href}
          key={n.href}
        >
          {n.title}
        </Link>
      ))}
    </div>
  );
}
