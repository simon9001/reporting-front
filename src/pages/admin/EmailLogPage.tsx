import { EMAIL_JOB_STATUS_LABELS, EMAIL_JOB_STATUSES, EMAIL_JOB_TYPE_LABELS, type EmailJobDto } from '@sr/shared'
import { useEmailJobs, useRetryEmail } from '../../api/email'
import { DataTable, Pagination } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { Alert, Badge, Button, Card, PageHeader, Select } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import { useUrlFilters } from '../../lib/urlFilters'

const tone = (s: EmailJobDto['status']) => (s === 'SENT' ? 'green' : s === 'FAILED' ? 'red' : s.startsWith('SKIPPED') ? 'amber' : 'slate')

export function EmailLogPage() {
  const { values, set } = useUrlFilters(['status', 'page'])
  const page = Math.max(1, Number(values.page ?? 1) || 1)
  const jobs = useEmailJobs({ status: values.status, page })
  const retry = useRetryEmail()
  const canRetry = (j: EmailJobDto) => j.status === 'FAILED' || j.status === 'SKIPPED_NO_SMTP'
  const retryBtn = (j: EmailJobDto) => canRetry(j) && <Button variant="ghost" disabled={retry.isPending} onClick={() => retry.mutate(j.id)}>Retry</Button>
  return (
    <>
      <PageHeader title="Email log" description="Every email the system has queued, with its delivery status." />
      <Card>
        <div className="space-y-3">
          <Select aria-label="Status" className="w-auto" value={values.status ?? ''} onChange={(e) => set({ status: e.target.value || undefined })}>
            <option value="">All statuses</option>
            {EMAIL_JOB_STATUSES.map((s) => <option key={s} value={s}>{EMAIL_JOB_STATUS_LABELS[s]}</option>)}
          </Select>
          {(jobs.isError || retry.isError) && <Alert>{errorMessage(jobs.error ?? retry.error)}</Alert>}
          <DataTable<EmailJobDto>
            columns={[
              { key: 'created', header: 'Queued', className: 'whitespace-nowrap', render: (j) => formatDateTime(j.createdAt) },
              { key: 'type', header: 'Type', render: (j) => EMAIL_JOB_TYPE_LABELS[j.type] },
              { key: 'to', header: 'To', render: (j) => j.to || '—' },
              { key: 'status', header: 'Status', render: (j) => <Badge tone={tone(j.status)}>{EMAIL_JOB_STATUS_LABELS[j.status]}</Badge> },
              { key: 'attempts', header: 'Attempts', render: (j) => j.attempts },
              { key: 'error', header: 'Last error', render: (j) => <span className="line-clamp-2 max-w-xs text-xs text-slate-600">{j.lastError ?? '—'}</span> },
              { key: 'sent', header: 'Sent', className: 'whitespace-nowrap', render: (j) => (j.sentAt ? formatDateTime(j.sentAt) : '—') },
              { key: 'actions', header: '', className: 'text-right', render: retryBtn },
            ]}
            rows={jobs.data?.items ?? []}
            rowKey={(j) => j.id}
            loading={jobs.isPending}
            mobile={(j) => (
              <span className="block space-y-1">
                <span className="flex items-center justify-between gap-2"><span className="font-medium">{EMAIL_JOB_TYPE_LABELS[j.type]}</span><Badge tone={tone(j.status)}>{EMAIL_JOB_STATUS_LABELS[j.status]}</Badge></span>
                <span className="block truncate text-slate-600">{j.to || '—'} · {formatDateTime(j.createdAt)}</span>
                {j.lastError && <span className="block text-xs text-slate-500">{j.lastError}</span>}
                {retryBtn(j)}
              </span>
            )}
            empty={<EmptyState title="No emails yet" />}
          />
          {jobs.data && jobs.data.total > 0 && <Pagination page={jobs.data.page} pageSize={jobs.data.pageSize} total={jobs.data.total} onPageChange={(p) => set({ page: String(p) })} />}
        </div>
      </Card>
    </>
  )
}
