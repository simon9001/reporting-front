import {
  SEVERITIES, SEVERITY_LABELS, settingsSchema,
  type EscalationRuleDto, type Settings, type Severity, type ShiftDefinitionDto,
} from '@sr/shared'
import { useState } from 'react'
import { useEscalationRules, useSettings, useShiftDefinitions, useUpdateEscalationRules, useUpdateSettings, useUpdateShiftDefinitions } from '../../api/config'
import { Alert, Button, Card, Field, Input, PageHeader, Spinner, Table, Textarea } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { formatEmailList, numberOrNull, parseEmailList, zodFieldErrors } from '../../lib/forms'

export function SettingsPage() {
  const defs = useShiftDefinitions()
  const rules = useEscalationRules()
  const settings = useSettings()
  const failed = defs.error ?? rules.error ?? settings.error
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Shift times, escalation rules and system settings." />
      {failed && <Alert>{errorMessage(failed)}</Alert>}
      {defs.data ? <ShiftTimesCard defs={defs.data} /> : !failed && <Spinner />}
      {rules.data ? <EscalationCard rules={rules.data} /> : !failed && <Spinner />}
      {settings.data ? <SystemSettingsCard settings={settings.data} /> : !failed && <Spinner />}
    </div>
  )
}

function ShiftTimesCard({ defs }: { defs: ShiftDefinitionDto[] }) {
  const update = useUpdateShiftDefinitions()
  const [rows, setRows] = useState(defs)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const change = (id: number, patch: Partial<ShiftDefinitionDto>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const save = async () => {
    try {
      await update.mutateAsync(rows.map(({ id, name, startTime, endTime }) => ({ id, name, startTime, endTime })))
      setMessage({ tone: 'success', text: 'Shift times saved. Shifts already on the roster keep their original times.' })
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    }
  }

  return (
    <Card title="Shift times" actions={<Button onClick={save} disabled={update.isPending}>Save shift times</Button>}>
      <div className="space-y-3">
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <Table head={['Code', 'Name', 'Start', 'End']}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
              <td className="px-3 py-2"><Input aria-label={`${r.code} name`} value={r.name} onChange={(e) => change(r.id, { name: e.target.value })} /></td>
              <td className="px-3 py-2"><Input aria-label={`${r.code} start`} type="time" value={r.startTime} onChange={(e) => change(r.id, { startTime: e.target.value })} /></td>
              <td className="px-3 py-2"><Input aria-label={`${r.code} end`} type="time" value={r.endTime} onChange={(e) => change(r.id, { endTime: e.target.value })} /></td>
            </tr>
          ))}
        </Table>
        <p className="text-xs text-slate-500">An end time earlier than the start time means the shift crosses midnight. Together the shifts must cover all 24 hours exactly once.</p>
      </div>
    </Card>
  )
}

function EscalationCard({ rules }: { rules: EscalationRuleDto[] }) {
  const update = useUpdateEscalationRules()
  const [rows, setRows] = useState(rules.map((r) => ({ ...r, within: r.withinMinutes === null ? '' : String(r.withinMinutes) })))
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const change = (severity: Severity, patch: Partial<(typeof rows)[number]>) =>
    setRows((rs) => rs.map((r) => (r.severity === severity ? { ...r, ...patch } : r)))

  const save = async () => {
    try {
      await update.mutateAsync(rows.map((r) => ({ severity: r.severity, isRequired: r.isRequired, notifyWho: r.notifyWho?.trim() || null, withinMinutes: numberOrNull(r.within) })))
      setMessage({ tone: 'success', text: 'Escalation rules saved.' })
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    }
  }

  return (
    <Card title="Escalation rules" actions={<Button onClick={save} disabled={update.isPending}>Save rules</Button>}>
      <div className="space-y-3">
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <Table head={['Severity', 'Must escalate', 'Notify (who)', 'Within (minutes)']}>
          {SEVERITIES.map((s) => {
            const r = rows.find((x) => x.severity === s)!
            return (
              <tr key={s}>
                <td className="px-3 py-2 font-medium">{SEVERITY_LABELS[s]}</td>
                <td className="px-3 py-2"><input type="checkbox" aria-label={`${s} must escalate`} checked={r.isRequired} onChange={(e) => change(s, { isRequired: e.target.checked })} /></td>
                <td className="px-3 py-2"><Input aria-label={`${s} notify`} value={r.notifyWho ?? ''} onChange={(e) => change(s, { notifyWho: e.target.value })} /></td>
                <td className="px-3 py-2"><Input aria-label={`${s} within`} inputMode="numeric" value={r.within} onChange={(e) => change(s, { within: e.target.value })} /></td>
              </tr>
            )
          })}
        </Table>
        <p className="text-xs text-slate-500">Leave "Within" empty for no time limit.</p>
      </div>
    </Card>
  )
}

function SystemSettingsCard({ settings }: { settings: Settings }) {
  const update = useUpdateSettings()
  const [deadline, setDeadline] = useState(String(settings.reportDeadlineMinutes))
  const [emails, setEmails] = useState(formatEmailList(settings.ddEmails))
  const [alertSeverities, setAlertSeverities] = useState<Severity[]>(settings.alertSeverities)
  const [recurringCount, setRecurringCount] = useState(String(settings.recurringCount))
  const [recurringDays, setRecurringDays] = useState(String(settings.recurringDays))
  const [longOpenShifts, setLongOpenShifts] = useState(String(settings.longOpenShifts))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaved(false)
    const parsed = settingsSchema.safeParse({
      reportDeadlineMinutes: numberOrNull(deadline),
      ddEmails: parseEmailList(emails),
      alertSeverities,
      recurringCount: numberOrNull(recurringCount),
      recurringDays: numberOrNull(recurringDays),
      longOpenShifts: numberOrNull(longOpenShifts),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
    setErrors({})
    try {
      await update.mutateAsync(parsed.data)
      setSaved(true)
    } catch (err) {
      setErrors({ _form: errorMessage(err) })
    }
  }

  const firstError = (prefix: string) => Object.entries(errors).find(([k]) => k === prefix || k.startsWith(`${prefix}.`))?.[1]

  return (
    <Card title="System settings" actions={<Button onClick={save} disabled={update.isPending}>Save settings</Button>}>
      <div className="grid gap-4 md:grid-cols-2">
        {errors._form && <div className="md:col-span-2"><Alert>{errors._form}</Alert></div>}
        {saved && <div className="md:col-span-2"><Alert tone="success">Settings saved.</Alert></div>}
        <Field label="Report due within (minutes after shift end)" error={firstError('reportDeadlineMinutes')}>
          <Input inputMode="numeric" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Deputy Director email addresses" error={firstError('ddEmails')} hint="One per line. Shift reports and alerts are sent here.">
          <Textarea rows={3} value={emails} onChange={(e) => setEmails(e.target.value)} />
        </Field>
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium text-slate-700">Email the Deputy Director immediately for</legend>
          {SEVERITIES.map((s) => (
            <label key={s} className="mr-4 inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={alertSeverities.includes(s)}
                onChange={(e) => setAlertSeverities((list) => (e.target.checked ? [...list, s] : list.filter((x) => x !== s)))}
              />
              {SEVERITY_LABELS[s]}
            </label>
          ))}
        </fieldset>
        <Field label="Recurring incident: how many times" error={firstError('recurringCount')}>
          <Input inputMode="numeric" value={recurringCount} onChange={(e) => setRecurringCount(e.target.value)} />
        </Field>
        <Field label="Recurring incident: within how many days" error={firstError('recurringDays')}>
          <Input inputMode="numeric" value={recurringDays} onChange={(e) => setRecurringDays(e.target.value)} />
        </Field>
        <Field label="Flag items still open after (shifts)" error={firstError('longOpenShifts')}>
          <Input inputMode="numeric" value={longOpenShifts} onChange={(e) => setLongOpenShifts(e.target.value)} />
        </Field>
      </div>
    </Card>
  )
}
