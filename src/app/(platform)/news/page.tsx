import { StaticSectionTemplate } from "@/components/templates/static-section-template";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Новости",
  description: "Новости платформы и отраслевые обновления по офтальмологии.",
  path: "/news",
});

export default function NewsPage() {
  return (
    <StaticSectionTemplate
      blocks={[
        {
          title: "Отраслевые обновления",
          body: "Новостной слой будет отделён от медицинских сущностей, но сможет ссылаться на заболевания, процедуры, клиники и публикации.",
        },
        {
          title: "Редакционные публикации",
          body: "Раздел подготовлен для материалов платформы без искусственного наполнения.",
        },
      ]}
      description="Индекс будущих новостей и редакционных обновлений."
      eyebrow="Новости"
      path="/news"
      title="Новости"
    />
  );
}
