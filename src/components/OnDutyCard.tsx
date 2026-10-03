import type { CurrentShiftDto } from '@sr/shared'
import { Link } from 'react-router'
import { formatDate, formatDateTime, formatDuration } from '../lib/format'
import { Alert, Card } from './ui'

export function OnDutyCard({ currentShift, now, canPlan }: { currentShift: CurrentShiftDto | null; now: Date; canPlan: boolean }) {
  if (!currentShift) return <Alert tone="warning">No shift times are configured.</Alert>
  const { shift } = currentShift
  return (
    <Card title={`${currentShift.shiftName} shift · ${formatDate(currentShift.shiftDate)}`}>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">Period</dt><dd>{formatDateTime(currentShift.startsAt)} → {formatDateTime(currentShift.endsAt)}</dd></div>
        <div><dt className="text-slate-500">Time left</dt><dd>{formatDuration(new Date(currentShift.endsAt).getTime() - now.getTime())}</dd></div>
        {shift && (
          <>
            <div><dt className="text-slate-500">Shift Supervisor</dt><dd className="font-medium">{shift.supervisor.fullName}</dd></div>
            <div><dt className="text-slate-500">Control Room Officer</dt><dd className="font-medium">{shift.officer.fullName}</dd></div>
          </>
        )}
      </dl>
      {!shift && (
        <div className="mt-3">
          <Alert tone="warning">
            Nobody is rostered for this shift.{' '}
            {canPlan && <Link className="font-medium underline" to="/roster">Add it on the roster</Link>}
          </Alert>
        </div>
      )}
    </Card>
  )
}
