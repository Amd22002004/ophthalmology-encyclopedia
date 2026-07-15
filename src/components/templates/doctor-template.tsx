import { UserRound } from "lucide-react";
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

/** Маркированный подраздел научной работы. Пустой список не рендерится. */
function WorkList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h5 className="mb-[6px] text-[12.5px] font-bold text-foreground">{title}</h5>
      <ul className="space-y-[5px]">
        {items.map((item) => (
          <li
            className="relative pl-[14px] text-[13px] leading-relaxed text-foreground/80 before:absolute before:left-0 before:top-[7px] before:h-[4px] before:w-[4px] before:rounded-full before:bg-primary/60"
            key={item}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ссылка на оригинальный документ (PDF) научной работы. */
function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex items-center gap-[6px] rounded-[8px] border border-[#d8e3e1] bg-background px-[10px] py-[6px] text-[12.5px] font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
      href={href}
      rel="noopener"
      target="_blank"
    >
      <span aria-hidden>📄</span>
      {label} <span className="font-normal text-muted-foreground">(PDF)</span>
    </a>
  );
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
              <Section title="Научная деятельность">
                <div className="space-y-[22px]">
                  {data.scientificWorks.map((w) => (
                    <article className="space-y-[10px]" key={w.id}>
                      <header>
                        {/* Тип, степень и название — единый заголовок работы,
                            чтобы все они индексировались (требование SEO из ТЗ). */}
                        <h4>
                          <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                            {w.type}
                          </span>
                          {w.degree && (
                            <span className="mt-1 block text-[12.5px] font-semibold text-foreground">
                              {w.degree}
                            </span>
                          )}
                          <span className="mt-1 block text-[15px] font-bold leading-snug text-foreground">
                            {w.title}
                          </span>
                        </h4>
                        {(w.year != null || w.speciality) && (
                          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                            {[w.year, w.speciality].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {w.organization && (
                          <p className="text-[12.5px] text-muted-foreground">{w.organization}</p>
                        )}
                        {w.supervisor && (
                          <p className="mt-1 text-[12.5px] text-muted-foreground">
                            Научный руководитель: {w.supervisor}
                          </p>
                        )}
                      </header>

                      {w.summary && (
                        <p className="text-[13.5px] leading-relaxed text-foreground/80">
                          {w.summary}
                        </p>
                      )}

                      <WorkList items={w.novelty} title="Научная новизна" />
                      <WorkList items={w.practicalValue} title="Практическая значимость" />
                      <WorkList items={w.results} title="Основные результаты" />

                      {w.publicationCount != null && w.publicationCount > 0 && (
                        <div>
                          <h5 className="mb-[6px] text-[12.5px] font-bold text-foreground">
                            Публикации
                          </h5>
                          <p className="text-[13px] text-foreground/80">
                            Публикаций по теме работы: {w.publicationCount}
                          </p>
                        </div>
                      )}

                      {(w.abstractUrl || w.pdfUrl) && (
                        <div>
                          <h5 className="mb-[6px] text-[12.5px] font-bold text-foreground">
                            Документы
                          </h5>
                          <div className="flex flex-wrap gap-[8px]">
                            {w.abstractUrl && (
                              <DocLink href={w.abstractUrl} label="Автореферат" />
                            )}
                            {w.pdfUrl && <DocLink href={w.pdfUrl} label="Диссертация" />}
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </Section>
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
