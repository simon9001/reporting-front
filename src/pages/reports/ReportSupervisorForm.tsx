import { OVERALL_STATUS_LABELS, OVERALL_STATUSES, REPORT_CONFIRMATIONS, REPORT_TEXT_FIELDS, REPORT_TEXT_LABELS, REPORT_TEXT_MAX, reportSubmitProblems, type OverallStatus, type ReportFieldsDto, type ShiftReportDto } from '@sr/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useSaveReport, useSubmitReport } from '../../api/reports'
import { Drawer } from '../../components/Drawer'
import { Segmented } from '../../components/Segmented'
import { Alert, Button, Card, Field, Textarea } from '../../components/ui'
import { ApiError, errorMessage } from '../../lib/api'
import { createAutosave, type SaveState } from '../../lib/autosave'
import { formatDate, formatTime } from '../../lib/format'
import { useNow } from '../../lib/useNow'

/**
 * Editable while DRAFT for the shift's officer; autosaves 1s after typing stops; Submit flushes (and awaits) any save first.
 * Leaving the page still saves pending edits (the save outlives the form), and the browser warns before closing with unsaved edits.
 */
export function ReportSupervisorForm({ report, onReload }: { report: ShiftReportDto; onReload: () => void }) {
  const [fields, setFields] = useState<ReportFieldsDto>(report.fields)
  const [state, setState] = useState<SaveState>('idle')
  const [confirming, setConfirming] = useState(false)
  const [problems, setProblems] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fieldsRef = useRef(fields)
  const save = useSaveReport()
  const submit = useSubmitReport()
  const qc = useQueryClient()
  const shiftId = report.shiftId
  const reportId = report.id
  const { mutateAsync } = save
  const now = useNow()
  // Submit opens 30 min before the shift ends; `now` keeps the button live without a reload (the server enforces it too).
  const submitOpen = report.canSubmit || now >= new Date(report.submitOpensAt)

  const [autosave] = useState(() =>
    createAutosave<ReportFieldsDto>({
      baseline: report.updatedAt,
      onState: setState,
      isConflict: (e) => e instanceof ApiError && e.status === 409,
      save: async (f, baseline) => {
        const saved = await mutateAsync({ shiftId, body: { ...f, updatedAt: baseline } })
        // Keep the cache fresh so remounting the page never starts from stale text or a stale updatedAt;
        // cancel any in-flight fetch first so an older response cannot overwrite it.
        await qc.cancelQueries({ queryKey: ['report', reportId] })
        qc.setQueryData(['report', reportId], saved)
        return saved
      },
    }),
  )
  useEffect(() => () => {
    autosave.dispose()
    void autosave.flush() // the mutation outlives the component, so edits made just before leaving are kept
  }, [autosave])
  const unsaved = state === 'pending' || state === 'saving'
  useEffect(() => {
    if (!unsaved) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  const change = (patch: Partial<ReportFieldsDto>) => {
    const next = { ...fieldsRef.current, ...patch }
    fieldsRef.current = next
    setFields(next)
    autosave.change(next)
    setProblems((p) => Object.fromEntries(Object.entries(p).filter(([k]) => !(k in patch))))
  }

  const askSubmit = async () => {
    setSubmitError(null)
    const p = reportSubmitProblems(fieldsRef.current)
    setProblems(p)
    if (Object.keys(p).length > 0) return
    if (await autosave.flush()) setConfirming(true)
  }
  const doSubmit = async () => {
    try {
      if (!(await autosave.flush())) {
        setConfirming(false)
        setSubmitError('Your latest changes could not be saved, so the report was not submitted.')
        return
      }
      await submit.mutateAsync(shiftId)
      setConfirming(false)
    } catch (e) {
      setConfirming(false)
      if (e instanceof ApiError && e.fields) setProblems(e.fields)
      setSubmitError(errorMessage(e))
    }
  }

  const shiftLabel = `${report.content.shift.shiftName} shift report for ${formatDate(report.content.shift.shiftDate)}`
  return (
    <Card
      title="Officer's report"
      actions={<span role="status" className="text-xs text-slate-500">{state === 'pending' ? 'Unsaved changes' : state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Not saved — will retry when you edit' : ''}</span>}
    >
      <div className="space-y-4">
        {state === 'conflict' && (
          <Alert tone="warning">
            <span className="flex flex-wrap items-center gap-2">This report was updated elsewhere. <Button variant="secondary" onClick={onReload}>Reload draft</Button></span>
          </Alert>
        )}
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-asphalt-800">Overall status</p>
          <Segmented<OverallStatus>
            label="Overall status"
            value={(fields.overallStatus ?? '') as OverallStatus}
            onChange={(v) => change({ overallStatus: v })}
            options={OVERALL_STATUSES.map((s) => ({ value: s, label: OVERALL_STATUS_LABELS[s] }))}
          />
          {problems.overallStatus && <p role="alert" className="text-xs font-medium text-red-600">{problems.overallStatus}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {REPORT_TEXT_FIELDS.map((k) => (
            <div key={k} className={k === 'overview' ? 'md:col-span-2' : undefined}>
              <Field label={REPORT_TEXT_LABELS[k]} error={problems[k]} hint={`${(fields[k] ?? '').length} / ${REPORT_TEXT_MAX}`}>
                <Textarea rows={k === 'overview' ? 4 : 3} maxLength={REPORT_TEXT_MAX} value={fields[k] ?? ''} onChange={(e) => change({ [k]: e.target.value })} />
              </Field>
            </div>
          ))}
        </div>
        <fieldset className="space-y-2">
          <legend className="text-[13px] font-medium text-asphalt-800">Accountability</legend>
          {REPORT_CONFIRMATIONS.map((c) => (
            <div key={c.key}>
              <label className="flex items-start gap-2 text-[13px] text-slate-700">
                <input type="checkbox" className="mt-0.5 size-4 accent-asphalt-800" checked={fields[c.key]} onChange={(e) => change({ [c.key]: e.target.checked })} />
                {c.label}
              </label>
              {problems[c.key] && <p role="alert" className="ml-6 text-xs font-medium text-red-600">{problems[c.key]}</p>}
            </div>
          ))}
        </fieldset>
        {submitError && <Alert>{submitError}</Alert>}
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {!submitOpen && <p className="text-xs text-slate-500">You can submit from {formatTime(report.submitOpensAt)} (30 minutes before the shift ends).</p>}
          <Button onClick={() => void askSubmit()} disabled={!submitOpen || submit.isPending || state === 'conflict'}>Submit report</Button>
        </div>
      </div>
      <Drawer
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Submit report"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button onClick={() => void doSubmit()} disabled={submit.isPending}>{submit.isPending ? 'Submitting…' : 'Yes, submit'}</Button>
          </div>
        }
      >
        <p className="text-[13px] text-slate-700">Submit the {shiftLabel}? It is emailed to the Deputy Director and cannot be changed afterwards.</p>
      </Drawer>
    </Card>
  )
}
