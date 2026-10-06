import {
  INCIDENT_SIDE_LABELS, INCIDENT_STATUS_LABELS, INCIDENT_STATUSES, incidentInputSchema, LINK_STATUS_LABELS, LINK_STATUSES,
  MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS_PER_INCIDENT, SEVERITIES, SEVERITY_LABELS, VEHICLE_STATUS_LABELS, VEHICLE_STATUSES,
  type IncidentDto, type IncidentStatus, type LinkStatus, type Severity, type VehicleStatus,
} from '@sr/shared'
import { ImagePlus, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useEscalationRules, useLookups, useVehicles } from '../../api/config'
import { useSaveIncident, useUploadSnapshots } from '../../api/incidents'
import { useMe } from '../../auth/hooks'
import { SideBadge } from '../../components/badges'
import { Drawer } from '../../components/Drawer'
import { Segmented } from '../../components/Segmented'
import { Alert, Button, Field, Input, Select, Textarea } from '../../components/ui'
import { ApiError, errorMessage } from '../../lib/api'
import { WeighbridgeChoice } from './WeighbridgeChoice'
import { formatDateTime } from '../../lib/format'
import { zodFieldErrors } from '../../lib/forms'
import { defaultOccurredAt, emptyForm, escalationHint, formFromIncident, formToInput, isResolved, mergeSnapshots, type IncidentFormState } from './incidentForm'

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'

export function IncidentFormDrawer({ open, onClose, incident: incidentProp, onSaved }: {
  open: boolean
  onClose: () => void
  incident?: IncidentDto
  onSaved: (dto: IncidentDto) => void
}) {
  // After a create whose uploads failed, the form switches to editing the saved incident so it can never POST twice.
  const [savedOnce, setSavedOnce] = useState<IncidentDto | null>(null)
  const incident = savedOnce ?? incidentProp
  const { data: me } = useMe()
  const newForm = () => emptyForm(defaultOccurredAt(me, new Date().toISOString()))
  const locations = useLookups('LOCATION')
  const categories = useLookups('CATEGORY')
  const platforms = useLookups('PLATFORM')
  const vehicles = useVehicles()
  const rules = useEscalationRules()
  const save = useSaveIncident()
  const upload = useUploadSnapshots()
  const placesListId = useId()
  const [form, setForm] = useState<IncidentFormState>(() => (incident ? formFromIncident(incident) : newForm()))
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [loadedAt, setLoadedAt] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(incidentProp ? formFromIncident(incidentProp) : newForm())
    setFiles([])
    setErrors({})
    setNotice(null)
    setSavedOnce(null)
    setLoadedAt(incidentProp?.updatedAt ?? null)
    // reset only when the drawer opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const changedUnderneath = !!incidentProp && !!loadedAt && incidentProp.updatedAt !== loadedAt
  const set = <K extends keyof IncidentFormState>(k: K, v: IncidentFormState[K]) => setForm((f) => ({ ...f, [k]: v }))
  const activeOrCurrent = <T extends { id: number; isActive: boolean }>(items: T[] | undefined, current: string) =>
    (items ?? []).filter((x) => x.isActive || String(x.id) === current)
  // Places a typed mobile location can resolve to: active ones, plus the one already stored on this incident.
  const placeOptions = (locations.data ?? []).filter((l) => l.isActive || l.id === incident?.location?.id)

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const { files: next, problems } = mergeSnapshots(incident?.attachments.length ?? 0, files, Array.from(list), MAX_ATTACHMENTS_PER_INCIDENT, MAX_ATTACHMENT_BYTES)
    setFiles(next)
    setErrors((e) => ({ ...e, files: problems.join(' · ') }))
  }

  const submit = async () => {
    setNotice(null)
    const input = formToInput(form, placeOptions)
    const parsed = incidentInputSchema.safeParse(input)
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
    setErrors({})
    let saved: IncidentDto
    try {
      saved = await save.mutateAsync({ id: incident?.id, body: input })
    } catch (err) {
      return setErrors({ ...(err instanceof ApiError ? err.fields : undefined), _form: errorMessage(err) })
    }
    if (files.length > 0) {
      try {
        await upload.mutateAsync({ incidentId: saved.id, files })
      } catch (err) {
        const detail = err instanceof ApiError && err.fields ? Object.entries(err.fields).map(([n, m]) => `${n}: ${m}`).join(' · ') : errorMessage(err)
        setFiles([])
        if (!incidentProp) setSavedOnce(saved)
        setLoadedAt(saved.updatedAt)
        return setNotice(`${saved.ref} was saved, but some snapshots were not added — ${detail}. You can add them again from the incident.`)
      }
    }
    setLoadedAt(saved.updatedAt)
    onSaved(saved)
  }

  const rule = rules.data?.find((r) => r.severity === form.severity)
  const late = me?.user.role === 'OFFICER' ? me.previousShift : null
  const timeHint = late ? `Late entries for the ${late.shiftName.toLowerCase()} shift can go back to ${formatDateTime(late.startsAt)}` : undefined
  const hint = escalationHint(rule, form.severity)
  const mobile = form.side === 'MOBILE'

  const whenField = (
    <Field label="Date and time" error={errors.occurredAt} hint={timeHint}>
      <Input type="datetime-local" value={form.occurredAt} onChange={(e) => set('occurredAt', e.target.value)} />
    </Field>
  )
  const categoryField = (
    <Field label="Category" error={errors.categoryId}>
      <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
        <option value="">Choose…</option>
        {activeOrCurrent(categories.data, form.categoryId).map((c) => <option key={c.id} value={c.id}>{c.value}</option>)}
      </Select>
    </Field>
  )
  const severityField = (
    <div className="space-y-1.5 sm:col-span-2">
      <p className="text-sm font-medium text-slate-700">Severity</p>
      <Segmented<Severity | ''> label="Severity" value={form.severity} onChange={(v) => set('severity', v)} options={[...SEVERITIES].map((s) => ({ value: s, label: SEVERITY_LABELS[s] }))} />
      {errors.severity && <p role="alert" className="text-xs font-medium text-red-600">{errors.severity}</p>}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
  const linkSelect = (label: string, key: 'gpsStatus' | 'dashcamStatus') => (
    <Field label={label} error={errors[key]}>
      <Select value={form[key]} onChange={(e) => set(key, e.target.value as LinkStatus | '')}>
        <option value="">Choose…</option>
        {LINK_STATUSES.map((s) => <option key={s} value={s}>{LINK_STATUS_LABELS[s]}</option>)}
      </Select>
    </Field>
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      wide
      title={incident ? `Edit ${incident.ref}` : 'Log incident'}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending || upload.isPending}>{save.isPending || upload.isPending ? 'Saving…' : 'Save incident'}</Button>
        </div>
      }
    >
      <form className="space-y-6" noValidate onSubmit={(e) => { e.preventDefault(); void submit() }}>
        {changedUnderneath && (
          <Alert tone="warning">
            Someone else updated this incident while you were editing.{' '}
            <button type="button" className="font-semibold underline" onClick={() => { if (incidentProp) { setForm(formFromIncident(incidentProp)); setLoadedAt(incidentProp.updatedAt) } }}>Load latest</button>
          </Alert>
        )}
        {errors._form && <Alert>{errors._form}</Alert>}
        {errors.side && <Alert>{errors.side}</Alert>}
        {notice && <Alert tone="warning">{notice}</Alert>}

        {incident ? (
          <p className="flex items-center gap-2 text-sm text-slate-600"><SideBadge side={form.side} />{INCIDENT_SIDE_LABELS[form.side]} incident</p>
        ) : (
          <WeighbridgeChoice value={form.side} onChange={(v) => { set('side', v); setErrors({}) }} />
        )}

        {mobile ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2">
              {whenField}
              <Field label="Vehicle / unit" error={errors.vehicleId}>
                <Select value={form.vehicleId} onChange={(e) => set('vehicleId', e.target.value)}>
                  <option value="">Choose…</option>
                  {activeOrCurrent(vehicles.data, form.vehicleId).map((v) => <option key={v.id} value={v.id}>{v.unitId}{v.description ? ` — ${v.description}` : ''}</option>)}
                </Select>
              </Field>
              <Field label="Location" error={errors.locationText ?? errors.locationId} hint="Pick a listed place or type where the unit is">
                <Input list={placesListId} autoComplete="off" value={form.place} onChange={(e) => set('place', e.target.value)} />
              </Field>
              <datalist id={placesListId}>{(locations.data ?? []).filter((l) => l.isActive).map((l) => <option key={l.id} value={l.value} />)}</datalist>
              <Field label="Vehicle status" error={errors.vehicleStatus}>
                <Select value={form.vehicleStatus} onChange={(e) => set('vehicleStatus', e.target.value as VehicleStatus | '')}>
                  <option value="">Choose…</option>
                  {VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{VEHICLE_STATUS_LABELS[s]}</option>)}
                </Select>
              </Field>
              {linkSelect('GPS status', 'gpsStatus')}
              {linkSelect('Dashcam status', 'dashcamStatus')}
              <Field label="Platform" error={errors.platformId}>
                <Select value={form.platformId} onChange={(e) => set('platformId', e.target.value)}>
                  <option value="">Choose…</option>
                  {activeOrCurrent(platforms.data, form.platformId).map((p) => <option key={p.id} value={p.id}>{p.value}</option>)}
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Event / incident" error={errors.description}>
                  <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Action taken" error={errors.immediateAction}>
                  <Textarea rows={2} value={form.immediateAction} onChange={(e) => set('immediateAction', e.target.value)} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Remarks" error={errors.remarks}>
                  <Textarea rows={2} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
                </Field>
              </div>
            </section>
            <section className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
              <h3 className="text-sm font-semibold text-slate-800 sm:col-span-2">Tracking</h3>
              {categoryField}
              {severityField}
            </section>
          </>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2">
            {whenField}
            <Field label="Location" error={errors.locationId}>
              <Select value={form.locationId} onChange={(e) => set('locationId', e.target.value)}>
                <option value="">Choose…</option>
                {activeOrCurrent(locations.data, form.locationId).map((l) => <option key={l.id} value={l.id}>{l.value}</option>)}
              </Select>
            </Field>
            {categoryField}
            <Field label="Location detail" error={errors.locationDetail} hint="Optional, e.g. camera number">
              <Input value={form.locationDetail} onChange={(e) => set('locationDetail', e.target.value)} />
            </Field>
            {severityField}
            <div className="sm:col-span-2">
              <Field label="Description" error={errors.description}>
                <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Immediate action" error={errors.immediateAction}>
                <Textarea rows={2} value={form.immediateAction} onChange={(e) => set('immediateAction', e.target.value)} />
              </Field>
            </div>
          </section>
        )}

        <section className="grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
          <Field label="Notified / escalated to" error={errors.escalatedTo}>
            <Input value={form.escalatedTo} onChange={(e) => set('escalatedTo', e.target.value)} />
          </Field>
          <Field label="Escalated at" error={errors.escalatedAt}>
            <Input type="datetime-local" value={form.escalatedAt} onChange={(e) => set('escalatedAt', e.target.value)} />
          </Field>
          <Field label="Assigned to" error={errors.assignedTo}>
            <Input value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} />
          </Field>
        </section>

        <section className="grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
          <Field label="Status" error={errors.status}>
            <Select value={form.status} onChange={(e) => set('status', e.target.value as IncidentStatus)}>
              {INCIDENT_STATUSES.map((s) => <option key={s} value={s}>{INCIDENT_STATUS_LABELS[s]}</option>)}
            </Select>
          </Field>
          {isResolved(form.status) && (
            <Field label="Resolved at" error={errors.resolvedAt}>
              <Input type="datetime-local" value={form.resolvedAt} onChange={(e) => set('resolvedAt', e.target.value)} />
            </Field>
          )}
          <div className={isResolved(form.status) ? '' : 'sm:col-span-2'}>
            <Field label="Resolution" error={errors.resolution} hint="How it was resolved, or what the next shift needs to know">
              <Input value={form.resolution} onChange={(e) => set('resolution', e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="space-y-2 border-t border-line pt-5">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-6 text-sm text-slate-600 hover:border-asphalt-800 hover:bg-highway-50">
            <ImagePlus className="size-5 text-slate-400" aria-hidden />
            <span>Add snapshots <span className="text-slate-400">(photos, screenshots or PDF · up to 10 MB each)</span></span>
            <input type="file" multiple accept={ACCEPT} className="sr-only" aria-label="Add snapshots" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
          </label>
          {errors.files && <p role="alert" className="text-xs font-medium text-red-600">{errors.files}</p>}
          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {files.map((f, idx) => (
                <li key={`${f.name}-${idx}`} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-xs text-slate-700">
                  {f.name}
                  <button type="button" aria-label={`Remove ${f.name}`} className="rounded-full p-0.5 hover:bg-slate-200" onClick={() => setFiles(files.filter((_, j) => j !== idx))}><X className="size-3" /></button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </form>
    </Drawer>
  )
}
