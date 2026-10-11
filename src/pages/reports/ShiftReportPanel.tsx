import { Download, FileText } from 'lucide-react'
import { Link } from 'react-router'
import { reportPdfUrl, useShiftReport } from '../../api/reports'
import { Skeleton } from '../../components/EmptyState'
import { Alert, Badge, Card } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { formatTime } from '../../lib/format'
import { useNow } from '../../lib/useNow'
import { reportStatusLine, toneBadge } from './reportView'

const linkBtn = 'inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold focus-visible:focus-halo sm:h-8'

export function ShiftReportPanel({ shiftId, title }: { shiftId: number; title: string }) {
  const q = useShiftReport(shiftId)
  const now = useNow()
  return (
    <Card title={title}>
      {q.isPending ? <Skeleton rows={1} /> : q.isError ? <Alert>{errorMessage(q.error)}</Alert> : (() => {
        const line = reportStatusLine(q.data, now, formatTime)
        return (
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={toneBadge[line.tone]}>{line.text}</Badge>
            <span className="ml-auto flex flex-wrap gap-2">
              <Link to={`/reports/${q.data.id}`} className={`${linkBtn} bg-asphalt-800 text-white hover:bg-asphalt-700`}><FileText className="size-4" aria-hidden />Open report</Link>
              {q.data.status === 'SUBMITTED' && (
                <a href={reportPdfUrl(q.data.id)} download className={`${linkBtn} border border-silver-200 bg-white text-asphalt-800 hover:bg-silver-100`}><Download className="size-4" aria-hidden />Download PDF</a>
              )}
            </span>
          </div>
        )
      })()}
    </Card>
  )
}
