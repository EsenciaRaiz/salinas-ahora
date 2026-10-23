/** Partition a rotation without repeating businesses to fill the final page. */
export function groupRotationItems<T>(items: T[], size: number): T[][] {
  const count = Math.max(1, Math.floor(size) || 1);
  return Array.from({ length: Math.ceil(items.length / count) }, (_, index) => items.slice(index * count, (index + 1) * count));
}
