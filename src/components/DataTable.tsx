import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { EmptyState, Skeleton } from './EmptyState'
import { cx, IconButton } from './ui'

export interface Column<T> {
  key: string
  header: ReactNode
  sortKey?: string
  className?: string
  render: (row: T) => ReactNode
}

function nextSort(current: string | undefined, key: string): string {
  if (current === `-${key}`) return key
  return `-${key}` // first click sorts descending (newest / most severe first)
}

export function DataTable<T,>({ columns, rows, rowKey, sort, onSortChange, onRowClick, loading, empty, rowLabel }: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  sort?: string
  onSortChange?: (sort: string) => void
  onRowClick?: (row: T) => void
  loading?: boolean
  empty?: ReactNode
  rowLabel?: (row: T) => string
}) {
  if (loading) return <Skeleton rows={6} />
  if (rows.length === 0) return <>{empty ?? <EmptyState title="Nothing to show" />}</>
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-silver-100 text-left text-xs text-slate-500">
          <tr>
            {columns.map((c) => {
              const active = !!c.sortKey && (sort === c.sortKey || sort === `-${c.sortKey}`)
              const desc = sort === `-${c.sortKey}`
              return (
                <th key={c.key} className={cx('px-5 py-3 font-semibold first:pl-5', c.className)} aria-sort={active ? (desc ? 'descending' : 'ascending') : undefined}>
                  {c.sortKey && onSortChange ? (
                    <button type="button" className="inline-flex items-center gap-1 transition hover:text-asphalt-800" onClick={() => onSortChange(nextSort(sort, c.sortKey!))}>
                      {c.header}
                      {active && (desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
                    </button>
                  ) : c.header}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-silver-200">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={cx(onRowClick && 'cursor-pointer transition-colors duration-150 hover:bg-highway-50 focus:bg-highway-50 focus:shadow-[inset_3px_0_0_var(--color-highway-400)] focus:outline-none')}
              onClick={onRowClick ? (e) => {
                const inner = (e.target as HTMLElement).closest('a,button,input,select,textarea,label')
                if (inner && inner !== e.currentTarget) return
                onRowClick(row)
              } : undefined}
              onKeyDown={onRowClick ? (e) => {
                if (e.target !== e.currentTarget) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onRowClick(row)
                }
              } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={rowLabel?.(row)}
            >
              {columns.map((c) => <td key={c.key} className={cx('px-5 py-3 align-middle', c.className)}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const first = total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + 1)
  const last = Math.min(total, page * pageSize)
  return (
    <div className="flex items-center justify-between gap-2 border-t border-silver-200 px-1 pt-3 text-sm text-slate-500">
      <span>Showing {first}–{last} of {total}</span>
      <div className="flex items-center gap-1">
        <IconButton label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft /></IconButton>
        <span className="tabular-nums">Page {page} of {pages}</span>
        <IconButton label="Next page" disabled={page >= pages} onClick={() => onPageChange(page + 1)}><ChevronRight /></IconButton>
      </div>
    </div>
  )
}
