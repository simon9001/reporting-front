import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '../../components/ui'
import type { DeltaTone } from '../../lib/deltas'

const deltaPill: Record<DeltaTone, string> = { good: 'bg-green-100 text-green-800', bad: 'bg-red-100 text-red-800', neutral: 'bg-slate-100 text-slate-700' }

export function Panel({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('min-w-0 rounded-xl border border-silver-200 bg-white p-4', className)}>
      {(title || actions) && (
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-display text-sm font-semibold text-asphalt-900">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}

/** A headline figure with a coloured icon square; `big` is the lead tile above the smaller ones. */
export function KpiTile({ icon: Icon, iconClass, label, value, delta, hint, footnote, onClick, big = false }: {
  icon: LucideIcon
  iconClass: string
  label: string
  value: ReactNode
  delta?: { text: string; tone: DeltaTone } | null
  hint?: ReactNode
  footnote?: ReactNode
  onClick?: () => void
  big?: boolean
}) {
  const body = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block text-xs font-medium text-slate-500">{label}</span>
          <span className={cx('mt-1 block font-display font-semibold leading-none tracking-tight text-asphalt-900 tabular-nums', big ? 'text-3xl' : 'text-2xl')}>{value}</span>
        </span>
        <span className={cx('flex shrink-0 items-center justify-center rounded-lg [&_svg]:size-4', big ? 'size-10 [&_svg]:size-5' : 'size-8', iconClass)}><Icon aria-hidden /></span>
      </span>
      {(delta || hint) && (
        <span className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          {delta && <span className={cx('rounded-full px-2 py-0.5 font-medium', deltaPill[delta.tone])}>{delta.text}</span>}
          {hint && <span>{hint}</span>}
        </span>
      )}
      {footnote && <span className="mt-1 block text-xs text-slate-500 tabular-nums">{footnote}</span>}
    </>
  )
  const base = 'block min-w-0 rounded-xl border border-silver-200 bg-white p-4 text-left'
  return onClick
    ? <button type="button" onClick={onClick} className={cx(base, 'w-full transition duration-150 hover:border-silver-400 active:translate-y-px focus-visible:focus-halo')}>{body}</button>
    : <div className={base}>{body}</div>
}

export function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-silver-200 p-2 text-center">
      <p className="font-display text-lg font-semibold leading-tight text-asphalt-900 tabular-nums">{value}</p>
      <p className="text-xs leading-tight text-slate-500">{label}</p>
    </div>
  )
}

/** The dark highlight panel: headline total, three supporting figures and the trend chart. */
export function TrendHero({ total, stats, children, className }: { total: number | null; stats: { label: string; value: ReactNode }[]; children: ReactNode; className?: string }) {
  return (
    <section className={cx('min-w-0 rounded-xl bg-gradient-to-br from-pine-900 via-pine-800 to-pine-600 p-4 text-white', className)}>
      <h2 className="font-display text-sm font-semibold">Incidents over time</h2>
      <p className="mt-1 font-display text-3xl font-semibold leading-none tracking-tight tabular-nums">{total ?? '—'}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="truncate text-xs text-white/75" title={s.label}>{s.label}</dt>
            <dd className="truncate text-[15px] font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3">{children}</div>
    </section>
  )
}
