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
    <div className="relative flex min-h-dvh items-center justify-center bg-asphalt-900 bg-cover bg-center p-4" style={{ backgroundImage: "url('/kenha-roads.webp')" }}>
      <div className="absolute inset-0 bg-asphalt-900/45" aria-hidden />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1.5 bg-highway-400" aria-hidden />
        <div className="px-8 pb-8 pt-7">
          <img src="/kenha-logo.png" alt="KeNHA" className="mx-auto h-24 w-auto" />
          <form onSubmit={onSubmit} noValidate aria-label="Change password" className="mt-6 space-y-4">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-asphalt-900">Change your password</h1>
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
      </div>
    </div>
  )
}
