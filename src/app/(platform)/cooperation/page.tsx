import { StaticSectionTemplate } from "@/components/templates/static-section-template";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Сотрудничество",
  description: "Публичная страница сотрудничества для врачей, клиник и отраслевых организаций.",
  path: "/cooperation",
});

export default function CooperationPage() {
  return (
    <StaticSectionTemplate
      blocks={[
        {
          title: "Для врачей и авторов",
          body: "Будущие сценарии включают профессиональный профиль, публикации, научные работы и участие в отраслевой базе знаний.",
        },
        {
          title: "Для клиник и поставщиков",
          body: "Платформа поддерживает directory-карточки, внешние ссылки и отраслевые связи без ecommerce и marketplace-механики.",
        },
      ]}
      description="Публичная точка входа для профессионального сотрудничества без раскрытия внутренней финансовой логики."
      eyebrow="Партнёрский раздел"
      path="/cooperation"
      title="Сотрудничество"
    />
  );
}
