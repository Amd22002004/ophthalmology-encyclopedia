import { clinicMapBounds } from "@/lib/clinic-map/config";
import { landRings, subjectBorders } from "@/lib/clinic-map/geography";

// Равнопромежуточная цилиндрическая проекция с поправкой на среднюю широту
// охвата: для иллюстративной карты небольшого района этого достаточно.
// Это единственное место, где широта и долгота превращаются в координаты SVG.

const unitsPerDegree = 100;
const meanLatitude = (clinicMapBounds.latMin + clinicMapBounds.latMax) / 2;
const longitudeScale = Math.cos((meanLatitude * Math.PI) / 180);

/** Размер карты в единицах viewBox. */
export const clinicMapSize = {
  width: round((clinicMapBounds.lonMax - clinicMapBounds.lonMin) * longitudeScale * unitsPerDegree),
  height: round((clinicMapBounds.latMax - clinicMapBounds.latMin) * unitsPerDegree),
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

/** Точка карты в единицах viewBox. */
export function projectToMap(lat: number, lon: number) {
  return {
    x: round((lon - clinicMapBounds.lonMin) * longitudeScale * unitsPerDegree),
    y: round((clinicMapBounds.latMax - lat) * unitsPerDegree),
  };
}

/** Положение точки в процентах ширины и высоты карты. */
export function projectToPercent(lat: number, lon: number) {
  const { x, y } = projectToMap(lat, lon);
  return {
    left: Math.round((x / clinicMapSize.width) * 10000) / 100,
    top: Math.round((y / clinicMapSize.height) * 10000) / 100,
  };
}

function toPathData(lines: readonly (readonly number[])[], close: boolean) {
  return lines
    .map((line) => {
      const commands: string[] = [];
      for (let index = 0; index < line.length; index += 2) {
        const { x, y } = projectToMap(line[index + 1], line[index]);
        commands.push(`${index === 0 ? "M" : "L"}${x} ${y}`);
      }
      return commands.join("") + (close ? "Z" : "");
    })
    .join("");
}

/** Контур карты: заливка суши и внутренние границы субъектов. */
export function getClinicMapContour() {
  return {
    land: toPathData(landRings, true),
    borders: toPathData(subjectBorders, false),
  };
}
