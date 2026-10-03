import { addDays } from '@sr/shared'
import { formatDate } from './format'

export interface Period { from: string; to: string }
export type PeriodPreset = 'today' | '7d' | 'month' | 'lastMonth' | 'custom'
export const PRESETS = ['today', '7d', 'month', 'lastMonth'] as const
export const PRESET_LABELS: Record<PeriodPreset, string> = { today: 'Today', '7d': '7 days', month: 'This month', lastMonth: 'Last month', custom: 'Custom' }

export function presetPeriod(preset: (typeof PRESETS)[number], today: string): Period {
  const firstOfMonth = `${today.slice(0, 8)}01`
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case '7d':
      return { from: addDays(today, -6), to: today }
    case 'month':
      return { from: firstOfMonth, to: today }
    case 'lastMonth': {
      const end = addDays(firstOfMonth, -1)
      return { from: `${end.slice(0, 8)}01`, to: end }
    }
  }
}

export function detectPreset(p: Period, today: string): PeriodPreset {
  return PRESETS.find((k) => {
    const x = presetPeriod(k, today)
    return x.from === p.from && x.to === p.to
  }) ?? 'custom'
}

export function periodLabel(p: Period, today: string): string {
  const preset = detectPreset(p, today)
  if (preset !== 'custom') return PRESET_LABELS[preset]
  return p.from === p.to ? formatDate(p.from) : `${formatDate(p.from)} – ${formatDate(p.to)}`
}
