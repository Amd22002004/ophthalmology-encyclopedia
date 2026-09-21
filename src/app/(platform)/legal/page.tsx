import { LegalPage } from "@/components/legal/legal-page";
import { privacySections } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Правовая информация",
  description: "Реквизиты оператора, правовые документы и контакты по вопросам обработки данных сайта oftalmologia.pro.",
  path: "/legal",
});

export default function LegalInformationPage() {
  return <LegalPage eyebrow="Правовая информация" title="Правовая информация" description="Единая точка доступа к документам, реквизитам оператора и контактам по вопросам обработки данных." path="/legal" sections={privacySections.slice(0, 1)} />;
}

