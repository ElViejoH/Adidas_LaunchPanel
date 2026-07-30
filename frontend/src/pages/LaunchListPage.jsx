import { useMemo, useState } from 'react'
import { CaretDown, CaretLeft, CaretRight, FunnelSimple, Plus, X } from '@phosphor-icons/react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { buttonStyles } from '../components/buttonStyles'
import { ConfirmModal } from '../components/ConfirmModal'
import { DateFilter } from '../components/DateFilter'
import { LaunchCard } from '../components/LaunchCard'
import { LaunchTable } from '../components/LaunchTable'
import { MarketFilter } from '../components/MarketFilter'
import { EmptyState, ErrorState, PageSkeleton } from '../components/PageStates'
import { PageHeader } from '../components/PageHeader'
import { SearchBar } from '../components/SearchBar'
import { launchService } from '../services/launchService'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useLaunches } from '../hooks/useLaunches'
import { STATUS_CONFIG, STATUS_ORDER, USER_ROLES } from '../utils/constants'

export function LaunchListPage() {
  useDocumentTitle('Lanzamientos')
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const market = searchParams.get('market') || ''
  const status = searchParams.get('status') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const pageParam = Number(searchParams.get('page'))
  const page = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [launchToDelete, setLaunchToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const debouncedMarket = useDebounce(market, 350)

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      market: debouncedMarket,
      status,
      from,
      to,
      page,
      limit: 12,
      sortBy: 'launchDate',
      sortOrder: 'asc',
    }),
    [debouncedMarket, debouncedSearch, from, page, status, to],
  )
  const { launches, meta, isLoading, error, reload } = useLaunches(filters)
  const totalPages = meta?.totalPages || 1
  const total = meta?.total ?? launches.length
  const hasFilters = Boolean(search || market || status || from || to)

  const updateUrl = (updates, { resetPage = false } = {}) => {
    const nextParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value && !(key === 'page' && Number(value) === 1)) {
        nextParams.set(key, String(value))
      } else {
        nextParams.delete(key)
      }
    })
    if (resetPage) nextParams.delete('page')
    setSearchParams(nextParams, { replace: true })
  }

  const changeFilter = (key, value) => {
    updateUrl({ [key]: value }, { resetPage: true })
  }

  const changePage = (nextPage) => {
    updateUrl({ page: nextPage })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  const clearFilters = () => {
    setSearchParams({}, { replace: true })
  }

  const handleDelete = async () => {
    if (!launchToDelete) return
    setIsDeleting(true)
    setActionError('')
    try {
      await launchService.remove(launchToDelete.id)
      setLaunchToDelete(null)
      reload()
    } catch (requestError) {
      setActionError(requestError.message)
      setLaunchToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Portafolio de producto"
        title="Lanzamientos"
        description="Busca, filtra y gestiona el flujo completo desde borrador hasta publicación."
        actions={
          user?.role === USER_ROLES.CREATOR ? (
            <Link to="/launches/new" className={buttonStyles()}>
              <Plus size={17} weight="bold" aria-hidden="true" />
              Nuevo lanzamiento
            </Link>
          ) : null
        }
      />

      <section className="rounded-xl border border-zinc-200 bg-white p-4" aria-label="Filtros de lanzamientos">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <span className="mb-1.5 block text-xs font-bold text-zinc-700">Búsqueda</span>
            <SearchBar value={search} onChange={(value) => changeFilter('search', value)} />
          </div>
          <div className="hidden w-56 lg:block">
            <MarketFilter value={market} onChange={(value) => changeFilter('market', value)} markets={launches.map((launch) => launch.market)} />
          </div>
          <label className="hidden w-48 lg:block">
            <span className="mb-1.5 block text-xs font-bold text-zinc-700">Estado</span>
            <span className="relative block">
              <select
                value={status}
                onChange={(event) => changeFilter('status', event.target.value)}
                className="min-h-10 w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-9 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              >
                <option value="">Todos los estados</option>
                {STATUS_ORDER.map((value) => (
                  <option key={value} value={value}>{STATUS_CONFIG[value].label}</option>
                ))}
              </select>
              <CaretDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} weight="bold" />
            </span>
          </label>
          <Button
            variant="secondary"
            onClick={() => setFiltersOpen((open) => !open)}
            className="lg:hidden"
            aria-expanded={filtersOpen}
            aria-controls="launch-filter-panel"
          >
            <FunnelSimple size={17} weight="bold" aria-hidden="true" />
            Filtros
          </Button>
          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} className="text-zinc-600">
              <X size={16} weight="bold" aria-hidden="true" />
              Limpiar
            </Button>
          )}
        </div>

        <div id="launch-filter-panel" className={`${filtersOpen ? 'grid' : 'hidden'} mt-4 gap-4 border-t border-zinc-200 pt-4 lg:grid lg:grid-cols-[220px_190px_minmax(320px,1fr)]`}>
          <div className="lg:hidden">
            <MarketFilter value={market} onChange={(value) => changeFilter('market', value)} markets={launches.map((launch) => launch.market)} />
          </div>
          <label className="block lg:hidden">
            <span className="mb-1.5 block text-xs font-bold text-zinc-700">Estado</span>
            <select
              value={status}
              onChange={(event) => changeFilter('status', event.target.value)}
              className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            >
              <option value="">Todos los estados</option>
              {STATUS_ORDER.map((value) => (
                <option key={value} value={value}>{STATUS_CONFIG[value].label}</option>
              ))}
            </select>
          </label>
          <div className="lg:col-start-3">
            <DateFilter
              from={from}
              to={to}
              onFromChange={(value) => changeFilter('from', value)}
              onToChange={(value) => changeFilter('to', value)}
            />
          </div>
        </div>
      </section>

      {actionError && <ErrorState title="No se pudo eliminar" message={actionError} />}

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : isLoading ? (
        <PageSkeleton rows={6} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-zinc-600">
              <strong className="font-black text-zinc-950">{total}</strong> {total === 1 ? 'resultado' : 'resultados'}
            </p>
            {meta?.page && <p className="text-xs font-bold text-zinc-500">Página {meta.page} de {totalPages}</p>}
          </div>

          {launches.length === 0 ? (
            <EmptyState
              title={hasFilters ? 'No encontramos coincidencias' : 'Todavía no hay lanzamientos'}
              description={hasFilters ? 'Ajusta o limpia los filtros para ampliar la búsqueda.' : 'Crea el primer lanzamiento para comenzar a coordinar el calendario.'}
              action={
                hasFilters ? (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>Limpiar filtros</Button>
                ) : user?.role === USER_ROLES.CREATOR ? (
                  <Link to="/launches/new" className={buttonStyles({ size: 'sm' })}>Crear lanzamiento</Link>
                ) : null
              }
            />
          ) : (
            <>
              <div className="hidden md:block">
                <LaunchTable launches={launches} onDelete={setLaunchToDelete} />
              </div>
              <div className="grid gap-4 md:hidden">
                {launches.map((launch) => <LaunchCard key={launch.id} launch={launch} />)}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-2" aria-label="Paginación">
              <Button variant="secondary" size="icon" onClick={() => changePage(page - 1)} disabled={page <= 1} aria-label="Página anterior">
                <CaretLeft size={18} weight="bold" />
              </Button>
              <span className="min-w-24 text-center text-sm font-black text-zinc-700">{page} / {totalPages}</span>
              <Button variant="secondary" size="icon" onClick={() => changePage(page + 1)} disabled={page >= totalPages} aria-label="Página siguiente">
                <CaretRight size={18} weight="bold" />
              </Button>
            </nav>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={Boolean(launchToDelete)}
        title="Eliminar lanzamiento"
        description={`Se eliminará “${launchToDelete?.name || ''}”. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onClose={() => setLaunchToDelete(null)}
        isLoading={isDeleting}
        tone="danger"
      />
    </div>
  )
}
