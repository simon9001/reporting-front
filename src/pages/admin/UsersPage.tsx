import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, passwordSchema, ROLE_LABELS, ROLES, updateUserSchema, type CreateUserInput, type Role, type UpdateUserResult, type UserDto } from '@sr/shared'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCreateUser, useResetPassword, useUpdateUser, useUsers } from '../../api/users'
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Spinner, Table } from '../../components/ui'
import { ApiError, errorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import { applyServerErrors, zodFieldErrors } from '../../lib/forms'

export function UsersPage() {
  const users = useUsers()
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
        {users.isPending ? <Spinner /> : users.isError ? <Alert>{errorMessage(users.error)}</Alert> : (
          <Table head={['Name', 'Email', 'Role', 'Status', 'Last sign-in', '']}>
            {users.data.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2 font-medium">{u.fullName}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{ROLE_LABELS[u.role]}</td>
                <td className="px-3 py-2">
                  {u.isActive ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}{' '}
                  {u.mustChangePassword && <Badge tone="amber">Must change password</Badge>}
                </td>
                <td className="px-3 py-2">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <Button variant="ghost" onClick={() => setEditing(u)}>Edit</Button>
                  <Button variant="ghost" onClick={() => setResetting(u)}>Reset password</Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
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
