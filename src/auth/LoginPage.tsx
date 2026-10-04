import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@sr/shared'
import { ShieldCheck } from 'lucide-react'
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
    <div className="grid min-h-full lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-linear-to-br from-brand-600 to-brand-800 p-10 text-white lg:flex">
        <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-5" />Control Room</div>
        <div>
          <p className="text-3xl font-semibold leading-tight">Operations, incidents &amp; shift reporting</p>
          <p className="mt-3 max-w-md text-brand-100">Log incidents as they happen, hand over cleanly, and give management a live view of every shift.</p>
        </div>
        <p className="text-xs text-brand-200">Authorised personnel only</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} noValidate aria-label="Sign in" className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
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
      </div>
    </div>
  )
}
