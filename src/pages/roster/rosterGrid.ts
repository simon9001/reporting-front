import { addDays, fromDateString, localDateString, type RosterEntryInput, type ShiftDefinitionDto, type ShiftDto } from '@sr/shared'

export interface RosterCell { key: string; shiftDate: string; shiftCode: string; shift: ShiftDto | null }
export interface RosterRow { shiftDate: string; cells: RosterCell[] }
export interface Draft { supervisorId: number | null; officerId: number | null }

export const cellKey = (shiftDate: string, shiftCode: string) => `${shiftDate}|${shiftCode}`

export function buildRosterRows(start: string, days: number, defs: ShiftDefinitionDto[], shifts: ShiftDto[]): RosterRow[] {
  const byKey = new Map(shifts.map((s) => [cellKey(s.shiftDate, s.shiftCode), s]))
  const active = defs.filter((d) => d.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  return Array.from({ length: days }, (_, i) => {
    const shiftDate = addDays(start, i)
    return {
      shiftDate,
      cells: active.map((d) => {
        const key = cellKey(shiftDate, d.code)
        return { key, shiftDate, shiftCode: d.code, shift: byKey.get(key) ?? null }
      }),
    }
  })
}

export function draftProblem(d: Draft): string | null {
  if (d.supervisorId === null || d.officerId === null) return 'Choose both people'
  if (d.supervisorId === d.officerId) return 'Supervisor and Officer must be different'
  return null
}

export function collectChanges(drafts: Map<string, Draft>, rows: RosterRow[]) {
  const entries: RosterEntryInput[] = []
  const problems = new Map<string, string>()
  for (const cell of rows.flatMap((r) => r.cells)) {
    const draft = drafts.get(cell.key)
    if (!draft) continue
    if (cell.shift && draft.supervisorId === cell.shift.supervisor.id && draft.officerId === cell.shift.officer.id) continue
    const problem = draftProblem(draft)
    if (problem) problems.set(cell.key, problem)
    else entries.push({ shiftDate: cell.shiftDate, shiftCode: cell.shiftCode, supervisorId: draft.supervisorId!, officerId: draft.officerId! })
  }
  return { entries, problems }
}

/** Drafts left after a save: only the saved cells are removed; edits in other weeks stay. */
export function removeSavedDrafts(drafts: Map<string, Draft>, saved: RosterEntryInput[]): Map<string, Draft> {
  const next = new Map(drafts)
  for (const e of saved) next.delete(cellKey(e.shiftDate, e.shiftCode))
  return next
}

/** How many drafts belong to cells outside the visible rows. */
export function draftsOutsideView(drafts: Map<string, Draft>, rows: RosterRow[]): number {
  const visible = new Set(rows.flatMap((r) => r.cells.map((c) => c.key)))
  let n = 0
  for (const k of drafts.keys()) if (!visible.has(k)) n += 1
  return n
}

/**
 * Whether a shift date is old enough that its shift has certainly ended. Simple, deliberately conservative rule:
 * strictly before yesterday in the app time zone (a night shift that started yesterday may still be running).
 * The server is the authority and still rejects edits to ended shifts for non-admins.
 */
export function cellHasEnded(shiftDate: string, now: Date, timeZone: string): boolean {
  return shiftDate < addDays(localDateString(now, timeZone), -1)
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function weekdayLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${DAY_NAMES[fromDateString(dateStr).getUTCDay()]} ${d}/${m}`
}
