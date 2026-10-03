import type { IncidentListItemDto, Paged, Role, UserDto } from '@sr/shared'
import { useQuery } from '@tanstack/react-query'
import { FileWarning, Search, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { cx, Kbd } from '../components/ui'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { navFor } from './nav'

interface Result { id: string; label: string; detail?: string; to: string; kind: 'page' | 'incident' | 'officer' }

export function CommandPalette({ open, onClose, role }: { open: boolean; onClose: () => void; role: Role }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const term = q.trim()
  const leader = role === 'DEPUTY_DIRECTOR' || role === 'ADMIN'
  const incidents = useQuery({
    queryKey: ['search', 'incidents', term],
    queryFn: () => api<Paged<IncidentListItemDto>>('/incidents', { query: { q: term, pageSize: 25 } }),
    enabled: open && term.length >= 2,
  })
  const officers = useQuery({
    queryKey: ['search', 'officers'],
    queryFn: () => api<UserDto[]>('/users', { query: { role: 'OFFICER' } }),
    enabled: open && leader,
  })

  const results = useMemo<Result[]>(() => {
    const lower = term.toLowerCase()
    const pages = navFor(role).flatMap((g) => g.items)
      .filter((i) => !lower || i.label.toLowerCase().includes(lower))
      .map((i) => ({ id: `p${i.to}`, label: i.label, to: i.to, kind: 'page' as const }))
    const found = (incidents.data?.items ?? []).slice(0, 6).map((i) => ({
      id: `i${i.id}`, label: `${i.ref} · ${i.category.value}`, detail: `${i.location.value} · ${formatDateTime(i.occurredAt)}`, to: `/incidents?open=${i.ref}`, kind: 'incident' as const,
    }))
    const people = lower.length >= 2
      ? (officers.data ?? []).filter((u) => u.fullName.toLowerCase().includes(lower)).slice(0, 4)
          .map((u) => ({ id: `u${u.id}`, label: u.fullName, detail: u.email, to: `/officers?q=${encodeURIComponent(u.fullName)}`, kind: 'officer' as const }))
      : []
    return [...found, ...people, ...pages]
  }, [term, role, incidents.data, officers.data])

  useEffect(() => { setActive(0) }, [term])
  useEffect(() => { if (!open) setQ('') }, [open])
  if (!open) return null

  const go = (r: Result | undefined) => {
    if (!r) return
    navigate(r.to)
    onClose()
  }
  const icon = (k: Result['kind']) => (k === 'incident' ? <FileWarning className="size-4 text-orange-500" /> : k === 'officer' ? <User className="size-4 text-slate-400" /> : <Search className="size-4 text-slate-400" />)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/30 p-4 pt-[12vh]" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Search" className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search className="size-4 text-slate-400" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
              if (e.key === 'Enter') go(results[active])
              if (e.key === 'Escape') onClose()
            }}
            placeholder={leader ? 'Search incidents, officers, pages…' : 'Search incidents and pages…'}
            aria-label="Search"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">{term.length < 2 ? 'Type at least 2 characters' : 'No matches'}</li>}
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === active}>
              <button type="button" onMouseEnter={() => setActive(i)} onClick={() => go(r)} className={cx('flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm', i === active ? 'bg-brand-50' : '')}>
                {icon(r.kind)}
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{r.label}</span>
                {r.detail && <span className="truncate text-xs text-slate-500">{r.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
