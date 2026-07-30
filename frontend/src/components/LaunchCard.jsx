import { ArrowRight, CalendarBlank, GlobeHemisphereWest, UserCircle } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { formatLaunchDate } from '../utils/date'
import { StatusBadge } from './StatusBadge'

export function LaunchCard({ launch, compact = false }) {
  return (
    <article className="group flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={launch.status} compact={compact} />
        <span className="text-xs font-bold text-zinc-400">#{String(launch.id).padStart(3, '0')}</span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-base font-black tracking-[-0.02em] text-zinc-950">
        {launch.name}
      </h3>
      {!compact && (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">
          {launch.description || 'Sin descripción operativa.'}
        </p>
      )}

      <dl className="mt-5 space-y-2 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <CalendarBlank size={16} weight="bold" aria-hidden="true" />
          <dt className="sr-only">Fecha</dt>
          <dd className="font-semibold capitalize">{formatLaunchDate(launch.launchDate)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <GlobeHemisphereWest size={16} weight="bold" aria-hidden="true" />
          <dt className="sr-only">Mercado</dt>
          <dd className="truncate font-semibold">{launch.market || 'Sin mercado'}</dd>
        </div>
        {launch.creator?.name && (
          <div className="flex items-center gap-2">
            <UserCircle size={16} weight="bold" aria-hidden="true" />
            <dt className="sr-only">Creador</dt>
            <dd className="truncate font-semibold">{launch.creator.name}</dd>
          </div>
        )}
      </dl>

      <Link
        to={`/launches/${launch.id}`}
        className="mt-5 inline-flex items-center gap-2 border-t border-zinc-100 pt-4 text-xs font-black uppercase tracking-[0.08em] text-zinc-950 outline-none group-hover:gap-3 focus-visible:ring-2 focus-visible:ring-zinc-950"
      >
        Ver lanzamiento
        <ArrowRight size={15} weight="bold" aria-hidden="true" />
      </Link>
    </article>
  )
}
