import { useMemo, useState } from 'react'
import { CalendarBlank, CaretDown, CaretLeft, CaretRight, Plus } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '../components/Button'
import { buttonStyles } from '../components/buttonStyles'
import { MarketFilter } from '../components/MarketFilter'
import { EmptyState, ErrorState, PageSkeleton } from '../components/PageStates'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useLaunches } from '../hooks/useLaunches'
import { STATUS_CONFIG, STATUS_ORDER, USER_ROLES } from '../utils/constants'
import { formatLaunchDate, toDate } from '../utils/date'

const weekdays = [
  { short: 'Lun', full: 'Lunes' },
  { short: 'Mar', full: 'Martes' },
  { short: 'Mié', full: 'Miércoles' },
  { short: 'Jue', full: 'Jueves' },
  { short: 'Vie', full: 'Viernes' },
  { short: 'Sáb', full: 'Sábado' },
  { short: 'Dom', full: 'Domingo' },
]

export function CalendarPage() {
  useDocumentTitle('Calendario')
  const { user } = useAuth()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [market, setMarket] = useState('')
  const [status, setStatus] = useState('')
  const debouncedMarket = useDebounce(market, 350)

  const { visibleStart, visibleEnd } = useMemo(() => {
    const currentMonthStart = startOfMonth(month)
    const currentMonthEnd = endOfMonth(month)
    return {
      visibleStart: startOfWeek(currentMonthStart, { weekStartsOn: 1 }),
      visibleEnd: endOfWeek(currentMonthEnd, { weekStartsOn: 1 }),
    }
  }, [month])
  const filters = useMemo(
    () => ({
      from: format(visibleStart, 'yyyy-MM-dd'),
      to: format(visibleEnd, 'yyyy-MM-dd'),
      market: debouncedMarket,
      status,
      limit: 100,
      sortBy: 'launchDate',
      sortOrder: 'asc',
    }),
    [debouncedMarket, status, visibleEnd, visibleStart],
  )
  const { launches, isLoading, error, reload } = useLaunches(filters)

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: visibleStart,
        end: visibleEnd,
      }),
    [visibleEnd, visibleStart],
  )

  const calendarWeeks = useMemo(
    () =>
      Array.from({ length: calendarDays.length / 7 }, (_, weekIndex) =>
        calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7),
      ),
    [calendarDays],
  )

  const monthLaunches = useMemo(
    () =>
      launches.filter((launch) => {
        const date = toDate(launch.launchDate)
        return date && isSameMonth(date, month)
      }),
    [launches, month],
  )

  const launchesByDay = useMemo(() => {
    const grouped = new Map()
    launches.forEach((launch) => {
      const date = toDate(launch.launchDate)
      if (!date) return
      const key = format(date, 'yyyy-MM-dd')
      grouped.set(key, [...(grouped.get(key) || []), launch])
    })
    return grouped
  }, [launches])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planificación mensual"
        title="Calendario de lanzamientos"
        description="Visualiza fechas, mercados y estados sobre una única ventana operativa."
        actions={
          user?.role === USER_ROLES.CREATOR ? (
            <Link to="/launches/new" className={buttonStyles()}>
              <Plus size={17} weight="bold" aria-hidden="true" />
              Nuevo lanzamiento
            </Link>
          ) : null
        }
      />

      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <Button variant="secondary" size="icon" onClick={() => setMonth((current) => subMonths(current, 1))} aria-label="Mes anterior">
            <CaretLeft size={18} weight="bold" />
          </Button>
          <div className="min-w-40 text-center sm:min-w-52">
            <p className="text-lg font-black capitalize tracking-[-0.025em] text-zinc-950">
              {format(month, 'MMMM yyyy', { locale: es })}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-zinc-500">{monthLaunches.length} lanzamientos</p>
          </div>
          <Button variant="secondary" size="icon" onClick={() => setMonth((current) => addMonths(current, 1))} aria-label="Mes siguiente">
            <CaretRight size={18} weight="bold" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMonth(startOfMonth(new Date()))} className="hidden sm:inline-flex">
            Hoy
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[460px]">
          <MarketFilter value={market} onChange={setMarket} markets={launches.map((launch) => launch.market)} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-zinc-700">Estado</span>
            <span className="relative block">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="min-h-10 w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-9 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              >
                <option value="">Todos los estados</option>
                {STATUS_ORDER.map((value) => <option key={value} value={value}>{STATUS_CONFIG[value].label}</option>)}
              </select>
              <CaretDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} weight="bold" />
            </span>
          </label>
        </div>
      </section>

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : isLoading ? (
        <PageSkeleton rows={6} />
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block" aria-label={`Calendario de ${format(month, 'MMMM yyyy', { locale: es })}`}>
            <div
              role="grid"
              aria-label={`Lanzamientos de ${format(month, 'MMMM yyyy', { locale: es })}`}
              aria-colcount={7}
              aria-rowcount={calendarWeeks.length + 1}
            >
              <div role="row" className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
                {weekdays.map((day) => (
                  <div
                    key={day.short}
                    role="columnheader"
                    aria-label={day.full}
                    className="px-3 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-[0.1em] text-zinc-500"
                  >
                    {day.short}
                  </div>
                ))}
              </div>
              <div role="rowgroup">
                {calendarWeeks.map((week, weekIndex) => (
                  <div key={format(week[0], 'yyyy-MM-dd')} role="row" aria-rowindex={weekIndex + 2} className="grid grid-cols-7">
                    {week.map((day, dayIndex) => {
                      const key = format(day, 'yyyy-MM-dd')
                      const dayLaunches = launchesByDay.get(key) || []
                      const inCurrentMonth = isSameMonth(day, month)
                      const today = isSameDay(day, new Date())
                      const dateLabel = format(day, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })

                      return (
                        <div
                          key={key}
                          role="gridcell"
                          aria-label={dateLabel}
                          aria-current={today ? 'date' : undefined}
                          aria-colindex={dayIndex + 1}
                          className={`min-h-32 border-b border-r border-zinc-100 p-2.5 ${!inCurrentMonth ? 'bg-zinc-50/70 text-zinc-400' : 'bg-white'} ${dayIndex === 6 ? 'border-r-0' : ''}`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span aria-hidden="true" className={`grid size-7 place-items-center rounded-md text-xs font-black ${today ? 'bg-zinc-950 text-white' : 'text-zinc-600'}`}>
                              {format(day, 'd')}
                            </span>
                            {dayLaunches.length > 0 && <span className="text-[10px] font-black text-zinc-500" aria-label={`${dayLaunches.length} lanzamientos`}>{dayLaunches.length}</span>}
                          </div>
                          <div className="space-y-1.5">
                            {dayLaunches.slice(0, 3).map((launch) => (
                              <Link
                                key={launch.id}
                                to={`/launches/${launch.id}`}
                                title={launch.name}
                                className="block rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 outline-none hover:border-zinc-400 hover:bg-white focus-visible:ring-2 focus-visible:ring-zinc-950"
                              >
                                <span className="block truncate text-[11px] font-black text-zinc-950">{launch.name}</span>
                                <span className="mt-0.5 block truncate text-[10px] font-semibold text-zinc-600">{launch.market}</span>
                              </Link>
                            ))}
                            {dayLaunches.length > 3 && <p className="px-1 text-[10px] font-black text-zinc-600">+{dayLaunches.length - 3} más</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="md:hidden">
            {monthLaunches.length === 0 ? (
              <EmptyState title="Mes sin lanzamientos" description="Cambia de mes o ajusta los filtros para explorar el calendario." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="flex items-center gap-2 border-b border-zinc-200 p-4">
                  <CalendarBlank size={19} weight="bold" aria-hidden="true" />
                  <h2 className="text-sm font-black capitalize text-zinc-950">{format(month, 'MMMM yyyy', { locale: es })}</h2>
                </div>
                <ul>
                  {monthLaunches.map((launch) => (
                    <li key={launch.id} className="border-b border-zinc-100 last:border-0">
                      <Link to={`/launches/${launch.id}`} className="flex items-center justify-between gap-3 p-4 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-950">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-zinc-950">{launch.name}</p>
                          <p className="mt-1 text-xs font-semibold capitalize text-zinc-500">{formatLaunchDate(launch.launchDate)} · {launch.market}</p>
                        </div>
                        <StatusBadge status={launch.status} compact />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
