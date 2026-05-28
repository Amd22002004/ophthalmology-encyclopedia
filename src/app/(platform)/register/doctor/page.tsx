import { StaticSectionTemplate } from "@/components/templates/static-section-template";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Регистрация врача",
  description: "Auth-ready маршрут будущей регистрации врача и профессионального профиля.",
  path: "/register/doctor",
});

export default function RegisterDoctorPage() {
  return (
    <StaticSectionTemplate
      blocks={[
        {
          title: "Будущий профиль",
          body: "Регистрация будет создавать профессиональный профиль врача с проверяемыми специализациями, клиниками, публикациями и карьерным путём.",
        },
        {
          title: "Публичная витрина",
          body: "После модерации профиль сможет стать публичной сущностью Doctor, связанной с заболеваниями, процедурами и публикациями.",
        },
      ]}
      description="Маршрут подготовлен для будущего auth-flow без имитации регистрации."
      eyebrow="Auth-ready"
      path="/register/doctor"
      title="Регистрация врача"
    />
  );
}
