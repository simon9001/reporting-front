import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@sr/shared'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import { Alert, Button, Field, Input } from '../components/ui'
import { errorMessage } from '../lib/api'
import { useLogin } from './hooks'

export function LoginPage() {
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/', { replace: true })
    } catch (err) {
      form.setError('root', { message: errorMessage(err) })
    }
  })

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <form onSubmit={onSubmit} noValidate aria-label="Sign in" className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-brand-800">Control Room Reporting</h1>
          <p className="text-sm text-slate-600">Sign in to continue</p>
        </div>
        {errors.root?.message && <Alert>{errors.root.message}</Alert>}
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="username" {...form.register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...form.register('password')} />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>Sign in</Button>
      </form>
    </div>
  )
}
