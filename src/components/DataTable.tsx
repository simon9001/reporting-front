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
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-line text-left text-xs text-slate-500">
          <tr>
            {columns.map((c) => {
              const active = sort === c.sortKey || sort === `-${c.sortKey}`
              const desc = sort === `-${c.sortKey}`
              return (
                <th key={c.key} className={cx('px-3 py-2.5 font-medium', c.className)} aria-sort={active ? (desc ? 'descending' : 'ascending') : undefined}>
                  {c.sortKey && onSortChange ? (
                    <button type="button" className="inline-flex items-center gap-1 hover:text-slate-800" onClick={() => onSortChange(nextSort(sort, c.sortKey!))}>
                      {c.header}
                      {active && (desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
                    </button>
                  ) : c.header}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={cx(onRowClick && 'cursor-pointer hover:bg-brand-50/60 focus:bg-brand-50 focus:outline-none')}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(row) } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={rowLabel?.(row)}
            >
              {columns.map((c) => <td key={c.key} className={cx('px-3 py-2.5 align-middle', c.className)}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(total, page * pageSize)
  return (
    <div className="flex items-center justify-between gap-2 border-t border-line px-3 pt-3 text-sm text-slate-500">
      <span>Showing {first}–{last} of {total}</span>
      <div className="flex items-center gap-1">
        <IconButton label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft /></IconButton>
        <span>Page {page} of {pages}</span>
        <IconButton label="Next page" disabled={page >= pages} onClick={() => onPageChange(page + 1)}><ChevronRight /></IconButton>
      </div>
    </div>
  )
}
