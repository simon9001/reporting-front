import { Search } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

export function FilterBar({ search, onSearchChange, placeholder = 'Search…', children, canClear, onClear, actions }: {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
  children?: ReactNode
  canClear?: boolean
  onClear?: () => void
  actions?: ReactNode
}) {
  const [text, setText] = useState(search)
  useEffect(() => setText(search), [search])
  useEffect(() => {
    if (text === search) return
    const t = setTimeout(() => onSearchChange(text), 300)
    return () => clearTimeout(t)
  }, [text, search, onSearchChange])
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-56 flex-1">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        />
      </label>
      {children}
      {canClear && onClear && <button type="button" onClick={onClear} className="h-9 px-2 text-sm font-medium text-brand-700 hover:text-brand-800">Clear</button>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}
