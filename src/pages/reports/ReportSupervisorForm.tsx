import { OVERALL_STATUS_LABELS, OVERALL_STATUSES, REPORT_CONFIRMATIONS, REPORT_TEXT_FIELDS, REPORT_TEXT_LABELS, REPORT_TEXT_MAX, reportSubmitProblems, type OverallStatus, type ReportFieldsDto, type ShiftReportDto } from '@sr/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSaveReport, useSubmitReport } from '../../api/reports'
import { Drawer } from '../../components/Drawer'
import { Segmented } from '../../components/Segmented'
import { Alert, Button, Card, Field, Textarea } from '../../components/ui'
import { ApiError, errorMessage } from '../../lib/api'
import { formatDate } from '../../lib/format'

type SaveState = 'idle' | 'saving' | 'saved' | 'conflict' | 'error'

/** Editable while DRAFT for the shift's supervisor; autosaves 1s after typing stops; Submit flushes the pending save first. */
export function ReportSupervisorForm({ report, onReload }: { report: ShiftReportDto; onReload: () => void }) {
  const [fields, setFields] = useState<ReportFieldsDto>(report.fields)
  const [state, setState] = useState<SaveState>('idle')
  const [confirming, setConfirming] = useState(false)
  const [problems, setProblems] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fieldsRef = useRef(fields)
  const baseline = useRef(report.updatedAt)
  const dirty = useRef(false)
  const save = useSaveReport()
  const submit = useSubmitReport()
  const shiftId = report.shiftId

  const change = (patch: Partial<ReportFieldsDto>) => {
    const next = { ...fieldsRef.current, ...patch }
    fieldsRef.current = next
    dirty.current = true
    setFields(next)
    setProblems((p) => Object.fromEntries(Object.entries(p).filter(([k]) => !(k in patch))))
  }

  const flush = useCallback(async (): Promise<boolean> => {
    if (!dirty.current) return true
    dirty.current = false
    setState('saving')
    try {
      const saved = await save.mutateAsync({ shiftId, body: { ...fieldsRef.current, updatedAt: baseline.current } })
      baseline.current = saved.updatedAt
      setState('saved')
      return true
    } catch (e) {
      dirty.current = true
      setState(e instanceof ApiError && e.status === 409 ? 'conflict' : 'error')
      return false
    }
  }, [save, shiftId])

  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(() => void flush(), 1000)
    return () => clearTimeout(t)
  }, [fields, flush])

  const askSubmit = async () => {
    setSubmitError(null)
    const p = reportSubmitProblems(fieldsRef.current)
    setProblems(p)
    if (Object.keys(p).length > 0) return
    if (await flush()) setConfirming(true)
  }
  const doSubmit = async () => {
    try {
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
      title="Supervisor's report"
      actions={<span role="status" className="text-xs text-slate-500">{state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Not saved — retrying when you type' : ''}</span>}
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
        <div className="flex justify-end">
          <Button onClick={() => void askSubmit()} disabled={submit.isPending || state === 'conflict'}>Submit report</Button>
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
