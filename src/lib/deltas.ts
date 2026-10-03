import type { PeriodDelta } from '@sr/shared'

export type DeltaTone = 'good' | 'bad' | 'neutral'

export function describeDelta(d: PeriodDelta, kind: 'percent' | 'minutes' | 'points', better: 'higher' | 'lower'): { text: string; tone: DeltaTone } | null {
  if (d.current === null || d.previous === null) return null
  const diff = d.current - d.previous
  if (diff === 0) return { text: 'No change', tone: 'neutral' }
  const up = diff > 0
  const tone: DeltaTone = up === (better === 'higher') ? 'good' : 'bad'
  const arrow = up ? '▲' : '▼'
  if (kind === 'percent') {
    if (d.previous === 0) return { text: `${arrow} new`, tone }
    const pct = Math.round((Math.abs(diff) / d.previous) * 100)
    return { text: pct < 1 ? `${arrow} <1%` : `${arrow} ${pct}%`, tone }
  }
  const whole = Math.round(Math.abs(diff))
  if (whole === 0) return { text: 'No change', tone: 'neutral' }
  return { text: `${arrow} ${whole} ${kind === 'minutes' ? 'min' : 'pts'}`, tone }
}
