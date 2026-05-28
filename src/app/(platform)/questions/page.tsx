import { StaticSectionTemplate } from "@/components/templates/static-section-template";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Вопросы",
  description: "Структура будущего раздела вопросов по офтальмологической энциклопедии.",
  path: "/questions",
});

export default function QuestionsPage() {
  return (
    <StaticSectionTemplate
      blocks={[
        {
          title: "Вопросы пациентов",
          body: "Раздел будет направлять пользователя к заболеваниям, диагностике, процедурам и клиническим рекомендациям.",
        },
        {
          title: "Профессиональные вопросы",
          body: "Вопросы врачей и клиник будут связаны с регистрацией, публикациями, стандартами и нормативными материалами.",
        },
      ]}
      description="Страница готова для будущей базы вопросов без превращения продукта в консультационный лендинг."
      eyebrow="Справочный раздел"
      path="/questions"
      title="Вопросы"
    />
  );
}
