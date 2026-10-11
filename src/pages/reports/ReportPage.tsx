import { OVERALL_STATUS_LABELS, REPORT_CONFIRMATIONS, REPORT_TEXT_FIELDS, REPORT_TEXT_LABELS, type ShiftReportDto } from '@sr/shared'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { reportPdfUrl, useReport } from '../../api/reports'
import { Skeleton } from '../../components/EmptyState'
import { Alert, Badge, Card, PageHeader } from '../../components/ui'
import { ApiError, errorMessage } from '../../lib/api'
import { formatDate, formatTime } from '../../lib/format'
import { useNow } from '../../lib/useNow'
import { IncidentDrawer } from '../incidents/IncidentDrawer'
import { ReportContentView } from './ReportContentView'
import { ReportSupervisorForm } from './ReportSupervisorForm'
import { reportStatusLine } from './reportView'

const toneBadge = { neutral: 'slate', danger: 'red', success: 'green', warning: 'amber' } as const

function SubmittedFields({ r }: { r: ShiftReportDto }) {
  return (
    <Card title="Supervisor's report">
      <dl className="grid gap-x-4 gap-y-3 md:grid-cols-2">
        <div><dt className="text-xs text-slate-500">Overall status</dt><dd className="text-[13px]">{r.fields.overallStatus ? OVERALL_STATUS_LABELS[r.fields.overallStatus] : '—'}</dd></div>
        {REPORT_TEXT_FIELDS.map((k) => (
          <div key={k} className={k === 'overview' ? 'md:col-span-2' : undefined}>
            <dt className="text-xs text-slate-500">{REPORT_TEXT_LABELS[k]}</dt>
            <dd className="whitespace-pre-wrap break-words text-[13px] text-slate-800">{r.fields[k] ?? '—'}</dd>
          </div>
        ))}
        <div className="md:col-span-2">
          <dt className="text-xs text-slate-500">Accountability</dt>
          <dd><ul className="text-[13px]">{REPORT_CONFIRMATIONS.map((c) => <li key={c.key}>{r.fields[c.key] ? 'Yes' : 'No'} — {c.label}</li>)}</ul></dd>
        </div>
      </dl>
    </Card>
  )
}

export function ReportPage() {
  const { id } = useParams()
  const reportId = Number(id)
  const q = useReport(Number.isInteger(reportId) ? reportId : null)
  const now = useNow()
  const [openRef, setOpenRef] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  if (q.isPending) return <Skeleton rows={8} />
  if (q.isError) {
    const status = q.error instanceof ApiError ? q.error.status : 0
    return <Alert>{status === 404 ? 'Report not found.' : status === 403 ? 'You do not have access to this report.' : errorMessage(q.error)}</Alert>
  }
  const r = q.data
  const s = r.content.shift
  const line = reportStatusLine(r, now, formatTime)
  return (
    <>
      <PageHeader
        title={`${s.shiftName} shift report`}
        description={`${formatDate(s.shiftDate)} · ${formatTime(s.startsAt)}–${formatTime(s.endsAt)} · Supervisor ${s.supervisor.fullName} · Officer ${s.officer.fullName}`}
        actions={
          <>
            <Badge tone={toneBadge[line.tone]}>{line.text}</Badge>
            <a href={reportPdfUrl(r.id)} download className="inline-flex h-9 items-center gap-1.5 rounded-md border border-silver-200 bg-white px-3 text-[13px] font-semibold text-asphalt-800 hover:bg-silver-100 focus-visible:focus-halo sm:h-8">
              <Download className="size-4" aria-hidden />Download PDF
            </a>
          </>
        }
      />
      {r.status === 'SUBMITTED' && <Alert tone="success">Submitted — this report can no longer be changed.</Alert>}
      <ReportContentView content={r.content} onOpen={setOpenRef} />
      {r.canEdit
        ? <ReportSupervisorForm key={`${r.id}-${formKey}`} report={r} onReload={() => { void q.refetch().then(() => setFormKey((k) => k + 1)) }} />
        : <SubmittedFields r={r} />}
      <IncidentDrawer idOrRef={openRef} onClose={() => setOpenRef(null)} />
    </>
  )
}
