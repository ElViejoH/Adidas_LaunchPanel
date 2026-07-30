import { List, Plus } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROLE_LABELS, USER_ROLES } from '../utils/constants'
import { buttonStyles } from './buttonStyles'

const routeLabels = [
  { test: /^\/$/, label: 'Resumen' },
  { test: /^\/calendar/, label: 'Calendario' },
  { test: /^\/launches\/new/, label: 'Nuevo lanzamiento' },
  { test: /^\/launches\/[^/]+\/edit/, label: 'Editar lanzamiento' },
  { test: /^\/launches\/[^/]+/, label: 'Detalle' },
  { test: /^\/launches/, label: 'Lanzamientos' },
]

export function Navbar({ onMenuOpen }) {
  const location = useLocation()
  const { user } = useAuth()
  const pageLabel = routeLabels.find(({ test }) => test.test(location.pathname))?.label || 'Launch Panel'

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-zinc-200 bg-[#f7f7f5]/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuOpen}
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-300 bg-white text-zinc-950 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-950 lg:hidden"
          aria-label="Abrir navegación"
        >
          <List size={20} weight="bold" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-zinc-950">{pageLabel}</p>
          <p className="hidden truncate text-xs font-semibold text-zinc-500 sm:block">
            {ROLE_LABELS[user?.role] || 'Usuario'} · {user?.name}
          </p>
        </div>
      </div>

      {user?.role === USER_ROLES.CREATOR && (
        <Link to="/launches/new" className={buttonStyles({ size: 'sm' })}>
          <Plus size={16} weight="bold" aria-hidden="true" />
          <span className="hidden sm:inline">Nuevo lanzamiento</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      )}
    </header>
  )
}
