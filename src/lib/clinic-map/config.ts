// Настройки карты блока «География профессионального сообщества» на /about
// (ТЗ карты v1.0). Клиники здесь не хранятся: их даёт каталог. Здесь только
// охват карты, координаты городов и осознанные исключения.

/** Охват карты: Урал и Западная Сибирь с полем вокруг крайних городов. */
export const clinicMapBounds = {
  lonMin: 56.8,
  lonMax: 80.6,
  latMin: 54.4,
  latMax: 67.6,
} as const;

export type ClinicMapLabelSide = "top" | "right" | "bottom" | "left";

/**
 * Подпись города: сторона от точки и необязательный сдвиг в пикселях.
 * Сдвигается только подпись — точка остаётся на своих координатах.
 */
export type ClinicMapLabel = { side: ClinicMapLabelSide; dx?: number; dy?: number };

export type ClinicMapCityCoordinates = { lat: number; lon: number; label: ClinicMapLabel };

/**
 * Координаты городов каталога, градусы с точностью до 0,01. Сверены с Natural
 * Earth (populated places) и справочными координатами центров городов.
 * Город из каталога без записи здесь попадает только в список под картой.
 */
export const clinicMapCityCoordinates: Readonly<Record<string, ClinicMapCityCoordinates>> = {
  Салехард: { lat: 66.53, lon: 66.6, label: { side: "right" } },
  Ноябрьск: { lat: 63.2, lon: 75.45, label: { side: "left" } },
  Сургут: { lat: 61.25, lon: 73.42, label: { side: "left" } },
  Нижневартовск: { lat: 60.94, lon: 76.57, label: { side: "bottom" } },
  Тобольск: { lat: 58.2, lon: 68.25, label: { side: "right" } },
  // Южная группа плотнее остальных: подписи разведены по сторонам.
  Тюмень: { lat: 57.15, lon: 65.53, label: { side: "top" } },
  Екатеринбург: { lat: 56.84, lon: 60.6, label: { side: "top" } },
  Ишим: { lat: 56.11, lon: 69.49, label: { side: "right" } },
  Шадринск: { lat: 56.09, lon: 63.63, label: { side: "left" } },
  Курган: { lat: 55.44, lon: 65.34, label: { side: "right" } },
};

/**
 * Осознанное исключение (ТЗ карты v1.0, §1): эти клиники не выводятся ни на
 * карту, ни в список блока. Каталог, карточка и профиль клиники не меняются.
 */
export const clinicMapExcludedSlugs: readonly string[] = ["glaztsentr-tyumen"];
