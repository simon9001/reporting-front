import { addDays } from '@sr/shared'
import { useRoster } from '../api/roster'
import { Alert, Badge, Card, Spinner } from '../components/ui'
import { errorMessage } from '../lib/api'
import { formatDateTime, todayLocal } from '../lib/format'

export function UpcomingShifts({ userId, now }: { userId: number; now: Date }) {
  const today = todayLocal(now)
  const roster = useRoster(addDays(today, -1), addDays(today, 14))
  if (roster.isPending) return <Spinner />
  if (roster.isError) return <Alert>{errorMessage(roster.error)}</Alert>
  const mine = roster.data.filter((s) => new Date(s.endsAt) > now && (s.supervisor.id === userId || s.officer.id === userId))

  return (
    <Card title="My upcoming shifts">
      {mine.length === 0 ? (
        <p className="text-sm text-slate-600">You are not rostered in the next two weeks.</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {mine.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{s.shiftName} · {formatDateTime(s.startsAt)} → {formatDateTime(s.endsAt)}</span>
              <Badge tone="blue">{s.supervisor.id === userId ? 'Supervisor' : 'Officer'}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
