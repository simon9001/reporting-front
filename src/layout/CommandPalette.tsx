import { incidentPlace, type IncidentListItemDto, type Paged, type Role, type UserDto } from '@sr/shared'
import { useQuery } from '@tanstack/react-query'
import { FileWarning, Search, User } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { cx, Kbd } from '../components/ui'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { navFor } from './nav'

interface Result { id: string; label: string; detail?: string; to: string; kind: 'page' | 'incident' | 'officer' }

export function CommandPalette({ onClose, role }: { onClose: () => void; role: Role }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const dialog = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  const listId = useId()
  useEffect(() => { closeRef.current = onClose })
  // captured during the first render, before the autoFocus input takes focus
  const [previous] = useState(() => document.activeElement as HTMLElement | null)
  useEffect(() => {
    // focus the input here too: StrictMode's simulated unmount would otherwise leave focus on `previous`
    dialog.current?.querySelector<HTMLElement>('input')?.focus()
    return () => { if (previous?.isConnected) previous.focus() }
  }, [previous])
  const term = q.trim()
  const leader = role === 'DEPUTY_DIRECTOR' || role === 'ADMIN'
  const incidents = useQuery({
    queryKey: ['search', 'incidents', term],
    queryFn: () => api<Paged<IncidentListItemDto>>('/incidents', { query: { q: term, pageSize: 25 } }),
    enabled: term.length >= 2,
  })
  const officers = useQuery({
    queryKey: ['search', 'officers'],
    queryFn: () => api<UserDto[]>('/users', { query: { role: 'OFFICER' } }),
    enabled: leader,
  })

  const results = useMemo<Result[]>(() => {
    const lower = term.toLowerCase()
    const pages = navFor(role).flatMap((g) => g.items)
      .filter((i) => !lower || i.label.toLowerCase().includes(lower))
      .map((i) => ({ id: `p${i.to}`, label: i.label, to: i.to, kind: 'page' as const }))
    const found = (incidents.data?.items ?? []).slice(0, 6).map((i) => ({
      id: `i${i.id}`, label: `${i.ref} · ${i.category.value}`, detail: `${i.vehicle ? `${i.vehicle.unitId} · ` : ''}${incidentPlace(i)} · ${formatDateTime(i.occurredAt)}`, to: `/incidents?open=${i.ref}`, kind: 'incident' as const,
    }))
    const people = lower.length >= 2
      ? (officers.data ?? []).filter((u) => u.fullName.toLowerCase().includes(lower)).slice(0, 4)
          .map((u) => ({ id: `u${u.id}`, label: u.fullName, detail: u.email, to: `/officers?q=${encodeURIComponent(u.fullName)}`, kind: 'officer' as const }))
      : []
    return [...found, ...people, ...pages]
  }, [term, role, incidents.data, officers.data])

  const activeIndex = Math.min(active, Math.max(results.length - 1, 0))
  const optionId = (i: number) => `${listId}-opt-${i}`

  const go = (r: Result | undefined) => {
    if (!r) return
    navigate(r.to)
    onClose()
  }
  const icon = (k: Result['kind']) => (k === 'incident' ? <FileWarning className="size-4 text-orange-500" /> : k === 'officer' ? <User className="size-4 text-slate-400" /> : <Search className="size-4 text-slate-400" />)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/30 p-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Search the system"
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); closeRef.current() }
          // the input is the only tab stop in the dialog: keep focus inside it
          if (e.key === 'Tab') { e.preventDefault(); dialog.current?.querySelector<HTMLElement>('input')?.focus() }
        }}
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search className="size-4 text-slate-400" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0) }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(activeIndex + 1, Math.max(results.length - 1, 0))) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(activeIndex - 1, 0)) }
              if (e.key === 'Enter') go(results[activeIndex])
            }}
            placeholder={leader ? 'Search incidents, officers, pages…' : 'Search incidents and pages…'}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results.length > 0 ? optionId(activeIndex) : undefined}
            aria-label="Search"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul id={listId} className="max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Results">
          {results.map((r, i) => (
            <li
              key={r.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(r)}
              className={cx('flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm', i === activeIndex ? 'bg-highway-50' : '')}
            >
              {icon(r.kind)}
              <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{r.label}</span>
              {r.detail && <span className="truncate text-xs text-slate-500">{r.detail}</span>}
            </li>
          ))}
        </ul>
        {results.length === 0 && (
          <p role="status" className="px-3 py-6 text-center text-sm text-slate-500">{term.length < 2 ? 'Type at least 2 characters' : 'No matches'}</p>
        )}
      </div>
    </div>
  )
}
