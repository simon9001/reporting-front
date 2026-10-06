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
    <section className="relative overflow-hidden rounded-2xl bg-asphalt-800 p-5 text-white shadow-card">
      <div className="absolute inset-x-0 top-0 h-1 road-dash" aria-hidden />
      <p className="text-xs font-semibold text-silver-400">
        {myRole ? 'Your shift' : 'On duty now'} · {currentShift.shiftName} · {formatDate(currentShift.shiftDate)}
      </p>
      <p className="mt-1 font-display text-lg font-semibold text-highway-400">{headline}</p>
      {shift ? (
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-silver-400">Shift Supervisor</dt><dd className="font-medium">{shift.supervisor.fullName}</dd></div>
          <div><dt className="text-xs text-silver-400">Control Room Officer</dt><dd className="font-medium">{shift.officer.fullName}</dd></div>
        </dl>
      ) : (
        <p className="mt-3 rounded-[10px] bg-white/10 px-3 py-2 text-sm">
          Nobody is rostered for this shift.{' '}
          {canPlan && <Link to="/roster" className="font-semibold text-highway-400 underline">Add it on the roster</Link>}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-silver-400 tabular-nums">
        <span>{formatDateTime(currentShift.startsAt)} → {formatDateTime(currentShift.endsAt)}</span>
        <span>{formatDuration(end - now.getTime())} left</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-white/15" role="progressbar" aria-label="Shift progress" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-1.5 rounded-full road-dash" style={{ width: `${pct}%` }} />
      </div>
    </section>
  )
}
