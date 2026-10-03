import { DEFAULT_TIMEZONE, localDateString } from '@sr/shared'

const dateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEFAULT_TIMEZONE, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
})
const time = new Intl.DateTimeFormat('en-GB', { timeZone: DEFAULT_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false })

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso)).replace(', ', ' ')
export const formatTime = (iso: string) => time.format(new Date(iso))

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return '0m'
  const minutes = Math.floor(ms / 60_000)
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}

export const todayLocal = (now = new Date()) => localDateString(now, DEFAULT_TIMEZONE)
