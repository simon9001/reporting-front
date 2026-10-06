import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@sr/shared'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import { Alert, Button, Field, Input } from '../components/ui'
import { errorMessage } from '../lib/api'
import { loginRedirectTarget } from './authGate'
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
      navigate(loginRedirectTarget(location.state), { replace: true })
    } catch (err) {
      form.setError('root', { message: errorMessage(err) })
    }
  })

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-asphalt-900 bg-cover bg-center p-4" style={{ backgroundImage: "url('/kenha-roads.webp')" }}>
      <div className="absolute inset-0 bg-asphalt-900/45" aria-hidden />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1.5 bg-highway-400" aria-hidden />
        <div className="px-8 pb-8 pt-7">
          <img src="/kenha-logo.png" alt="KeNHA" className="mx-auto h-24 w-auto" />
          <form onSubmit={onSubmit} noValidate aria-label="Sign in" className="mt-6 space-y-5">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-asphalt-900">Sign in to Control Room</h1>
              <p className="mt-1 text-sm text-slate-500">Use the email and password given by your administrator.</p>
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
          <p className="mt-6 text-center text-xs text-slate-500">Kenya National Highways Authority · Authorised personnel only</p>
        </div>
      </div>
    </div>
  )
}
