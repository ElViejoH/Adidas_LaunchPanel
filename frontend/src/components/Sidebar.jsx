import { useEffect, useRef } from 'react'
import {
  CalendarBlank,
  House,
  ListBullets,
  Plus,
  SignOut,
  X,
} from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { canCreateLaunch } from '../utils/permissions'
import { BrandMark } from './BrandMark'
import { RoleGuard } from './RoleGuard'

const navItems = [
  { to: '/', label: 'Resumen', icon: House, end: true },
  { to: '/launches', label: 'Lanzamientos', icon: ListBullets },
  { to: '/calendar', label: 'Calendario', icon: CalendarBlank },
]

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const asideRef = useRef(null)
  const closeButtonRef = useRef(null)
  const returnFocusRef = useRef(null)
  const isDrawerOpen = open && !isDesktop
  const isHidden = !open && !isDesktop

  useEffect(() => {
    if (!isDrawerOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const dashboardContent = document.getElementById('dashboard-content')
    const previousContentInert = dashboardContent?.inert ?? false
    const previousFocus = document.activeElement
    returnFocusRef.current = previousFocus instanceof HTMLElement ? previousFocus : null
    document.body.style.overflow = 'hidden'
    if (dashboardContent) dashboardContent.inert = true

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const aside = asideRef.current
      const focusableElements = aside ? [...aside.querySelectorAll(FOCUSABLE_SELECTOR)] : []
      if (!aside || focusableElements.length === 0) {
        event.preventDefault()
        aside?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement
      if (event.shiftKey && (activeElement === firstElement || !aside.contains(activeElement))) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (dashboardContent) dashboardContent.inert = previousContentInert
      if (returnFocusRef.current && document.contains(returnFocusRef.current)) {
        returnFocusRef.current.focus()
      }
    }
  }, [isDrawerOpen, onClose])

  const navClassName = ({ isActive }) =>
    `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-100 ${
      isActive ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50'
    }`

  return (
    <>
      {isDrawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-zinc-950/50 lg:hidden"
          onClick={onClose}
          aria-label="Cerrar navegación"
        />
      )}
      <aside
        ref={asideRef}
        role={isDrawerOpen ? 'dialog' : undefined}
        aria-modal={isDrawerOpen ? 'true' : undefined}
        aria-label={isDrawerOpen ? 'Menú principal' : undefined}
        aria-hidden={isHidden ? 'true' : undefined}
        inert={isHidden}
        tabIndex={-1}
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-zinc-800 bg-zinc-950 p-4 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex min-h-12 items-center justify-between">
          <BrandMark inverse />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={19} weight="bold" />
          </button>
        </div>

        <nav className="mt-8 flex-1" aria-label="Navegación principal">
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-400">Workspace</p>
          <div className="space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={onClose} className={navClassName}>
                <Icon size={19} weight="bold" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>

          <RoleGuard roles="CREATOR" condition={canCreateLaunch(user)}>
            <div className="mt-6 border-t border-zinc-800 pt-5">
              <NavLink to="/launches/new" onClick={onClose} className={navClassName}>
                <Plus size={19} weight="bold" aria-hidden="true" />
                Nuevo lanzamiento
              </NavLink>
            </div>
          </RoleGuard>
        </nav>

        <div className="border-t border-zinc-800 pt-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-800 text-xs font-black text-zinc-100">
              {user?.name?.slice(0, 2).toUpperCase() || 'US'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-zinc-100">{user?.name}</p>
              <p className="truncate text-xs text-zinc-400">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-bold text-zinc-400 outline-none hover:bg-zinc-900 hover:text-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-100"
          >
            <SignOut size={18} weight="bold" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
