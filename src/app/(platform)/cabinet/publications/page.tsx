import { CabinetSectionTemplate } from "@/components/templates/cabinet-section-template";
import { createPageMetadata } from "@/lib/seo";

export const metadata = {
  ...createPageMetadata({
    title: "Публикации в кабинете",
    description: "Будущий список публикаций автора в приватной зоне.",
    path: "/cabinet/publications",
  }),
  robots: { index: false, follow: false },
};

export default function CabinetPublicationsPage() {
  return (
    <CabinetSectionTemplate
      blocks={[
        {
          title: "Список публикаций",
          body: "Будущий автор сможет управлять публикациями, аннотациями и связями с заболеваниями и процедурами.",
        },
        {
          title: "Научный слой",
          body: "Публикации отделены от новостей и становятся сущностями Publication с индексируемыми публичными страницами после модерации.",
        },
      ]}
      description="Auth-ready страница будущих публикаций автора."
      title="Публикации"
    />
  );
}
