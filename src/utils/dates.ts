/**
 * Returns the ISO date string (YYYY-MM-DD) of the most recent Monday.
 * If today is Monday, returns today.
 */
export function getLastMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0]!;
}
