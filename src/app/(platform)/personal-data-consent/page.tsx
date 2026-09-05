import { LegalPage } from "@/components/legal/legal-page";
import { consentSections } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Согласие на обработку персональных данных",
  description: "Пояснение к версионируемому согласию, которое отображается перед отправкой обращения в Ассоциацию.",
  path: "/personal-data-consent",
});

export default function PersonalDataConsentPage() {
  return <LegalPage eyebrow="Правовая информация" title="Согласие на обработку персональных данных" description="Порядок отображения и утверждения текста согласия для единой формы обращений." path="/personal-data-consent" sections={consentSections} />;
}

