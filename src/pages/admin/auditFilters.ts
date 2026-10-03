/** Record number box: only positive whole numbers are sent to the server. */
export function recordNumberFilter(raw: string | undefined): { value: string | undefined; invalid: boolean } {
  const t = raw?.trim()
  if (!t) return { value: undefined, invalid: false }
  if (/^[1-9]\d*$/.test(t)) return { value: t, invalid: false }
  return { value: undefined, invalid: true }
}
