import { DEFAULT_TIMEZONE } from '@sr/shared'

/** Difference between wall-clock time in `timeZone` and UTC at `instant`, in ms. */
export function tzOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instant)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000
}

/** ISO instant → value for <input type="datetime-local"> showing business-time-zone wall time. */
export function toWallTimeInput(iso: string, timeZone = DEFAULT_TIMEZONE): string {
  const d = new Date(iso)
  return new Date(d.getTime() + tzOffsetMs(d, timeZone)).toISOString().slice(0, 16)
}

/** <input type="datetime-local"> value (business wall time) → ISO instant. */
export function fromWallTimeInput(value: string, timeZone = DEFAULT_TIMEZONE): string {
  const [date = '', time = '00:00'] = value.split('T')
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const guess = Date.UTC(y!, m! - 1, d!, hh!, mm!)
  return new Date(guess - tzOffsetMs(new Date(guess), timeZone)).toISOString()
}
