import { ROLE_LABELS, type SessionUserDto } from '@sr/shared'
import { KeyRound, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

export function UserMenu({ user, onSignOut }: { user: SessionUserDto; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  const initials = user.fullName.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-slate-100">
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{initials}</span>
        <span className="hidden text-left text-xs leading-tight sm:block">
          <span className="block font-medium text-slate-800">{user.fullName}</span>
          <span className="block text-slate-500">{ROLE_LABELS[user.role]}</span>
        </span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-52 rounded-lg border border-line bg-white p-1 shadow-lg">
          <Link role="menuitem" to="/change-password" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <KeyRound className="size-4 text-slate-400" /> Change password
          </Link>
          <button role="menuitem" type="button" onClick={onSignOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <LogOut className="size-4 text-slate-400" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
