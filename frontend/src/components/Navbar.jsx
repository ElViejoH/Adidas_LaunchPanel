import { List } from '@phosphor-icons/react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../hooks/useI18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { RoleBadge } from './RoleBadge'

const routeLabels = [
  { test: /^\/$/, labelKey: 'nav.summary' },
  { test: /^\/calendar/, labelKey: 'nav.calendar' },
  { test: /^\/users/, labelKey: 'nav.usersAndPermissions' },
  { test: /^\/launches\/new/, labelKey: 'nav.newLaunch' },
  { test: /^\/launches\/[^/]+\/edit/, labelKey: 'nav.editLaunch' },
  { test: /^\/launches\/[^/]+/, labelKey: 'nav.detail' },
  { test: /^\/launches/, labelKey: 'nav.launches' },
]

export function Navbar({ onMenuOpen }) {
  const location = useLocation()
  const { user } = useAuth()
  const { t } = useI18n()
  const pageLabelKey = routeLabels.find(({ test }) => test.test(location.pathname))?.labelKey
  const pageLabel = pageLabelKey ? t(pageLabelKey) : t('brand.productName')

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-zinc-200 bg-[#f7f7f5]/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuOpen}
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-300 bg-white text-zinc-950 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-950 lg:hidden"
          aria-label={t('nav.openNavigation')}
        >
          <List size={20} weight="bold" />
        </button>
        <div className="min-w-0">
          <p className="font-display truncate text-sm font-black text-zinc-950">{pageLabel}</p>
          <div className="mt-1 hidden min-w-0 items-center gap-2 sm:flex">
            <RoleBadge role={user?.role} compact />
            <span className="truncate text-xs font-semibold text-zinc-500">{user?.name}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <LanguageSwitcher />
      </div>
    </header>
  )
}
