import { StaticSectionTemplate } from "@/components/templates/static-section-template";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Регистрация клиники",
  description: "Auth-ready маршрут будущей регистрации клиники как directory-сущности.",
  path: "/register/clinic",
});

export default function RegisterClinicPage() {
  return (
    <StaticSectionTemplate
      blocks={[
        {
          title: "Directory-карточка",
          body: "Регистрация будет создавать карточку клиники с регионом, контактами, специализациями, врачами и регуляторным статусом.",
        },
        {
          title: "Без продаж услуг",
          body: "Публичный интерфейс остаётся информационным: без корзины, цен, внутренней финансовой логики и marketplace-сценариев.",
        },
      ]}
      description="Маршрут подготовлен для будущего кабинета клиники и модерации карточки."
      eyebrow="Auth-ready"
      path="/register/clinic"
      title="Регистрация клиники"
    />
  );
}
