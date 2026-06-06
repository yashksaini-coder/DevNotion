/**
 * Prefix a blog headline with its sequential dev-log number.
 * e.g. formatDevLogTitle(7, "Shipped the auth flow") → "Dev log #7 Shipped the auth flow"
 */
export function formatDevLogTitle(n: number, title: string): string {
  return `Dev log #${n} ${title}`;
}
