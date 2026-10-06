import type { ComponentProps, ReactNode } from 'react'

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost'
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-asphalt-800 text-white shadow-sm hover:bg-asphalt-700',
  accent: 'bg-highway-400 text-asphalt-900 shadow-sm hover:bg-highway-500',
  secondary: 'border border-silver-200 bg-white text-asphalt-800 shadow-sm hover:bg-silver-100',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  ghost: 'text-slate-600 hover:bg-silver-100 hover:text-asphalt-800',
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ComponentProps<'button'> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold transition duration-200 active:translate-y-px active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:focus-halo',
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  )
}

export function IconButton({ label, className, type = 'button', ...props }: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx('inline-flex size-9 items-center justify-center rounded-[10px] text-slate-500 transition duration-200 hover:bg-silver-100 hover:text-asphalt-800 active:scale-95 [&_svg]:size-4', className)}
      {...props}
    />
  )
}

const control = 'block h-10 w-full rounded-[10px] border border-silver-200 bg-white px-3 text-sm text-asphalt-800 shadow-sm transition duration-200 placeholder:text-slate-400 focus:border-asphalt-800 focus:outline-none focus:ring-2 focus:ring-highway-400/70 disabled:bg-silver-100 disabled:text-slate-500'

export const Input = ({ className, ...props }: ComponentProps<'input'>) => <input className={cx(control, className)} {...props} />
export const Select = ({ className, ...props }: ComponentProps<'select'>) => <select className={cx(control, className)} {...props} />
export const Textarea = ({ className, ...props }: ComponentProps<'textarea'>) => <textarea className={cx(control, 'h-auto py-2', className)} {...props} />

/** Label wraps only the title and the control, so the control's accessible name is exactly `label`. */
export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-asphalt-800">{label}</span>
        {children}
      </label>
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-2xl bg-white shadow-card', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
          {title && <h2 className="font-display text-[15px] font-semibold text-asphalt-800">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

type Tone = 'slate' | 'green' | 'amber' | 'red' | 'blue'
const tones: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-50 text-blue-700',
}

export function Badge({ tone = 'slate', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', tones[tone], className)}>{children}</span>
}

const alertTones = {
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-green-200 bg-green-50 text-green-800',
}

export function Alert({ tone = 'error', children }: { tone?: keyof typeof alertTones; children: ReactNode }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={cx('rounded-xl border px-3.5 py-2.5 text-sm', alertTones[tone])}>{children}</div>
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="space-y-2 p-4" role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded-[10px] bg-silver-200" />)}
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-asphalt-900">{title}</h1>
        {description && <p className="mt-1 max-w-[70ch] text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-silver-100 text-left text-xs font-semibold text-slate-500">
          <tr>{head.map((h, i) => <th key={i} className="px-3 py-2.5 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-silver-200">{children}</tbody>
      </table>
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-current/25 bg-current/10 px-1.5 py-0.5 font-sans text-[10px] font-medium text-current opacity-80">{children}</kbd>
}
