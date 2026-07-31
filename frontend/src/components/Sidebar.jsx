import { useEffect, useRef } from 'react'
import {
  CalendarBlank,
  House,
  ListBullets,
  SignOut,
  UsersThree,
  X,
} from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../hooks/useI18n'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { USER_ROLES } from '../utils/constants'
import { BrandMark } from './BrandMark'
import { RoleGuard } from './RoleGuard'

const navItems = [
  { to: '/', labelKey: 'nav.summary', icon: House, end: true },
  { to: '/launches', labelKey: 'nav.launches', icon: ListBullets },
  { to: '/calendar', labelKey: 'nav.calendar', icon: CalendarBlank },
]

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { t } = useI18n()
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
    `font-display flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-100 ${
      isActive ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50'
    }`

  return (
    <>
      {isDrawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-zinc-950/50 lg:hidden"
          onClick={onClose}
          aria-label={t('nav.closeNavigation')}
        />
      )}
      <aside
        ref={asideRef}
        role={isDrawerOpen ? 'dialog' : undefined}
        aria-modal={isDrawerOpen ? 'true' : undefined}
        aria-label={isDrawerOpen ? t('nav.mainMenu') : undefined}
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
            aria-label={t('nav.closeMenu')}
          >
            <X size={19} weight="bold" />
          </button>
        </div>

        <nav className="mt-8 flex-1" aria-label={t('nav.mainNavigation')}>
          <p className="font-display mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-400">{t('nav.workspace')}</p>
          <div className="space-y-1">
            {navItems.map(({ to, labelKey, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={onClose} className={navClassName}>
                <Icon size={19} weight="bold" aria-hidden="true" />
                {t(labelKey)}
              </NavLink>
            ))}
          </div>

          <RoleGuard roles={USER_ROLES.ADMIN}>
            <div className="mt-6 border-t border-zinc-800 pt-5">
              <p className="font-display mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-500">{t('nav.administration')}</p>
              <NavLink to="/users" onClick={onClose} className={navClassName}>
                <UsersThree size={19} weight="bold" aria-hidden="true" />
                {t('nav.usersAndPermissions')}
              </NavLink>
            </div>
          </RoleGuard>
        </nav>

        <div className="border-t border-zinc-800 pt-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-800 text-xs font-black text-zinc-100">
              {user?.name?.slice(0, 2).toUpperCase() || t('common.userInitialsFallback')}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-zinc-100">{user?.name}</p>
              <p className="truncate text-xs text-zinc-400">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="font-display flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-bold text-zinc-400 outline-none hover:bg-zinc-900 hover:text-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-100"
          >
            <SignOut size={18} weight="bold" aria-hidden="true" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>
    </>
  )
}
