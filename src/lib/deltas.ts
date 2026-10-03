import type { PeriodDelta } from '@sr/shared'

export type DeltaTone = 'good' | 'bad' | 'neutral'

export function describeDelta(d: PeriodDelta, kind: 'percent' | 'minutes' | 'points', better: 'higher' | 'lower'): { text: string; tone: DeltaTone } | null {
  if (d.current === null || d.previous === null) return null
  const diff = d.current - d.previous
  if (diff === 0) return { text: 'No change', tone: 'neutral' }
  const up = diff > 0
  const tone: DeltaTone = up === (better === 'higher') ? 'good' : 'bad'
  const arrow = up ? '▲' : '▼'
  if (kind === 'percent') return d.previous === 0 ? { text: `${arrow} new`, tone } : { text: `${arrow} ${Math.round((Math.abs(diff) / d.previous) * 100)}%`, tone }
  if (kind === 'minutes') return { text: `${arrow} ${Math.abs(diff)} min`, tone }
  return { text: `${arrow} ${Math.abs(diff)} pts`, tone }
}
