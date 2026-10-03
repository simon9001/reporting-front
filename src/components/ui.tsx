import type { ComponentProps, ReactNode } from 'react'

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-slate-700 hover:bg-slate-100',
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ComponentProps<'button'> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cx('inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50', buttonVariants[variant], className)}
      {...props}
    />
  )
}

const control = 'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:bg-slate-100'

export const Input = ({ className, ...props }: ComponentProps<'input'>) => <input className={cx(control, className)} {...props} />
export const Select = ({ className, ...props }: ComponentProps<'select'>) => <select className={cx(control, className)} {...props} />
export const Textarea = ({ className, ...props }: ComponentProps<'textarea'>) => <textarea className={cx(control, className)} {...props} />

/** Label wraps only the title and the control, so the control's accessible name is exactly `label`. */
export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {children}
      </label>
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

type Tone = 'slate' | 'green' | 'amber' | 'red' | 'blue'
const tones: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-brand-100 text-brand-800',
}

export function Badge({ tone = 'slate', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', tones[tone], className)}>{children}</span>
}

const alertTones = {
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-brand-100 bg-brand-50 text-brand-800',
  success: 'border-green-200 bg-green-50 text-green-800',
}

export function Alert({ tone = 'error', children }: { tone?: keyof typeof alertTones; children: ReactNode }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={cx('rounded-md border px-3 py-2 text-sm', alertTones[tone])}>{children}</div>
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <p className="p-4 text-sm text-slate-500" role="status">{label}</p>
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-brand-800 text-left text-xs uppercase tracking-wide text-white">
          <tr>{head.map((h, i) => <th key={i} className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}
