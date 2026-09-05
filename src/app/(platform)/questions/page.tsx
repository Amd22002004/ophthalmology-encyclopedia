import { AppealInvitation } from "@/components/appeals/appeal-invitation";
import { EntityBlock } from "@/components/entity/entity-block";
import { EntityHeader } from "@/components/entity/entity-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SchemaOrg } from "@/components/seo/schema-org";
import { breadcrumbJsonLd, createPageMetadata, faqPageJsonLd } from "@/lib/seo";

const faqItems = [
  {
    question: "Как найти информацию в энциклопедии?",
    answer: "Используйте поиск и тематические разделы: заболевания, процедуры, врачи, клиники, оборудование, научные работы и расследования. Связанные карточки помогают последовательно переходить между материалами.",
  },
  {
    question: "Где опубликованы документы расследований?",
    answer: "Первичные документы, ответы организаций, фотографии и хронология размещаются на странице соответствующего расследования в разделе независимого контроля.",
  },
  {
    question: "Как передать информацию или документы?",
    answer: "Любые сведения, жалобы, документы, предложения и сообщения по расследованиям принимаются только через единую страницу «Подать обращение».",
  },
  {
    question: "Является ли раздел «Вопросы» медицинской консультацией?",
    answer: "Нет. Это справочная база знаний по устройству энциклопедии и опубликованным материалам. Индивидуальные обстоятельства можно описать в обращении.",
  },
  {
    question: "Публикуются ли данные заявителя?",
    answer: "Контакты, текст обращения и приложения не публикуются. После отправки пользователь получает публичный номер, а на странице расследования может отображаться только общее количество полученных обращений.",
  },
] as const;

export const metadata = createPageMetadata({
  title: "Вопросы и ответы",
  description: "База ответов об использовании офтальмологической энциклопедии, расследованиях, документах и передаче обращений.",
  path: "/questions",
});

export default function QuestionsPage() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Вопросы" }]} />
      <EntityHeader
        description="Короткие ответы об использовании энциклопедии, опубликованных расследованиях, документах и едином порядке передачи обращений."
        eyebrow="База знаний"
        title="Вопросы и ответы"
      />

      <section aria-label="Часто задаваемые вопросы" className="space-y-4">
        {faqItems.map((item) => (
          <article key={item.question}>
            <EntityBlock title={item.question}>
              <p className="text-sm leading-6 text-muted-foreground">{item.answer}</p>
            </EntityBlock>
          </article>
        ))}
      </section>

      <AppealInvitation
        actionLabel="Подать обращение →"
        compact
        description="Если в базе знаний нет ответа для вашей ситуации, направьте сведения через единую форму Ассоциации."
        title="Не нашли ответ?"
      />

      <SchemaOrg data={breadcrumbJsonLd([{ href: "/", label: "Главная" }, { href: "/questions", label: "Вопросы" }])} />
      <SchemaOrg data={faqPageJsonLd([...faqItems])} />
    </div>
  );
}
