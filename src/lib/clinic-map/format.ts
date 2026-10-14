/** «1 клиника», «3 клиники», «5 клиник». */
export function formatClinicCount(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  const word =
    lastTwo >= 11 && lastTwo <= 14 ? "клиник" : last === 1 ? "клиника" : last >= 2 && last <= 4 ? "клиники" : "клиник";
  return `${count} ${word}`;
}
