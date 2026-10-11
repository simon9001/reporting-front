import type { ShiftReportDto } from '@sr/shared'

type StatusInput = Pick<ShiftReportDto, 'status' | 'overdue' | 'submittedAt' | 'submittedBy' | 'timeliness' | 'lateMinutes'> & { content: { deadline: string } }
export type StatusTone = 'neutral' | 'danger' | 'success' | 'warning'

export const toneBadge = { neutral: 'slate', danger: 'red', success: 'green', warning: 'amber' } as const

const minutesText = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`)

export function reportStatusLine(r: StatusInput, now: Date, fmtTime: (iso: string) => string): { text: string; tone: StatusTone } {
  if (r.status === 'SUBMITTED') {
    const late = r.timeliness === 'LATE'
    return {
      text: `Submitted ${r.submittedAt ? fmtTime(r.submittedAt) : ''} by ${r.submittedBy?.fullName ?? '—'} · ${late ? `${r.lateMinutes} min late` : 'On time'}`,
      tone: late ? 'warning' : 'success',
    }
  }
  if (r.overdue) {
    const over = Math.max(1, Math.ceil((now.getTime() - Date.parse(r.content.deadline)) / 60_000))
    return { text: `Overdue by ${minutesText(over)}`, tone: 'danger' }
  }
  return { text: `Draft · due by ${fmtTime(r.content.deadline)}`, tone: 'neutral' }
}
