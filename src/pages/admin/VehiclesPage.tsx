import { createVehicleSchema } from '@sr/shared'
import { useState } from 'react'
import { useCreateVehicle, useUpdateVehicle, useVehicles } from '../../api/config'
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Spinner, Table } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { zodFieldErrors } from '../../lib/forms'

export function VehiclesPage() {
  const vehicles = useVehicles()
  const create = useCreateVehicle()
  const update = useUpdateVehicle()
  const [unitId, setUnitId] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const add = async () => {
    const parsed = createVehicleSchema.safeParse({ unitId, description: description.trim() || null })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
    try {
      await create.mutateAsync(parsed.data)
      setUnitId('')
      setDescription('')
      setErrors({})
    } catch (err) {
      setErrors({ _form: errorMessage(err) })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mobile weighbridge vehicles" description="Registered vehicles / units, so every check uses the same ID." />
      <Card title="Add vehicle">
        <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
          <Field label="Vehicle / unit ID" error={errors.unitId}><Input value={unitId} onChange={(e) => setUnitId(e.target.value)} placeholder="KDG 143S" /></Field>
          <Field label="Description" error={errors.description}><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <Button onClick={add} disabled={create.isPending}>Add</Button>
        </div>
        {errors._form && <div className="mt-3"><Alert>{errors._form}</Alert></div>}
      </Card>
      <Card title="Vehicles">
        {vehicles.isPending ? <Spinner /> : vehicles.isError ? <Alert>{errorMessage(vehicles.error)}</Alert> : (
          <Table head={['ID', 'Description', 'Status', '']}>
            {vehicles.data.map((v) => (
              <tr key={v.id}>
                <td className="px-3 py-2 font-medium">{v.unitId}</td>
                <td className="px-3 py-2">{v.description ?? '—'}</td>
                <td className="px-3 py-2">{v.isActive ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}</td>
                <td className="px-3 py-2 text-right">
                  <Button variant="ghost" onClick={() => update.mutate({ id: v.id, isActive: !v.isActive })}>{v.isActive ? 'Deactivate' : 'Reactivate'}</Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}
