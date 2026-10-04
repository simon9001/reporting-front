import type { ReactNode } from 'react'
import type { DeltaTone } from '../lib/deltas'
import { cx } from './ui'

const toneClass: Record<DeltaTone, string> = { good: 'text-green-700', bad: 'text-red-700', neutral: 'text-slate-500' }

export function StatCard({ label, value, delta, hint, footnote, onClick }: {
  label: string
  value: ReactNode
  delta?: { text: string; tone: DeltaTone } | null
  hint?: ReactNode
  footnote?: ReactNode
  onClick?: () => void
}) {
  const body = (
    <>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 h-4 text-xs">
        {delta && <span className={toneClass[delta.tone]}>{delta.text}</span>}
        {hint && <span className="text-slate-500">{delta ? ' · ' : ''}{hint}</span>}
      </p>
      {footnote && <p className="mt-1 text-xs text-slate-500">{footnote}</p>}
    </>
  )
  const base = 'rounded-xl border border-line bg-white p-4 text-left'
  return onClick
    ? <button type="button" onClick={onClick} className={cx(base, 'transition hover:border-brand-300 hover:shadow-sm')}>{body}</button>
    : <div className={base}>{body}</div>
}
