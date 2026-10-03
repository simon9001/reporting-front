import type { ShiftDefinitionDto } from '@sr/shared'
import type { RosterRow } from './rosterGrid'

export interface RosterListRow {
  key: string
  shiftDate: string
  shiftCode: string
  shiftName: string
  planned: boolean
  supervisor: string | null
  officer: string | null
  needsReassign: boolean
}

export function rosterListRows(rows: RosterRow[], defs: ShiftDefinitionDto[], f: { q?: string; shiftCode?: string; status?: 'planned' | 'unplanned' }): RosterListRow[] {
  const names = new Map(defs.map((d) => [d.code, d.name]))
  const q = f.q?.trim().toLowerCase()
  return rows.flatMap((r) => r.cells).map((c) => ({
    key: c.key,
    shiftDate: c.shiftDate,
    shiftCode: c.shiftCode,
    shiftName: names.get(c.shiftCode) ?? c.shiftCode,
    planned: !!c.shift,
    supervisor: c.shift?.supervisor.fullName ?? null,
    officer: c.shift?.officer.fullName ?? null,
    needsReassign: !!c.shift && (!c.shift.supervisor.rosterable || !c.shift.officer.rosterable),
  })).filter((r) =>
    (!q || `${r.supervisor ?? ''} ${r.officer ?? ''}`.toLowerCase().includes(q)) &&
    (!f.shiftCode || r.shiftCode === f.shiftCode) &&
    (!f.status || (f.status === 'planned') === r.planned),
  )
}
