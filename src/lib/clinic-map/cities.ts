import {
  clinicMapCityCoordinates,
  clinicMapExcludedSlugs,
  type ClinicMapLabel,
} from "@/lib/clinic-map/config";
import { projectToPercent } from "@/lib/clinic-map/projection";

/** Поля каталога, которые нужны карте; клиники берутся из каталога как есть. */
export type ClinicMapCatalogItem = {
  slug: string;
  title: string;
  city: string | null;
  region: string | null;
};

export type ClinicMapCity = {
  city: string;
  region: string | null;
  lat: number | null;
  lon: number | null;
  /** Положение точки в процентах карты; `null` — города нет в конфиге координат. */
  point: { left: number; top: number; label: ClinicMapLabel } | null;
  clinics: { slug: string; name: string; url: string }[];
};

export const unknownCityLabel = "Город не указан";

/**
 * Города для карты и списка из одного источника — каталога клиник: группировка
 * по городу, исключения из конфига, сортировка по убыванию числа клиник, затем
 * по алфавиту. Город без координат остаётся в списке и не попадает на карту.
 */
export function buildClinicMapCities(catalog: readonly ClinicMapCatalogItem[]) {
  const groups = new Map<string, ClinicMapCity>();

  for (const clinic of catalog) {
    if (clinicMapExcludedSlugs.includes(clinic.slug)) continue;
    const city = clinic.city?.trim() || unknownCityLabel;
    let group = groups.get(city);
    if (!group) {
      const coordinates = clinicMapCityCoordinates[city];
      group = {
        city,
        region: clinic.region,
        lat: coordinates?.lat ?? null,
        lon: coordinates?.lon ?? null,
        point: coordinates
          ? { ...projectToPercent(coordinates.lat, coordinates.lon), label: coordinates.label }
          : null,
        clinics: [],
      };
      groups.set(city, group);
    }
    group.region ??= clinic.region;
    group.clinics.push({ slug: clinic.slug, name: clinic.title, url: `/clinics/${clinic.slug}` });
  }

  const cities = [...groups.values()].sort(
    (a, b) => b.clinics.length - a.clinics.length || a.city.localeCompare(b.city, "ru"),
  );

  return {
    cities,
    unmappedCities: cities.filter((city) => !city.point).map((city) => city.city),
  };
}
