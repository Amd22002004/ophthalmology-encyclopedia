import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return <Breadcrumb items={[{ href: "/", label: "Главная" }, ...items]} />;
}
