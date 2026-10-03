import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, passwordSchema, ROLE_LABELS, ROLES, updateUserSchema, type CreateUserInput, type Role, type UpdateUserResult, type UserDto } from '@sr/shared'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCreateUser, useResetPassword, useUpdateUser, useUsers } from '../../api/users'
import { DataTable } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { FilterBar } from '../../components/FilterBar'
import { Segmented } from '../../components/Segmented'
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select } from '../../components/ui'
import { ApiError, errorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import { applyServerErrors, zodFieldErrors } from '../../lib/forms'
import { useUrlFilters } from '../../lib/urlFilters'
import { filterUsers } from './userFilters'

export function UsersPage() {
  const users = useUsers()
  const { values, set, clear } = useUrlFilters(['q', 'role', 'status'])
  const rows = filterUsers(users.data ?? [], {
    q: values.q,
    role: values.role as Role | undefined,
    status: values.status as 'active' | 'inactive' | undefined,
  })
  const [editing, setEditing] = useState<UserDto | null>(null)
  const [resetting, setResetting] = useState<UserDto | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Officers, the Deputy Director and administrators who can sign in." />
      <CreateUserCard />
      {notice && <Alert tone="warning">{notice}</Alert>}
      {editing && <EditUserCard key={editing.id} user={editing} onDone={(result) => { setEditing(null); setNotice(result && result.futureShifts > 0 ? `${result.fullName} is still on ${result.futureShifts} upcoming shift(s). Reassign them on the Roster page.` : null) }} />}
      {resetting && <ResetPasswordCard key={resetting.id} user={resetting} onDone={() => setResetting(null)} />}
      <Card title="All users">
        <div className="space-y-4">
          <FilterBar search={values.q ?? ''} onSearchChange={(q) => set({ q: q || undefined })} placeholder="Search name or email…" canClear={!!(values.q || values.role || values.status)} onClear={clear}>
            <Segmented
              label="Role"
              value={values.role ?? ''}
              onChange={(v) => set({ role: v || undefined })}
              options={[{ value: '', label: 'All roles' }, ...ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))]}
            />
            <Segmented
              label="Status"
              value={values.status ?? ''}
              onChange={(v) => set({ status: v || undefined })}
              options={[{ value: '', label: 'Any' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            />
          </FilterBar>
          {users.isError && <Alert>{errorMessage(users.error)}</Alert>}
          <DataTable
            columns={[
              { key: 'name', header: 'Name', render: (u) => <span className="font-medium text-slate-900">{u.fullName}</span> },
              { key: 'email', header: 'Email', render: (u) => u.email },
              { key: 'role', header: 'Role', render: (u) => ROLE_LABELS[u.role] },
              { key: 'status', header: 'Status', render: (u) => <span className="flex flex-wrap gap-1">{u.isActive ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}{u.mustChangePassword && <Badge tone="amber">Must change password</Badge>}</span> },
              { key: 'login', header: 'Last sign-in', render: (u) => (u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—') },
              { key: 'actions', header: '', className: 'whitespace-nowrap text-right', render: (u) => <><Button variant="ghost" onClick={() => setEditing(u)}>Edit</Button><Button variant="ghost" onClick={() => setResetting(u)}>Reset password</Button></> },
            ]}
            rows={rows}
            rowKey={(u) => u.id}
            loading={users.isPending}
            empty={<EmptyState title="No users match" />}
          />
        </div>
      </Card>
    </div>
  )
}

function CreateUserCard() {
  const create = useCreateUser()
  const [saved, setSaved] = useState<string | null>(null)
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: '', email: '', role: 'OFFICER', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setSaved(null)
    try {
      const user = await create.mutateAsync(values)
      setSaved(`${user.fullName} added. Give them the temporary password; they must change it at first sign-in.`)
      form.reset()
    } catch (err) {
      applyServerErrors(err, form.setError)
    }
  })

  return (
    <Card title="Add user">
      <form onSubmit={onSubmit} noValidate aria-label="Add user" className="grid gap-4 md:grid-cols-2">
        {errors.root?.message && <div className="md:col-span-2"><Alert>{errors.root.message}</Alert></div>}
        {saved && <div className="md:col-span-2"><Alert tone="success">{saved}</Alert></div>}
        <Field label="Full name" error={errors.fullName?.message}><Input {...form.register('fullName')} /></Field>
        <Field label="Email" error={errors.email?.message}><Input type="email" {...form.register('email')} /></Field>
        <Field label="Role" error={errors.role?.message}>
          <Select {...form.register('role')}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </Field>
        <Field label="Temporary password" error={errors.password?.message} hint="At least 10 characters.">
          <Input type="text" autoComplete="off" {...form.register('password')} />
        </Field>
        <div className="md:col-span-2"><Button type="submit" disabled={isSubmitting}>Add user</Button></div>
      </form>
    </Card>
  )
}

function EditUserCard({ user, onDone }: { user: UserDto; onDone: (result?: UpdateUserResult) => void }) {
  const update = useUpdateUser()
  const [fullName, setFullName] = useState(user.fullName)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState<Role>(user.role)
  const [isActive, setIsActive] = useState(user.isActive)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = async () => {
    const parsed = updateUserSchema.safeParse({ fullName, email, role, isActive })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
    try {
      onDone(await update.mutateAsync({ id: user.id, ...parsed.data }))
    } catch (err) {
      setErrors({ ...(err instanceof ApiError ? err.fields : undefined), _form: errorMessage(err) })
    }
  }

  return (
    <Card title={`Edit ${user.fullName}`}>
      <div className="grid gap-4 md:grid-cols-2">
        {errors._form && <div className="md:col-span-2"><Alert>{errors._form}</Alert></div>}
        <Field label="Full name" error={errors.fullName}><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="Email" error={errors.email}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Role" error={errors.role}>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active (can sign in)
        </label>
        <div className="flex gap-2 md:col-span-2">
          <Button onClick={save} disabled={update.isPending}>Save</Button>
          <Button variant="secondary" onClick={() => onDone()}>Cancel</Button>
        </div>
      </div>
    </Card>
  )
}

function ResetPasswordCard({ user, onDone }: { user: UserDto; onDone: () => void }) {
  const reset = useResetPassword()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Invalid password')
    try {
      await reset.mutateAsync({ id: user.id, password })
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <Card title={`Reset password for ${user.fullName}`}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">They will be signed out everywhere and must choose a new password at next sign-in.</p>
        <Field label="Temporary password" error={error ?? undefined}><Input value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <div className="flex gap-2">
          <Button onClick={save} disabled={reset.isPending}>Reset password</Button>
          <Button variant="secondary" onClick={onDone}>Cancel</Button>
        </div>
      </div>
    </Card>
  )
}
