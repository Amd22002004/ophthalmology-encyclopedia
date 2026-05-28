import { StaticSectionTemplate } from "@/components/templates/static-section-template";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Оставить сообщение",
  description: "Страница для будущей формы обратной связи и редакционных обращений.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <StaticSectionTemplate
      blocks={[
        {
          title: "Форма сообщения",
          body: "Форма будет подключена после выбора auth/storage и антиспам-стратегии. Сейчас страница сохраняет публичный маршрут и SEO-структуру.",
        },
        {
          title: "Редакционные обращения",
          body: "Сценарий рассчитан на вопросы по материалам, предложения по сущностям и профессиональные заявки.",
        },
      ]}
      description="Будущий публичный канал обратной связи для пользователей, врачей, клиник и поставщиков."
      eyebrow="Связь"
      path="/contact"
      title="Оставить сообщение"
    />
  );
}
