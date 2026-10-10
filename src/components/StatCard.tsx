import type { ReactNode } from 'react'
import type { DeltaTone } from '../lib/deltas'
import { STAT_TONES, type StatTone } from './statTone'
import { cx } from './ui'

const toneClass: Record<DeltaTone, string> = { good: 'text-green-700', bad: 'text-red-700', neutral: 'text-slate-500' }

export function StatCard({ label, value, delta, hint, footnote, onClick, tone = 'plain' }: {
  label: string
  value: ReactNode
  delta?: { text: string; tone: DeltaTone } | null
  hint?: ReactNode
  footnote?: ReactNode
  onClick?: () => void
  tone?: StatTone
}) {
  const t = STAT_TONES[tone]
  const plain = tone === 'plain'
  const body = (
    <>
      <p className={cx('text-xs font-medium', t.muted)}>{label}</p>
      <p className={cx('mt-1 font-display text-2xl font-semibold leading-none tracking-tight tabular-nums', t.value)}>{value}</p>
      <p className="mt-1.5 min-h-4 text-xs">
        {/* On colour tiles the good/bad colours would vanish, so deltas use the tile's muted ink and their text carries the meaning. */}
        {delta && <span className={plain ? toneClass[delta.tone] : cx('font-medium', t.muted)}>{delta.text}</span>}
        {hint && <span className={t.muted}>{delta ? ' · ' : ''}{hint}</span>}
      </p>
      {footnote && <p className={cx('mt-0.5 text-xs tabular-nums', t.muted)}>{footnote}</p>}
    </>
  )
  const base = cx('rounded-lg p-3 text-left', t.box)
  return onClick
    ? <button type="button" onClick={onClick} className={cx(base, 'transition duration-150 hover:brightness-95 active:translate-y-px focus-visible:focus-halo')}>{body}</button>
    : <div className={base}>{body}</div>
}
