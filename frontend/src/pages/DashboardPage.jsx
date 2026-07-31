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
import { useI18n } from '../hooks/useI18n'
import { useLaunches } from '../hooks/useLaunches'
import { tApiError } from '../i18n/apiErrors'
import { LAUNCH_STATUSES, USER_ROLES } from '../utils/constants'
import { formatLaunchDate, startOfToday, toDate } from '../utils/date'
import { getAllowedStatusTransitions } from '../utils/permissions'

export function DashboardPage() {
  const { language, t } = useI18n()
  useDocumentTitle(t('dashboard.documentTitle'))
  const { user } = useAuth()
  const filters = useMemo(() => ({ limit: 100, sortBy: 'launchDate', sortOrder: 'asc' }), [])
  const { launches, isLoading, error, reload } = useLaunches(filters)
  const isAdmin = user?.role === USER_ROLES.ADMIN

  const dashboardData = useMemo(() => {
    const today = startOfToday()
    const upcoming = launches
      .filter((launch) => {
        const date = toDate(launch.launchDate)
        return date && (isAfter(date, today) || isSameDay(date, today))
      })
      .slice(0, 4)

    const reviewQueue = launches
      .filter((launch) => getAllowedStatusTransitions(user, launch).length > 0)
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
    { label: t('dashboard.metrics.total'), value: dashboardData.counts.total, icon: RocketLaunch },
    { label: t('dashboard.metrics.review'), value: dashboardData.counts.review, icon: Clock },
    { label: t('dashboard.metrics.approved'), value: dashboardData.counts.approved, icon: CheckCircle },
    { label: t('dashboard.metrics.published'), value: dashboardData.counts.published, icon: CalendarBlank },
  ]

  const roleCopy = isAdmin
    ? 'admin'
    : user?.role === USER_ROLES.APPROVER
      ? 'approver'
      : 'creator'

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t(`dashboard.eyebrow.${roleCopy}`)}
        title={t('dashboard.greeting', {
          name: user?.name?.split(' ')[0] || t('dashboard.teamFallback'),
        })}
        description={t(`dashboard.description.${roleCopy}`)}
        actions={
          user?.role === USER_ROLES.CREATOR ? (
            <Link to="/launches/new" className={buttonStyles()}>
              {t('dashboard.actions.createLaunch')}
              <ArrowRight size={17} weight="bold" aria-hidden="true" />
            </Link>
          ) : !isAdmin ? (
            <Link to="/launches?status=IN_REVIEW" className={buttonStyles()}>
              {t('dashboard.actions.viewPending')}
              <ArrowRight size={17} weight="bold" aria-hidden="true" />
            </Link>
          ) : null
        }
      />

      {error ? (
        <ErrorState message={tApiError(error, t)} onRetry={reload} />
      ) : isLoading ? (
        <PageSkeleton rows={4} />
      ) : (
        <>
          <section className="grid grid-cols-2 border-y border-zinc-300 xl:grid-cols-4" aria-label={t('dashboard.metricsAria')}>
            {metrics.map(({ label, value, icon: Icon }, index) => (
              <div
                key={label}
                className={`flex min-h-28 items-start justify-between gap-4 p-4 sm:p-5 ${
                  index === 0 ? 'bg-zinc-950 text-white' : 'text-zinc-950'
                } ${index === 1 ? 'border-l border-zinc-300' : ''} ${
                  index === 2 ? 'border-t border-zinc-300 xl:border-l xl:border-t-0' : ''
                } ${index === 3 ? 'border-l border-t border-zinc-300 xl:border-t-0' : ''}`}
              >
                <div>
                  <p className={`text-xs font-bold ${index === 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>{label}</p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.06em]">{value}</p>
                </div>
                <span className={`grid size-9 place-items-center ${index === 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  <Icon size={19} weight="bold" aria-hidden="true" />
                </span>
              </div>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
            <section className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black tracking-[-0.025em] text-zinc-950">{t('dashboard.upcoming.title')}</h2>
                  <p className="mt-1 text-sm text-zinc-600">{t('dashboard.upcoming.description')}</p>
                </div>
                <Link to="/calendar" className="shrink-0 text-xs font-black uppercase tracking-[0.08em] text-zinc-950 hover:underline">
                  {t('dashboard.upcoming.viewCalendar')}
                </Link>
              </div>
              {dashboardData.upcoming.length ? (
                <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
                  {dashboardData.upcoming.map((launch) => (
                    <LaunchCard key={launch.id} launch={launch} compact variant="editorial" />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={t('dashboard.upcoming.emptyTitle')}
                  description={t('dashboard.upcoming.emptyDescription')}
                  action={
                    user?.role === USER_ROLES.CREATOR ? (
                      <Link to="/launches/new" className={buttonStyles({ size: 'sm' })}>{t('dashboard.actions.createLaunch')}</Link>
                    ) : null
                  }
                />
              )}
            </section>

            {isAdmin ? (
              <section className="min-w-0 self-start rounded-xl border border-zinc-200 bg-zinc-950 p-5 text-white">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-zinc-400">{t('dashboard.access.eyebrow')}</p>
                <h2 className="mt-3 text-lg font-black tracking-[-0.025em]">{t('dashboard.access.title')}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {t('dashboard.access.description')}
                </p>
                <Link to="/users" className={buttonStyles({ variant: 'inverse', size: 'sm', className: 'mt-6' })}>
                  {t('dashboard.access.action')}
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </Link>
              </section>
            ) : (
            <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-4">
                <div>
                  <h2 className="text-base font-black text-zinc-950">
                    {user?.role === USER_ROLES.APPROVER
                      ? t('dashboard.queue.approverTitle')
                      : t('dashboard.queue.creatorTitle')}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {user?.role === USER_ROLES.APPROVER
                      ? t('dashboard.queue.approverDescription')
                      : t('dashboard.queue.creatorDescription')}
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
                              {launch.market} · {formatLaunchDate(launch.launchDate, language)}
                            </p>
                          </div>
                          <StatusBadge status={launch.status} compact />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-zinc-500">{t('dashboard.queue.empty')}</p>
              )}
            </section>
            )}
          </div>
        </>
      )}
    </div>
  )
}
