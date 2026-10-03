import type { CurrentShiftDto, ShiftRole } from '@sr/shared'
import { Link } from 'react-router'
import { formatDate, formatDateTime, formatDuration } from '../lib/format'
import { Alert } from './ui'

export function OnDutyCard({ currentShift, now, canPlan, myRole }: { currentShift: CurrentShiftDto | null; now: Date; canPlan: boolean; myRole?: ShiftRole | null }) {
  if (!currentShift) return <Alert tone="warning">No shift times are configured.</Alert>
  const { shift } = currentShift
  const start = Date.parse(currentShift.startsAt)
  const end = Date.parse(currentShift.endsAt)
  const pct = Math.min(100, Math.max(0, ((now.getTime() - start) / (end - start)) * 100))
  const headline =
    myRole === 'SUPERVISOR' ? 'You are the Shift Supervisor for this shift.'
      : myRole === 'OFFICER' ? 'You are the Control Room Officer for this shift.'
      : `${formatDuration(end - now.getTime())} remaining`
  return (
    <section className="rounded-xl bg-linear-to-br from-brand-600 to-brand-700 p-5 text-white shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">
        {myRole ? 'Your shift' : 'On duty now'} · {currentShift.shiftName} · {formatDate(currentShift.shiftDate)}
      </p>
      <p className="mt-1 text-lg font-semibold">{headline}</p>
      {shift ? (
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs uppercase tracking-wide text-brand-200">Shift Supervisor</dt><dd className="font-medium">{shift.supervisor.fullName}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-brand-200">Control Room Officer</dt><dd className="font-medium">{shift.officer.fullName}</dd></div>
        </dl>
      ) : (
        <p className="mt-3 rounded-md bg-white/10 px-3 py-2 text-sm">
          Nobody is rostered for this shift.{' '}
          {canPlan && <Link to="/roster" className="font-semibold underline">Add it on the roster</Link>}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-brand-100">
        <span>{formatDateTime(currentShift.startsAt)} → {formatDateTime(currentShift.endsAt)}</span>
        <span>{formatDuration(end - now.getTime())} left</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-white/25" role="progressbar" aria-label="Shift progress" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-1.5 rounded-full bg-white" style={{ width: `${pct}%` }} />
      </div>
    </section>
  )
}
