import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { catalogFixture } from "./catalog-fixture";
import { buildClinicMapCities } from "./cities";
import { clinicMapCityCoordinates, clinicMapExcludedSlugs } from "./config";
import { formatClinicCount } from "./format";
import { clinicMapSize, getClinicMapContour, projectToMap } from "./projection";


const { cities, unmappedCities } = buildClinicMapCities(catalogFixture);

test("map points and the city list come from one grouped source", () => {
  assert.equal(cities.length, 10);
  assert.deepEqual(unmappedCities, []);
  assert.ok(cities.every((city) => city.point), "every catalog city is on the map");
  assert.equal(cities.reduce((sum, city) => sum + city.clinics.length, 0), 13);
});

test("cities are sorted by clinic count, then alphabetically", () => {
  assert.deepEqual(
    cities.map((city) => `${city.city}:${city.clinics.length}`),
    [
      "Тюмень:3",
      "Ноябрьск:2",
      "Екатеринбург:1",
      "Ишим:1",
      "Курган:1",
      "Нижневартовск:1",
      "Салехард:1",
      "Сургут:1",
      "Тобольск:1",
      "Шадринск:1",
    ],
  );
});

test("«Глазцентр-Тюмень» is a deliberate exclusion from both the map and the list", () => {
  assert.deepEqual(clinicMapExcludedSlugs, ["glaztsentr-tyumen"]);
  assert.ok(!cities.some((city) => city.clinics.some((clinic) => clinic.slug === "glaztsentr-tyumen")));
});

test("profile links match the catalog slugs", () => {
  const expected = catalogFixture
    .filter((clinic) => !clinicMapExcludedSlugs.includes(clinic.slug))
    .map((clinic) => `/clinics/${clinic.slug}`)
    .sort();
  assert.deepEqual(cities.flatMap((city) => city.clinics.map((clinic) => clinic.url)).sort(), expected);
});

test("a catalog city without coordinates stays in the list and off the map", () => {
  const result = buildClinicMapCities([
    ...catalogFixture,
    { slug: "test-omsk", title: "Тестовая клиника", city: "Омск", region: "Омская область" },
    { slug: "test-no-city", title: "Клиника без города", city: null, region: null },
  ]);
  const omsk = result.cities.find((city) => city.city === "Омск");
  assert.ok(omsk, "the city is listed");
  assert.equal(omsk.point, null);
  assert.deepEqual(result.unmappedCities, ["Город не указан", "Омск"]);
});

test("every active clinic city in the seed has map coordinates", () => {
  // Каталог наполняется из prisma/seed.ts: новый город без координат должен быть
  // замечен здесь, а не на сайте. Сам блок при этом не падает (тест выше).
  const seed = readFileSync(new URL("../../../prisma/seed.ts", import.meta.url), "utf8");
  const block = seed.slice(seed.indexOf("const CLINICS: ClinicSeed[] = ["), seed.indexOf("\n];", seed.indexOf("const CLINICS")));
  const entries = block.split(/\n  \{\n/).slice(1);
  const activeCities = new Set(
    entries
      .filter((entry) => /status: "active"/.test(entry))
      .map((entry) => entry.match(/city: "([^"]+)"/)?.[1])
      .filter((city): city is string => Boolean(city)),
  );
  assert.ok(activeCities.size >= 10, `seed parsing found ${activeCities.size} cities`);
  const missing = [...activeCities].filter((city) => !clinicMapCityCoordinates[city]);
  assert.deepEqual(missing, [], `cities without coordinates: ${missing.join(", ")}`);
});

test("city positions are computed from latitude and longitude only", () => {
  for (const [city, config] of Object.entries(clinicMapCityCoordinates)) {
    assert.deepEqual(Object.keys(config).sort(), ["label", "lat", "lon"], city);
    const { x, y } = projectToMap(config.lat, config.lon);
    assert.ok(x > 0 && x < clinicMapSize.width && y > 0 && y < clinicMapSize.height, `${city} is inside the map`);
  }
  const contour = getClinicMapContour();
  assert.match(contour.land, /^M[\d.-]+ [\d.-]+L/);
  assert.match(contour.borders, /^M[\d.-]+ [\d.-]+L/);
});

test("clinic counts are declined in Russian", () => {
  assert.deepEqual(
    [1, 2, 3, 5, 11, 21, 22].map(formatClinicCount),
    ["1 клиника", "2 клиники", "3 клиники", "5 клиник", "11 клиник", "21 клиника", "22 клиники"],
  );
});
