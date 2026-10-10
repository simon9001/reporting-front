/** WAI-ARIA tablist keys: Left/Right wrap, Home/End jump. Returns null for keys the tablist does not handle. */
export function nextTabIndex(current: number, key: string, count: number): number | null {
  if (key === 'ArrowRight') return (current + 1) % count
  if (key === 'ArrowLeft') return (current - 1 + count) % count
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return null
}
