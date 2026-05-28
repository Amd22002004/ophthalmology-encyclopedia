import { CabinetSectionTemplate } from "@/components/templates/cabinet-section-template";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Профиль кабинета",
  description: "Будущая страница редактирования профиля врача или клиники.",
  path: "/cabinet/profile",
});

export default function CabinetProfilePage() {
  return (
    <CabinetSectionTemplate
      blocks={[
        {
          title: "Профиль",
          body: "Форма профиля будет подключена после auth-слоя. Сейчас маршрут и структура готовы для server-side data access.",
        },
        {
          title: "Модерация",
          body: "Публичные поля должны проходить проверку перед публикацией в каталоге.",
        },
      ]}
      description="Будущая приватная страница профиля."
      title="Профиль"
    />
  );
}
