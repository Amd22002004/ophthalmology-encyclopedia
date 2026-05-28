import { CabinetSectionTemplate } from "@/components/templates/cabinet-section-template";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Кабинет",
  description: "Auth-ready зона будущих профилей врачей и клиник.",
  path: "/cabinet",
});

export default function CabinetPage() {
  return (
    <CabinetSectionTemplate
      blocks={[
        {
          title: "Состояние доступа",
          body: "Сложный auth-flow ещё не подключён. Архитектура маршрутов разделяет публичный content и будущую приватную область.",
        },
        {
          title: "Будущие роли",
          body: "Зона рассчитана на врачей, клиники и редакционные сценарии публикаций без раскрытия внутренней коммерческой механики.",
        },
      ]}
      description="Каркас кабинета готов к подключению Supabase Auth и ролевой модели."
      title="Кабинет"
    />
  );
}
