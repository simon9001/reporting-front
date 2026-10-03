import { createLookupSchema, LOOKUP_TYPE_LABELS, LOOKUP_TYPES, type LookupType } from '@sr/shared'
import { useState } from 'react'
import { useCreateLookup, useLookups, useUpdateLookup } from '../../api/config'
import { Alert, Badge, Button, Card, cx, Field, Input, PageHeader, Spinner, Table } from '../../components/ui'
import { errorMessage } from '../../lib/api'

export function LookupsPage() {
  const [listType, setListType] = useState<LookupType>('CATEGORY')
  const items = useLookups(listType)
  const create = useCreateLookup()
  const update = useUpdateLookup()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const add = async () => {
    const parsed = createLookupSchema.safeParse({ listType, value })
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Invalid value')
    try {
      await create.mutateAsync(parsed.data)
      setValue('')
      setError(null)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Lists" description="The choices offered in dropdowns. Retired values are deactivated, never deleted, so old records stay correct." />
      <div className="flex flex-wrap gap-2" role="tablist">
        {LOOKUP_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === listType}
            onClick={() => setListType(t)}
            className={cx('rounded-full px-3 py-1 text-sm', t === listType ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-300')}
          >
            {LOOKUP_TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <Card title={LOOKUP_TYPE_LABELS[listType]}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-60 flex-1">
              <Field label="New value" error={error ?? undefined}><Input value={value} onChange={(e) => setValue(e.target.value)} /></Field>
            </div>
            <Button onClick={add} disabled={create.isPending}>Add</Button>
          </div>
          {update.isError && <Alert>{errorMessage(update.error)}</Alert>}
          {items.isPending ? <Spinner /> : items.isError ? <Alert>{errorMessage(items.error)}</Alert> : (
            <Table head={['Value', 'Order', 'Status', '']}>
              {items.data.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{item.value}</td>
                  <td className="px-3 py-2">{item.sortOrder}</td>
                  <td className="px-3 py-2">{item.isActive ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}</td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" onClick={() => update.mutate({ id: item.id, isActive: !item.isActive })}>
                      {item.isActive ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}
