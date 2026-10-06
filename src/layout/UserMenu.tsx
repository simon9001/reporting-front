import { ROLE_LABELS, type SessionUserDto } from '@sr/shared'
import { KeyRound, LogOut } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link } from 'react-router'

export function UserMenu({ user, onSignOut }: { user: SessionUserDto; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const items = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) trigger.current?.focus()
  }
  useEffect(() => {
    if (open) items()[0]?.focus()
  }, [open])
  const onMenuKey = (e: ReactKeyboardEvent) => {
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLElement)
    const move = (n: number) => { e.preventDefault(); list[(n + list.length) % list.length]?.focus() }
    if (e.key === 'ArrowDown') move(i + 1)
    else if (e.key === 'ArrowUp') move(i - 1)
    else if (e.key === 'Home') move(0)
    else if (e.key === 'End') move(list.length - 1)
    else if (e.key === 'Escape') { e.preventDefault(); close(true) }
    else if (e.key === 'Tab') close(true) // focus returns to the trigger; the natural Tab then continues from there
  }
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  const initials = user.fullName.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div ref={ref} className="relative">
      <button ref={trigger} type="button" aria-label="Account menu" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition duration-200 hover:bg-silver-100">
        <span className="flex size-9 items-center justify-center rounded-full bg-highway-400 font-display text-sm font-semibold text-asphalt-900">{initials}</span>
        <span className="hidden text-left text-xs leading-tight sm:block">
          <span className="block font-medium text-asphalt-900">{user.fullName}</span>
          <span className="block text-slate-500">{ROLE_LABELS[user.role]}</span>
        </span>
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label="Account" onKeyDown={onMenuKey} className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-silver-200 bg-white p-1 shadow-card">
          <Link role="menuitem" tabIndex={-1} to="/change-password" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-silver-100">
            <KeyRound className="size-4 text-slate-400" /> Change password
          </Link>
          <button role="menuitem" tabIndex={-1} type="button" onClick={onSignOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-silver-100">
            <LogOut className="size-4 text-slate-400" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
