import type { ClinicMapCatalogItem } from "./cities";

// Только для тестов карты: состав каталога на дату ТЗ.
/** Каталог из ТЗ карты v1.0, §1 (снят со страницы /clinics 14.10.2026). */
export const catalogFixture: ClinicMapCatalogItem[] = [
  { slug: "vizus1-tyumen-oms", title: "«Визус-1» (ОМС)", city: "Тюмень", region: "Тюменская область" },
  { slug: "glaztsentr-tyumen", title: "ООО «Глазцентр-Тюмень»", city: "Тюмень", region: "Тюменская область" },
  { slug: "vizus1-tyumen-oftalmo", title: "Офтальмологический центр «Визус-1»", city: "Тюмень", region: "Тюменская область" },
  { slug: "vizus1-tyumen", title: "Центр микрохирургии глаза «Визус-1»", city: "Тюмень", region: "Тюменская область" },
  { slug: "polyarny-krug-noyabrsk", title: "ООО «Полярный круг»", city: "Ноябрьск", region: "ЯНАО" },
  { slug: "prozrenie-noyabrsk", title: "Центр микрохирургии глаза «Прозрение-Север»", city: "Ноябрьск", region: "ЯНАО" },
  { slug: "mntk-fedorova-ekb", title: "МНТК микрохирургии глаза им. Фёдорова", city: "Екатеринбург", region: "Свердловская область" },
  { slug: "vizus1-ishim", title: "Офтальмологический кабинет «Визус-1»", city: "Ишим", region: "Тюменская область" },
  { slug: "vizus1-kurgan", title: "Центр микрохирургии глаза «Визус-1»", city: "Курган", region: "Курганская область" },
  { slug: "vizus1-nizhnevartovsk", title: "Центр микрохирургии глаза «Визус-1»", city: "Нижневартовск", region: "ХМАО — Югра" },
  { slug: "sever-salekhard", title: "ООО «Север»", city: "Салехард", region: "ЯНАО" },
  { slug: "vizus1-surgut", title: "Офтальмологический центр «Визус-1»", city: "Сургут", region: "ХМАО — Югра" },
  { slug: "vizus1-tobolsk", title: "Офтальмологический кабинет «Визус-1»", city: "Тобольск", region: "Тюменская область" },
  { slug: "vizus1-shadrinsk", title: "Офтальмологический кабинет «Визус-1»", city: "Шадринск", region: "Курганская область" },
];
