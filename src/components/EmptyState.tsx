import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <Inbox className="size-8 text-slate-300" aria-hidden />
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  )
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 py-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-9 animate-pulse rounded-md bg-slate-100" />)}
    </div>
  )
}
