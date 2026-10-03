import { addDays, weekStartMonday, type PersonRef, type ShiftDefinitionDto, type UserDto } from '@sr/shared'
import { useState } from 'react'
import { useShiftDefinitions } from '../../api/config'
import { useCopyWeek, useDeleteRosterShift, useRoster, useUpsertRoster } from '../../api/roster'
import { useUsers } from '../../api/users'
import { useMe } from '../../auth/hooks'
import { Alert, Button, cx, PageHeader, Select, Spinner } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { formatDate, todayLocal } from '../../lib/format'
import { useNow } from '../../lib/useNow'
import { buildRosterRows, collectChanges, type Draft, type RosterCell, weekdayLabel } from './rosterGrid'

const DAYS = 14

export function RosterPage() {
  const { data: me } = useMe()
  const role = me?.user.role
  const canEdit = role === 'ADMIN' || role === 'DEPUTY_DIRECTOR'
  const isAdmin = role === 'ADMIN'
  const [weekStart, setWeekStart] = useState(() => weekStartMonday(me?.currentShift?.shiftDate ?? todayLocal()))
  const to = addDays(weekStart, DAYS - 1)
  const defs = useShiftDefinitions()
  const roster = useRoster(weekStart, to)
  const officers = useUsers({ role: 'OFFICER', active: true }, { enabled: canEdit })
  const upsert = useUpsertRoster()
  const copyWeek = useCopyWeek()
  const remove = useDeleteRosterShift()
  const now = useNow()
  const [drafts, setDrafts] = useState(new Map<string, Draft>())
  const [swapRoles, setSwapRoles] = useState(true)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  if (defs.isPending || roster.isPending) return <Spinner />
  if (defs.isError || roster.isError) return <Alert>{errorMessage(defs.error ?? roster.error)}</Alert>

  const activeDefs = defs.data.filter((d) => d.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  const rows = buildRosterRows(weekStart, DAYS, defs.data, roster.data)
  const { entries, problems } = collectChanges(drafts, rows)
  const current = me?.currentShift

  const setDraft = (cell: RosterCell, patch: Partial<Draft>) =>
    setDrafts((prev) => {
      const next = new Map(prev)
      const base = prev.get(cell.key) ?? { supervisorId: cell.shift?.supervisor.id ?? null, officerId: cell.shift?.officer.id ?? null }
      next.set(cell.key, { ...base, ...patch })
      return next
    })

  const run = async (action: () => Promise<string>) => {
    setMessage(null)
    try {
      setMessage({ tone: 'success', text: await action() })
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    }
  }

  const save = () => run(async () => {
    await upsert.mutateAsync(entries)
    setDrafts(new Map())
    return `Saved ${entries.length} shift${entries.length === 1 ? '' : 's'}.`
  })

  const copyPrevious = () => run(async () => {
    const r = await copyWeek.mutateAsync({ fromWeekStart: addDays(weekStart, -7), toWeekStart: weekStart, swapRoles })
    return `Copied ${r.created} shift(s) from the previous week; ${r.skipped} skipped (already planned, ended, or officer inactive).`
  })

  const removeShift = (id: number) => run(async () => {
    await remove.mutateAsync(id)
    return 'Shift removed.'
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roster"
        description={canEdit ? 'Choose the Shift Supervisor and the Control Room Officer for each shift.' : 'Who is on duty for each shift.'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}>← Previous week</Button>
            <Button variant="secondary" onClick={() => setWeekStart(weekStartMonday(todayLocal()))}>This week</Button>
            <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next week →</Button>
          </div>
        }
      />
      <p className="text-sm text-slate-600">{formatDate(weekStart)} – {formatDate(to)}</p>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={entries.length === 0 || problems.size > 0 || upsert.isPending}>Save changes</Button>
          <Button variant="secondary" onClick={() => setDrafts(new Map())} disabled={drafts.size === 0}>Discard</Button>
          <Button variant="secondary" onClick={copyPrevious} disabled={copyWeek.isPending}>Copy previous week into first week</Button>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={swapRoles} onChange={(e) => setSwapRoles(e.target.checked)} /> Swap Supervisor / Officer when copying
          </label>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-800 text-left text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-3 py-2">Date</th>
              {activeDefs.map((d) => <th key={d.code} className="px-3 py-2">{d.name} ({d.startTime}–{d.endTime})</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.shiftDate}>
                <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium">{weekdayLabel(row.shiftDate)}</th>
                {row.cells.map((cell) => {
                  const def = activeDefs.find((d) => d.code === cell.shiftCode)!
                  const isCurrent = current?.shiftDate === cell.shiftDate && current.shiftCode === cell.shiftCode
                  const ended = cell.shift !== null && new Date(cell.shift.endsAt) <= now
                  return (
                    <td key={cell.key} data-testid={`cell-${cell.shiftDate}-${cell.shiftCode}`} className={cx('px-3 py-2 align-top', isCurrent && 'bg-brand-50 ring-2 ring-inset ring-brand-600')}>
                      {canEdit && (isAdmin || !ended) ? (
                        <EditableCell
                          cell={cell}
                          def={def}
                          draft={drafts.get(cell.key)}
                          officers={officers.data ?? []}
                          problem={problems.get(cell.key)}
                          canDelete={cell.shift !== null && new Date(cell.shift.startsAt) > now}
                          onChange={(patch) => setDraft(cell, patch)}
                          onDelete={() => cell.shift && removeShift(cell.shift.id)}
                        />
                      ) : (
                        <ReadOnlyCell cell={cell} />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReadOnlyCell({ cell }: { cell: RosterCell }) {
  if (!cell.shift) return <span className="text-slate-400">Not planned</span>
  return (
    <div className="space-y-0.5">
      <div><span className="text-xs text-slate-500">Supervisor </span>{cell.shift.supervisor.fullName}</div>
      <div><span className="text-xs text-slate-500">Officer </span>{cell.shift.officer.fullName}</div>
    </div>
  )
}

function PersonSelect({ label, value, people, onChange }: { label: string; value: number | null; people: PersonRef[]; onChange: (id: number | null) => void }) {
  return (
    <Select aria-label={label} value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className="py-1">
      <option value="">{label}…</option>
      {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
    </Select>
  )
}

function EditableCell(props: {
  cell: RosterCell
  def: ShiftDefinitionDto
  draft: Draft | undefined
  officers: UserDto[]
  problem: string | undefined
  canDelete: boolean
  onChange: (patch: Partial<Draft>) => void
  onDelete: () => void
}) {
  const { cell, draft, officers, problem, canDelete, onChange, onDelete } = props
  const supervisorId = draft?.supervisorId ?? cell.shift?.supervisor.id ?? null
  const officerId = draft?.officerId ?? cell.shift?.officer.id ?? null
  // Keep people already on the shift selectable even if they were deactivated since.
  const people: PersonRef[] = [...officers]
  for (const p of [cell.shift?.supervisor, cell.shift?.officer]) if (p && !people.some((x) => x.id === p.id)) people.push(p)

  return (
    <div className={cx('min-w-48 space-y-1', draft && 'rounded bg-amber-50 p-1')}>
      <PersonSelect label="Supervisor" value={supervisorId} people={people} onChange={(id) => onChange({ supervisorId: id })} />
      <PersonSelect label="Officer" value={officerId} people={people} onChange={(id) => onChange({ officerId: id })} />
      {problem && <p className="text-xs text-red-600">{problem}</p>}
      {canDelete && !draft && (
        <button type="button" className="text-xs text-red-700 underline" onClick={onDelete}>Remove shift</button>
      )}
    </div>
  )
}
