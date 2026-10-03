import { zodResolver } from '@hookform/resolvers/zod'
import { passwordSchema } from '@sr/shared'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { Alert, Button, Field, Input } from '../components/ui'
import { applyServerErrors } from '../lib/forms'
import { useChangePassword, useMe } from './hooks'

const formSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
type FormValues = z.infer<typeof formSchema>

export function ChangePasswordPage() {
  const me = useMe()
  const change = useChangePassword()
  const navigate = useNavigate()
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })
  const { errors, isSubmitting } = form.formState
  const forced = me.data?.user.mustChangePassword ?? false

  const onSubmit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await change.mutateAsync({ currentPassword, newPassword })
      navigate('/', { replace: true })
    } catch (err) {
      applyServerErrors(err, form.setError)
    }
  })

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <form onSubmit={onSubmit} noValidate aria-label="Change password" className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-brand-800">Change your password</h1>
        {forced && <Alert tone="info">You must choose a new password before you continue.</Alert>}
        {errors.root?.message && <Alert>{errors.root.message}</Alert>}
        <Field label="Current password" error={errors.currentPassword?.message}>
          <Input type="password" autoComplete="current-password" {...form.register('currentPassword')} />
        </Field>
        <Field label="New password" error={errors.newPassword?.message}>
          <Input type="password" autoComplete="new-password" {...form.register('newPassword')} />
        </Field>
        <Field label="Confirm new password" error={errors.confirmPassword?.message}>
          <Input type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
        </Field>
        <p className="text-xs text-slate-500">At least 10 characters.</p>
        <Button type="submit" className="w-full" disabled={isSubmitting}>Change password</Button>
      </form>
    </div>
  )
}
