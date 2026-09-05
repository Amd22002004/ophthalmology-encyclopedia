const LEADING_SEPARATOR = /^[\s,;:—–-]+/u;

function comparable(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("ru-RU");
}

/**
 * Removes only an exact city value at the beginning of an address.
 * The original value is preserved when the city is not a leading prefix.
 */
export function removeLeadingClinicCity(
  address: string | null | undefined,
  city: string | null | undefined,
): string | null {
  if (address == null || !city?.trim()) return address ?? null;

  const cityValue = city.trim();
  const addressStart = address.search(/\S/u);
  if (addressStart < 0) return address;

  const cityStart = address.slice(addressStart, addressStart + cityValue.length);
  if (comparable(cityStart) !== comparable(cityValue)) return address;

  const remainder = address.slice(addressStart + cityValue.length);
  if (remainder.length > 0 && !/^[\s,;:—–-]/u.test(remainder)) return address;

  const cleaned = remainder.replace(LEADING_SEPARATOR, "").trim();
  return cleaned || null;
}

export function formatClinicAddress(
  city: string | null | undefined,
  address: string | null | undefined,
): string | null {
  const cityValue = city?.trim() || "";
  const addressValue = removeLeadingClinicCity(address, cityValue)?.trim() || "";

  if (cityValue && addressValue) return `${cityValue} — ${addressValue}`;
  return cityValue || addressValue || null;
}
