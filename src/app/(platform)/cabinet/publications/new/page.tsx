import { CabinetSectionTemplate } from "@/components/templates/cabinet-section-template";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Новая публикация",
  description: "Будущая форма добавления научной публикации.",
  path: "/cabinet/publications/new",
});

export default function NewCabinetPublicationPage() {
  return (
    <CabinetSectionTemplate
      blocks={[
        {
          title: "Черновик публикации",
          body: "Форма будет собирать тип публикации, дату, автора, аннотацию, полный текст и связи с болезнями и процедурами.",
        },
        {
          title: "Публикация после проверки",
          body: "Материал должен становиться публичной сущностью только после редакторской проверки.",
        },
      ]}
      description="Маршрут готов для будущего создания публикаций."
      title="Новая публикация"
    />
  );
}
