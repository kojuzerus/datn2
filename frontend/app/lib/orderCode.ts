export function formatOrderCode(id: string | undefined | null): string {
  if (!id) return "";
  return `#${id.slice(-6).toUpperCase()}`;
}
