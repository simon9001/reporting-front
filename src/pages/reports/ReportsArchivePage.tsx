import { OVERALL_STATUS_LABELS, type ReportListItemDto } from '@sr/shared'
import { useNavigate } from 'react-router'
import { useShiftDefinitions } from '../../api/config'
import { useReports } from '../../api/reports'
import { DataTable, Pagination } from '../../components/DataTable'
import { DateRangePicker } from '../../components/DateRangePicker'
import { EmptyState } from '../../components/EmptyState'
import { Segmented } from '../../components/Segmented'
import { Alert, Badge, Card, PageHeader } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { formatDate, formatDateTime, todayLocal } from '../../lib/format'
import { useUrlFilters } from '../../lib/urlFilters'

const KEYS = ['from', 'to', 'shiftCode', 'status', 'timeliness', 'page'] as const

function StatusBadge({ r }: { r: ReportListItemDto }) {
  if (r.status === 'SUBMITTED') return <Badge tone="green">Submitted</Badge>
  return r.overdue ? <Badge tone="red">Overdue</Badge> : <Badge>Draft</Badge>
}
const Timeliness = ({ r }: { r: ReportListItemDto }) =>
  r.timeliness === 'LATE' ? <Badge tone="amber">{r.lateMinutes} min late</Badge> : r.timeliness === 'ON_TIME' ? <Badge tone="blue">On time</Badge> : <span className="text-slate-400">—</span>

export function ReportsArchivePage() {
  const navigate = useNavigate()
  const { values, set } = useUrlFilters(KEYS)
  const defs = useShiftDefinitions()
  const page = Math.max(1, Number(values.page ?? 1) || 1)
  const list = useReports({ from: values.from, to: values.to, shiftCode: values.shiftCode, status: values.status, timeliness: values.timeliness, page })
  const period = values.from && values.to ? { from: values.from, to: values.to } : null
  const label = (r: ReportListItemDto) => `Open ${r.shiftName} shift report ${formatDate(r.shiftDate)}`
  return (
    <>
      <PageHeader title="Reports" description={list.data ? `${list.data.total} shift report${list.data.total === 1 ? '' : 's'}` : 'Shift reports submitted by Shift Supervisors'} />
      <Card>
        <div className="space-y-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <DateRangePicker value={period} onChange={(p) => set({ from: p?.from, to: p?.to })} today={todayLocal()} />
            <Segmented label="Shift" value={values.shiftCode ?? ''} onChange={(v) => set({ shiftCode: v || undefined })} options={[{ value: '', label: 'Any shift' }, ...(defs.data ?? []).filter((d) => d.isActive).map((d) => ({ value: d.code, label: d.name }))]} />
            <Segmented label="Status" value={values.status ?? ''} onChange={(v) => set({ status: v || undefined })} options={[{ value: '', label: 'Any' }, { value: 'SUBMITTED', label: 'Submitted' }, { value: 'DRAFT', label: 'Draft' }, { value: 'OVERDUE', label: 'Overdue' }]} />
            <Segmented label="Timeliness" value={values.timeliness ?? ''} onChange={(v) => set({ timeliness: v || undefined })} options={[{ value: '', label: 'Any' }, { value: 'ON_TIME', label: 'On time' }, { value: 'LATE', label: 'Late' }]} />
          </div>
          {list.isError && <Alert>{errorMessage(list.error)}</Alert>}
          <DataTable
            columns={[
              { key: 'date', header: 'Date', className: 'whitespace-nowrap', render: (r) => formatDate(r.shiftDate) },
              { key: 'shift', header: 'Shift', render: (r) => r.shiftName },
              { key: 'sup', header: 'Supervisor', render: (r) => r.supervisor.fullName },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge r={r} /> },
              { key: 'overall', header: 'Overall status', render: (r) => (r.overallStatus ? OVERALL_STATUS_LABELS[r.overallStatus] : '—') },
              { key: 'submitted', header: 'Submitted', className: 'whitespace-nowrap', render: (r) => (r.submittedAt ? formatDateTime(r.submittedAt) : '—') },
              { key: 'time', header: 'Timeliness', render: (r) => <Timeliness r={r} /> },
            ]}
            rows={list.data?.items ?? []}
            rowKey={(r) => r.id}
            loading={list.isPending}
            onRowClick={(r) => navigate(`/reports/${r.id}`)}
            rowLabel={label}
            mobile={(r) => (
              <span className="block space-y-1">
                <span className="flex items-center justify-between gap-2"><span className="font-semibold text-asphalt-900">{formatDate(r.shiftDate)} · {r.shiftName}</span><StatusBadge r={r} /></span>
                <span className="flex items-center justify-between gap-2 text-slate-600"><span className="truncate">{r.supervisor.fullName}</span><Timeliness r={r} /></span>
              </span>
            )}
            empty={<EmptyState size="page" title="No reports match" description="Reports appear here as soon as a shift's report is opened or submitted." />}
          />
          {list.data && list.data.total > 0 && <Pagination page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPageChange={(p) => set({ page: String(p) })} />}
        </div>
      </Card>
    </>
  )
}
