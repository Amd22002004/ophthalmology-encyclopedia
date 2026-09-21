export function formatEventRegistrationNumber(sequence: number) {
  return `AOK-EVENT-2026-${String(sequence).padStart(6, "0")}`;
}
