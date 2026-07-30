import { Check, ClockCounterClockwise } from '@phosphor-icons/react'
import { LAUNCH_STATUSES, STATUS_CONFIG, STATUS_ORDER } from '../utils/constants'
import { formatDateTime } from '../utils/date'
import { StatusBadge } from './StatusBadge'

export function LaunchTimeline({ currentStatus, history = [] }) {
  const reviewOutcome = [
    LAUNCH_STATUSES.CHANGES_REQUESTED,
    LAUNCH_STATUSES.REJECTED,
  ].includes(currentStatus) ? currentStatus : null
  const progressStatus = reviewOutcome ? LAUNCH_STATUSES.IN_REVIEW : currentStatus
  const currentIndex = STATUS_ORDER.indexOf(progressStatus)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  )

  return (
    <div>
      <ol className="grid grid-cols-4 gap-1" aria-label="Progreso del lanzamiento">
        {STATUS_ORDER.map((status, index) => {
          const reached = index <= currentIndex
          const active = index === currentIndex
          return (
            <li key={status} className="relative min-w-0 text-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute right-1/2 top-4 h-px w-full ${index <= currentIndex ? 'bg-zinc-950' : 'bg-zinc-200'}`}
                />
              )}
              <span
                className={`relative mx-auto grid size-8 place-items-center rounded-lg border ${
                  reached ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 bg-white text-zinc-400'
                } ${active ? 'ring-2 ring-zinc-950/15 ring-offset-2' : ''}`}
              >
                {reached ? <Check size={15} weight="bold" /> : <span className="text-xs font-black">{index + 1}</span>}
              </span>
              <span className={`mt-2 block truncate text-[10px] font-extrabold uppercase tracking-[0.04em] ${reached ? 'text-zinc-950' : 'text-zinc-400'}`}>
                {STATUS_CONFIG[status].shortLabel}
              </span>
            </li>
          )
        })}
      </ol>

      {reviewOutcome && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
          <span className="text-xs font-black uppercase tracking-[0.08em] text-zinc-500">
            Resultado de revisión
          </span>
          <StatusBadge status={reviewOutcome} />
        </div>
      )}

      <div className="mt-7 border-t border-zinc-200 pt-5">
        <h3 className="text-sm font-black text-zinc-950">Historial de cambios</h3>
        {sortedHistory.length === 0 ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
            <ClockCounterClockwise className="mt-0.5 shrink-0" size={19} weight="bold" aria-hidden="true" />
            <p>Este lanzamiento todavía no registra transiciones de estado.</p>
          </div>
        ) : (
          <ol className="mt-4 space-y-0">
            {sortedHistory.map((event, index) => {
              const actor = event.changedBy?.name || event.changedByUser?.name || 'Usuario del equipo'
              return (
                <li key={event.id ?? `${event.newStatus}-${event.createdAt}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < sortedHistory.length - 1 && (
                    <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-zinc-200" aria-hidden="true" />
                  )}
                  <span className="relative grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-300 bg-white text-zinc-700">
                    <ClockCounterClockwise size={16} weight="bold" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={event.newStatus} compact />
                      <span className="text-xs font-semibold text-zinc-500">{formatDateTime(event.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-zinc-700">
                      Cambio realizado por <strong className="font-black text-zinc-950">{actor}</strong>.
                    </p>
                    {event.comment && (
                      <p className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-600">
                        {event.comment}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
