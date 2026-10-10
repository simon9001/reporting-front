import type { CurrentShiftDto, ShiftRole } from '@sr/shared'
import { Link } from 'react-router'
import { formatDate, formatDateTime, formatDuration } from '../lib/format'
import { Alert, cx } from './ui'

/** `tile` sits in the dashboard KPI strip; `banner` is the slim one-row strip on My Shift (stacks below md). */
export function OnDutyCard({ currentShift, now, canPlan, myRole, variant = 'tile' }: {
  currentShift: CurrentShiftDto | null
  now: Date
  canPlan: boolean
  myRole?: ShiftRole | null
  variant?: 'tile' | 'banner'
}) {
  if (!currentShift) return <Alert tone="warning">No shift times are configured.</Alert>
  const { shift } = currentShift
  const start = Date.parse(currentShift.startsAt)
  const end = Date.parse(currentShift.endsAt)
  const pct = Math.min(100, Math.max(0, ((now.getTime() - start) / (end - start)) * 100))
  const headline =
    myRole === 'SUPERVISOR' ? 'You are the Shift Supervisor for this shift.'
      : myRole === 'OFFICER' ? 'You are the Control Room Officer for this shift.'
      : `${formatDuration(end - now.getTime())} remaining`
  const label = `${myRole ? 'Your shift' : 'On duty now'} · ${currentShift.shiftName} · ${formatDate(currentShift.shiftDate)}`
  const banner = variant === 'banner'

  const names = shift ? (
    <dl className={cx('grid gap-0.5 text-xs', banner && 'md:flex md:gap-4')}>
      <div className="flex min-w-0 gap-1.5"><dt className="shrink-0 text-silver-400">Supervisor</dt><dd className="truncate font-medium text-white">{shift.supervisor.fullName}</dd></div>
      <div className="flex min-w-0 gap-1.5"><dt className="shrink-0 text-silver-400">Officer</dt><dd className="truncate font-medium text-white">{shift.officer.fullName}</dd></div>
    </dl>
  ) : (
    <p className="text-xs text-white/90">
      Nobody is rostered for this shift.{' '}
      {canPlan && <Link to="/roster" className="font-semibold text-highway-400 underline">Add it on the roster</Link>}
    </p>
  )

  const progress = (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 text-[11px] text-silver-400 tabular-nums">
        <span className="truncate">{formatDateTime(currentShift.startsAt)} → {formatDateTime(currentShift.endsAt)}</span>
        <span className="shrink-0">{formatDuration(end - now.getTime())} left</span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-white/15" role="progressbar" aria-label="Shift progress" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-1 rounded-full road-dash" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )

  if (banner) {
    return (
      <section className="relative overflow-hidden rounded-lg bg-asphalt-800 px-4 py-3 text-white">
        <div className="absolute inset-x-0 top-0 h-0.5 road-dash" aria-hidden />
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <div className="min-w-0 md:flex-1">
            <p className="text-xs font-semibold text-silver-400">{label}</p>
            <p className="font-display text-[15px] font-semibold text-highway-400">{headline}</p>
          </div>
          {names}
          <div className="md:w-72">{progress}</div>
        </div>
      </section>
    )
  }
  return (
    <section className="relative flex h-full flex-col justify-between gap-2 overflow-hidden rounded-lg bg-asphalt-800 p-3 text-white">
      <div className="absolute inset-x-0 top-0 h-0.5 road-dash" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-silver-400">{label}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-highway-400">{headline}</p>
      </div>
      {names}
      {progress}
    </section>
  )
}
