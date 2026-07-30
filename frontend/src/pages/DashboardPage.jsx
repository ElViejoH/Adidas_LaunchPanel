import { useMemo } from 'react'
import {
  ArrowRight,
  CalendarBlank,
  CheckCircle,
  Clock,
  RocketLaunch,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { isAfter, isSameDay } from 'date-fns'
import { buttonStyles } from '../components/buttonStyles'
import { EmptyState, ErrorState, PageSkeleton } from '../components/PageStates'
import { LaunchCard } from '../components/LaunchCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useLaunches } from '../hooks/useLaunches'
import { LAUNCH_STATUSES, USER_ROLES } from '../utils/constants'
import { formatLaunchDate, startOfToday, toDate } from '../utils/date'
import { canEditLaunch } from '../utils/permissions'

export function DashboardPage() {
  useDocumentTitle('Resumen')
  const { user } = useAuth()
  const filters = useMemo(() => ({ limit: 100, sortBy: 'launchDate', sortOrder: 'asc' }), [])
  const { launches, isLoading, error, reload } = useLaunches(filters)

  const dashboardData = useMemo(() => {
    const today = startOfToday()
    const upcoming = launches
      .filter((launch) => {
        const date = toDate(launch.launchDate)
        return date && (isAfter(date, today) || isSameDay(date, today))
      })
      .slice(0, 4)

    const reviewQueue = launches
      .filter((launch) =>
        user?.role === USER_ROLES.APPROVER
          ? [LAUNCH_STATUSES.IN_REVIEW, LAUNCH_STATUSES.APPROVED].includes(launch.status)
          : canEditLaunch(user, launch),
      )
      .slice(0, 5)

    return {
      upcoming,
      reviewQueue,
      counts: {
        total: launches.length,
        review: launches.filter((launch) => launch.status === LAUNCH_STATUSES.IN_REVIEW).length,
        approved: launches.filter((launch) => launch.status === LAUNCH_STATUSES.APPROVED).length,
        published: launches.filter((launch) => launch.status === LAUNCH_STATUSES.PUBLISHED).length,
      },
    }
  }, [launches, user])

  const metrics = [
    { label: 'Total activos', value: dashboardData.counts.total, icon: RocketLaunch },
    { label: 'En revisión', value: dashboardData.counts.review, icon: Clock },
    { label: 'Aprobados', value: dashboardData.counts.approved, icon: CheckCircle },
    { label: 'Publicados', value: dashboardData.counts.published, icon: CalendarBlank },
  ]

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={user?.role === USER_ROLES.APPROVER ? 'Mesa de aprobación' : 'Workspace de creación'}
        title={`Hola, ${user?.name?.split(' ')[0] || 'equipo'}`}
        description={
          user?.role === USER_ROLES.APPROVER
            ? 'Revisa los lanzamientos pendientes y mantén el calendario listo para publicación.'
            : 'Organiza próximos lanzamientos y prepara cada entrega para revisión.'
        }
        actions={
          user?.role === USER_ROLES.CREATOR ? (
            <Link to="/launches/new" className={buttonStyles()}>
              Crear lanzamiento
              <ArrowRight size={17} weight="bold" aria-hidden="true" />
            </Link>
          ) : (
            <Link to="/launches?status=IN_REVIEW" className={buttonStyles()}>
              Ver pendientes
              <ArrowRight size={17} weight="bold" aria-hidden="true" />
            </Link>
          )
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : isLoading ? (
        <PageSkeleton rows={4} />
      ) : (
        <>
          <section className="grid overflow-hidden rounded-xl border border-zinc-200 bg-white sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores de lanzamientos">
            {metrics.map(({ label, value, icon: Icon }, index) => (
              <div
                key={label}
                className={`flex items-start justify-between gap-4 p-5 ${index > 0 ? 'border-t border-zinc-200 sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l-0 sm:border-t xl:border-l xl:border-t-0' : ''}`}
              >
                <div>
                  <p className="text-xs font-bold text-zinc-500">{label}</p>
                  <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-zinc-950">{value}</p>
                </div>
                <span className="grid size-9 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
                  <Icon size={19} weight="bold" aria-hidden="true" />
                </span>
              </div>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
            <section className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black tracking-[-0.025em] text-zinc-950">Próximos lanzamientos</h2>
                  <p className="mt-1 text-sm text-zinc-600">La siguiente ventana de publicación del equipo.</p>
                </div>
                <Link to="/calendar" className="shrink-0 text-xs font-black uppercase tracking-[0.08em] text-zinc-950 hover:underline">
                  Ver calendario
                </Link>
              </div>
              {dashboardData.upcoming.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {dashboardData.upcoming.map((launch) => (
                    <LaunchCard key={launch.id} launch={launch} compact />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No hay lanzamientos próximos"
                  description="Los lanzamientos con fecha futura aparecerán aquí."
                  action={
                    user?.role === USER_ROLES.CREATOR ? (
                      <Link to="/launches/new" className={buttonStyles({ size: 'sm' })}>Crear lanzamiento</Link>
                    ) : null
                  }
                />
              )}
            </section>

            <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-4">
                <div>
                  <h2 className="text-base font-black text-zinc-950">
                    {user?.role === USER_ROLES.APPROVER ? 'Cola de aprobación' : 'Borradores abiertos'}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {user?.role === USER_ROLES.APPROVER ? 'Elementos que requieren decisión.' : 'Trabajo que aún puedes editar.'}
                  </p>
                </div>
                <span className="text-2xl font-black tracking-[-0.04em] text-zinc-950">{dashboardData.reviewQueue.length}</span>
              </div>
              {dashboardData.reviewQueue.length ? (
                <ul className="mt-1">
                  {dashboardData.reviewQueue.map((launch) => (
                    <li key={launch.id} className="border-b border-zinc-100 py-4 last:border-0 last:pb-0">
                      <Link to={`/launches/${launch.id}`} className="group block outline-none focus-visible:ring-2 focus-visible:ring-zinc-950">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-zinc-950 group-hover:underline">{launch.name}</p>
                            <p className="mt-1 text-xs font-semibold capitalize text-zinc-500">
                              {launch.market} · {formatLaunchDate(launch.launchDate)}
                            </p>
                          </div>
                          <StatusBadge status={launch.status} compact />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-zinc-500">No hay elementos pendientes.</p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
