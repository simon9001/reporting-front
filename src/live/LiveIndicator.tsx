import { cx } from '../components/ui'
import { formatTime } from '../lib/format'
import { useLiveStatus } from './LiveProvider'

export function LiveIndicator() {
  const { status, lastEventAt } = useLiveStatus()
  const label = status === 'live' ? 'Live' : status === 'reconnecting' ? 'Reconnecting…' : 'Connecting…'
  return (
    <span
      role="status"
      title={lastEventAt ? `Last update ${formatTime(lastEventAt.toISOString())}` : 'Updates appear automatically'}
      className="inline-flex items-center gap-1.5 rounded-full bg-silver-100 px-2.5 py-1 text-xs font-semibold text-asphalt-800"
    >
      <span className={cx('size-2 rounded-full', status === 'live' ? 'bg-green-500 shadow-[0_0_0_3px_rgb(34_197_94/0.2)]' : 'animate-pulse bg-amber-500')} aria-hidden />
      {label}
    </span>
  )
}
