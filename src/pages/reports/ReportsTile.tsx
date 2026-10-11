import { Link } from 'react-router'
import { useReports } from '../../api/reports'
import { Card } from '../../components/ui'
import { todayLocal } from '../../lib/format'

export function ReportsTile() {
  const today = todayLocal()
  const submitted = useReports({ from: today, to: today, status: 'SUBMITTED', page: 1 })
  const overdue = useReports({ status: 'OVERDUE', page: 1 })
  const n = (q: typeof submitted) => (q.data ? q.data.total : '—')
  return (
    <Card title="Shift reports" actions={<Link to="/reports" className="text-[13px] font-medium text-link hover:underline">All reports</Link>}>
      <div className="flex gap-4">
        <Link to={`/reports?status=SUBMITTED&from=${today}&to=${today}`} className="rounded-md focus-visible:focus-halo">
          <span className="block text-xs text-slate-500">Submitted today</span>
          <span className="font-display text-xl font-semibold tabular-nums text-asphalt-900">{n(submitted)}</span>
        </Link>
        <Link to="/reports?status=OVERDUE" className="rounded-md focus-visible:focus-halo">
          <span className="block text-xs text-slate-500">Overdue now</span>
          <span className={`font-display text-xl font-semibold tabular-nums ${overdue.data && overdue.data.total > 0 ? 'text-red-700' : 'text-asphalt-900'}`}>{n(overdue)}</span>
        </Link>
      </div>
    </Card>
  )
}
