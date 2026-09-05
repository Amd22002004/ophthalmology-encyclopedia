import { randomInt } from "node:crypto";

export function createCooperationApplicationNumber(date = new Date(), sequence = randomInt(1, 1_000_000)) {
  return `AOK-${date.getUTCFullYear()}-${String(sequence).padStart(6, "0")}`;
}
