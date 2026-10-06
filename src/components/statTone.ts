export type StatTone = 'plain' | 'charcoal' | 'red' | 'yellow' | 'blue'

/** KPI tile colour blocks. Yellow carries charcoal ink; charcoal shows its value in highway yellow. */
export const STAT_TONES: Record<StatTone, { box: string; value: string; muted: string }> = {
  plain: { box: 'bg-white text-asphalt-800 shadow-card', value: 'text-asphalt-800', muted: 'text-slate-500' },
  charcoal: { box: 'bg-asphalt-800 text-white shadow-card', value: 'text-highway-400', muted: 'text-white/75' },
  red: { box: 'bg-red-600 text-white shadow-card', value: 'text-white', muted: 'text-white' },
  yellow: { box: 'bg-highway-400 text-asphalt-900 shadow-card', value: 'text-asphalt-900', muted: 'text-asphalt-900/75' },
  blue: { box: 'bg-static text-white shadow-card', value: 'text-white', muted: 'text-white' },
}
