import { randomBytes } from "node:crypto";

export function createAppealPublicNumber(date = new Date(), entropy?: Uint8Array) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const suffix = Buffer.from(entropy ?? randomBytes(6)).toString("hex").toUpperCase();
  return `AO-${year}${month}${day}-${suffix}`;
}
