import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCompact } from '../lib/useBelow'
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

/**
 * Below md, when `mobile` is given, rows render as a stacked list (buttons named by `rowLabel` when clickable).
 * Without `mobile`, the table scrolls horizontally inside its card.
 */
export function DataTable<T,>({ columns, rows, rowKey, sort, onSortChange, onRowClick, loading, empty, rowLabel, mobile }: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  sort?: string
  onSortChange?: (sort: string) => void
  onRowClick?: (row: T) => void
  loading?: boolean
  empty?: ReactNode
  rowLabel?: (row: T) => string
  mobile?: (row: T) => ReactNode
}) {
  const compact = useCompact()
  if (loading) return <Skeleton rows={6} />
  if (rows.length === 0) return <>{empty ?? <EmptyState title="Nothing to show" />}</>
  if (compact && mobile) {
    return (
      <ul className="-mx-4 divide-y divide-silver-200 border-y border-silver-200 text-[13px]">
        {rows.map((row) => (
          <li key={rowKey(row)}>
            {onRowClick ? (
              <button type="button" aria-label={rowLabel?.(row)} onClick={() => onRowClick(row)} className="block w-full px-4 py-2.5 text-left transition-colors duration-150 hover:bg-highway-50 focus-visible:bg-highway-50">
                {mobile(row)}
              </button>
            ) : (
              <div className="px-4 py-2.5">{mobile(row)}</div>
            )}
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="min-w-full text-[13px]">
        <thead className="sticky top-0 z-10 bg-silver-100 text-left text-xs text-slate-500">
          <tr>
            {columns.map((c) => {
              const active = !!c.sortKey && (sort === c.sortKey || sort === `-${c.sortKey}`)
              const desc = sort === `-${c.sortKey}`
              return (
                <th key={c.key} className={cx('h-8 whitespace-nowrap px-3 font-semibold first:pl-4 last:pr-4', c.className)} aria-sort={active ? (desc ? 'descending' : 'ascending') : undefined}>
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
              className={cx(onRowClick && 'cursor-pointer transition-colors duration-150 hover:bg-highway-50 focus-visible:bg-highway-50 focus-visible:outline-none focus-visible:[&>td:first-child]:shadow-[inset_3px_0_0_var(--color-highway-400)]')}
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
              {columns.map((c) => <td key={c.key} className={cx('px-3 py-2.5 align-middle first:pl-4 last:pr-4', c.className)}>{c.render(row)}</td>)}
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
    <div className="flex items-center justify-between gap-2 border-t border-silver-200 pt-2 text-xs text-slate-500">
      <span className="tabular-nums">{first}–{last} of {total}</span>
      <div className="flex items-center gap-1">
        <IconButton label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft /></IconButton>
        <span className="tabular-nums">Page {page} of {pages}</span>
        <IconButton label="Next page" disabled={page >= pages} onClick={() => onPageChange(page + 1)}><ChevronRight /></IconButton>
      </div>
    </div>
  )
}
