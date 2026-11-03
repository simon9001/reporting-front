import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { useReports } from '../../api/reports'
import { todayLocal } from '../../lib/format'

export function ReportsTile() {
  const today = todayLocal()
  const submitted = useReports({ from: today, to: today, status: 'SUBMITTED', page: 1 })
  const overdue = useReports({ status: 'OVERDUE', page: 1 })
  const n = (q: typeof submitted) => (q.data ? q.data.total : '—')
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-pine-800 to-pine-600 p-4 text-white">
      <div className="min-w-0">
        <h2 className="font-display text-sm font-semibold">Shift reports</h2>
        <p className="mt-0.5 text-xs text-white/85">
          <Link to={`/reports?status=SUBMITTED&from=${today}&to=${today}`} className="rounded hover:underline focus-visible:focus-halo"><span className="font-semibold tabular-nums">{n(submitted)}</span> submitted today</Link>
          {' · '}
          <Link to="/reports?status=OVERDUE" className="rounded hover:underline focus-visible:focus-halo"><span className="font-semibold tabular-nums">{n(overdue)}</span> overdue</Link>
        </p>
      </div>
      <Link to="/reports" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-white px-3 text-[13px] font-semibold text-asphalt-900 transition duration-150 hover:bg-silver-100 focus-visible:focus-halo sm:h-8">
        All reports<ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  )
}
