import Link from "next/link";
import { legalOperator } from "@/lib/legal";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/70 px-3 py-8 sm:px-5 lg:px-7" aria-label="Правовая информация">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="font-medium text-foreground">{legalOperator.name}</p>
          <p className="mt-1">ОГРН {legalOperator.ogrn} · ИНН {legalOperator.inn}</p>
          <p className="mt-1">{legalOperator.address}</p>
          <a className="mt-1 inline-block text-primary underline-offset-4 hover:underline" href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a>
        </div>
        <nav className="grid gap-1 sm:min-w-64 sm:grid-cols-2" aria-label="Юридические документы">
          <Link className="hover:text-foreground" href="/privacy-policy">Политика обработки данных</Link>
          <Link className="hover:text-foreground" href="/personal-data-consent">Согласие на обработку данных</Link>
          <Link className="hover:text-foreground" href="/cookies">Cookies</Link>
          <Link className="hover:text-foreground" href="/legal">Правовая информация</Link>
          <Link className="hover:text-foreground" href="/appeal">Подать обращение</Link>
        </nav>
      </div>
    </footer>
  );
}

