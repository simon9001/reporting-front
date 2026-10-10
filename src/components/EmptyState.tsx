import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** `compact` (default) is a single row for panels; `page` is the centred variant for full-page empties. */
export function EmptyState({ title, description, action, icon: Icon = Inbox, size = 'compact' }: {
  title: string
  description?: string
  action?: ReactNode
  icon?: LucideIcon
  size?: 'compact' | 'page'
}) {
  if (size === 'page') {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-10 text-center">
        <span className="mb-1 flex size-10 items-center justify-center rounded-lg bg-silver-100 text-slate-500"><Icon className="size-5" aria-hidden /></span>
        <p className="font-display text-sm font-semibold text-asphalt-800">{title}</p>
        {description && <p className="max-w-sm text-[13px] text-slate-500">{description}</p>}
        {action}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2.5 py-4 text-[13px]">
      <Icon className="size-5 shrink-0 text-slate-400" aria-hidden />
      <p className="min-w-0">
        <span className="font-medium text-asphalt-800">{title}</span>
        {description && <span className="text-slate-500"> · {description}</span>}
      </p>
      {action && <span className="ml-auto shrink-0">{action}</span>}
    </div>
  )
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-1.5 py-1" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-8 animate-pulse rounded-md bg-silver-200" />)}
    </div>
  )
}
