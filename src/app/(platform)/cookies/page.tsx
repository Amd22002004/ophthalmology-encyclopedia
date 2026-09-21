import { LegalPage } from "@/components/legal/legal-page";
import { cookieSections } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Использование cookies",
  description: "Технический аудит cookies на oftalmologia.pro и правила обновления документа при подключении новых сервисов.",
  path: "/cookies",
});

export default function CookiesPage() {
  return <LegalPage eyebrow="Правовая информация" title="Использование cookies" description="Какие cookies обнаружены в текущей сборке и какие изменения требуют повторной правовой проверки." path="/cookies" sections={cookieSections} />;
}

