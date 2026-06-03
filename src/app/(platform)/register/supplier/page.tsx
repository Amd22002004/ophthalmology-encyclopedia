import { StaticSectionTemplate } from "@/components/templates/static-section-template";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Регистрация поставщика",
  description: "Регистрация поставщика офтальмологического оборудования и расходных материалов в справочнике.",
  path: "/register/supplier",
});

export default function RegisterSupplierPage() {
  return (
    <StaticSectionTemplate
      blocks={[
        {
          title: "Карточка поставщика",
          body: "Регистрация создаёт справочную карточку с описанием компании, категориями оборудования, контактами и связями с конкретными позициями оборудования.",
        },
        {
          title: "Информационный каталог",
          body: "Раздел поставщиков — отраслевой справочник без marketplace-логики: без цен, корзины и коммерческих транзакций.",
        },
      ]}
      description="Добавьте вашу компанию в отраслевой справочник офтальмологического оборудования."
      eyebrow="Для поставщиков"
      path="/register/supplier"
      title="Регистрация поставщика"
    />
  );
}
