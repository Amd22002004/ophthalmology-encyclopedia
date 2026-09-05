import { LegalPage } from "@/components/legal/legal-page";
import { privacySections } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Политика обработки персональных данных",
  description: "Техническое описание обработки персональных данных на сайте oftalmologia.pro и статусы, требующие утверждения оператора.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return <LegalPage eyebrow="Правовая информация" title="Политика обработки персональных данных" description="Описание текущего сбора, хранения и доступа к данным, которые посетители добровольно передают через форму обращений." path="/privacy-policy" sections={privacySections} />;
}

