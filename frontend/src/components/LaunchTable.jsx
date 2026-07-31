import { ArrowRight, PencilSimple, Trash } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../hooks/useI18n'
import { formatLaunchDate } from '../utils/date'
import { canDeleteLaunch, canEditLaunch } from '../utils/permissions'
import { buttonStyles } from './buttonStyles'
import { StatusBadge } from './StatusBadge'

export function LaunchTable({ launches, onDelete }) {
  const { user } = useAuth()
  const { language, t } = useI18n()

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-zinc-50 text-[11px] font-extrabold uppercase tracking-[0.1em] text-zinc-500">
            <tr>
              <th className="px-4 py-3">{t('launch.table.launch')}</th>
              <th className="px-4 py-3">{t('launch.table.market')}</th>
              <th className="px-4 py-3">{t('launch.table.date')}</th>
              <th className="px-4 py-3">{t('launch.table.status')}</th>
              <th className="px-4 py-3 text-right">{t('launch.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {launches.map((launch) => {
              const canEdit = canEditLaunch(user, launch)
              const canDelete = canDeleteLaunch(user, launch)
              return (
                <tr key={launch.id} className="text-sm text-zinc-700 hover:bg-zinc-50/80">
                  <td className="max-w-sm px-4 py-3.5">
                    <Link
                      to={`/launches/${launch.id}`}
                      className="block truncate font-black text-zinc-950 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-zinc-950"
                    >
                      {launch.name}
                    </Link>
                    <span className="mt-0.5 block truncate text-xs text-zinc-500">
                      {launch.creator?.name || t('launch.teamFallback')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold">{launch.market || t('launch.emptyMarket')}</td>
                  <td className="px-4 py-3.5 font-semibold capitalize">{formatLaunchDate(launch.launchDate, language)}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={launch.status} compact />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Link
                          to={`/launches/${launch.id}/edit`}
                          className={buttonStyles({ variant: 'ghost', size: 'icon', className: 'size-9' })}
                          aria-label={t('launch.actions.editAria', { name: launch.name })}
                        >
                          <PencilSimple size={17} weight="bold" />
                        </Link>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(launch)}
                          className={buttonStyles({ variant: 'dangerGhost', size: 'icon', className: 'size-9' })}
                          aria-label={t('launch.actions.deleteAria', { name: launch.name })}
                        >
                          <Trash size={17} weight="bold" />
                        </button>
                      )}
                      <Link
                        to={`/launches/${launch.id}`}
                        className={buttonStyles({ variant: 'ghost', size: 'icon', className: 'size-9' })}
                        aria-label={t('launch.actions.viewAria', { name: launch.name })}
                      >
                        <ArrowRight size={17} weight="bold" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
