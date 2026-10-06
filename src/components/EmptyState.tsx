import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({ title, description, action, icon: Icon = Inbox }: { title: string; description?: string; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="mb-1 flex size-12 items-center justify-center rounded-xl bg-silver-100 text-slate-500"><Icon className="size-6" aria-hidden /></span>
      <p className="font-display text-base font-semibold text-asphalt-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  )
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 py-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-9 animate-pulse rounded-[10px] bg-silver-200" />)}
    </div>
  )
}
