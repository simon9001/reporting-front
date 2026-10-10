import { Search } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

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
  const onChangeRef = useRef(onSearchChange)
  useEffect(() => { onChangeRef.current = onSearchChange })
  useEffect(() => setText(search), [search])
  useEffect(() => {
    if (text === search) return
    const t = setTimeout(() => onChangeRef.current(text), 300)
    return () => clearTimeout(t)
  }, [text, search])
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <label className="relative w-full min-w-0 flex-1 sm:w-auto sm:min-w-56">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-md border border-silver-200 bg-white pl-9 pr-3 text-[13px] transition duration-150 placeholder:text-slate-400 focus:border-asphalt-800 focus:outline-none focus:ring-2 focus:ring-highway-400/70 sm:h-8"
        />
      </label>
      {children}
      {canClear && onClear && <button type="button" onClick={onClear} className="h-8 px-2 text-[13px] font-medium text-link hover:underline">Clear</button>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}
