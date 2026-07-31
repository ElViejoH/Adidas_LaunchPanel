import { Archive, WarningCircle } from '@phosphor-icons/react'
import { useI18n } from '../hooks/useI18n'
import { Button } from './Button'

export function PageSkeleton({ rows = 5, cards = false }) {
  const { t } = useI18n()

  return (
    <div className={cards ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'} aria-label={t('common.loadingContent')}>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded-xl border border-zinc-200 bg-white ${cards ? 'h-44 p-5' : 'h-16 p-4'}`}
        >
          <div className="h-3 w-24 rounded bg-zinc-200" />
          <div className="mt-4 h-4 w-3/5 rounded bg-zinc-200" />
          {cards && <div className="mt-6 h-3 w-2/5 rounded bg-zinc-100" />}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-11 place-items-center rounded-lg bg-zinc-100 text-zinc-600">
          <Archive size={23} weight="bold" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-base font-black text-zinc-950">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-zinc-600">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  )
}

export function ErrorState({ title, message, onRetry }) {
  const { t } = useI18n()

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-950" role="alert">
      <div className="flex items-start gap-3">
        <WarningCircle className="mt-0.5 shrink-0" size={21} weight="bold" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="font-black">{title ?? t('common.loadErrorTitle')}</h3>
          <p className="mt-1 text-sm leading-6 text-red-800">{message || t('common.tryAgainLater')}</p>
          {onRetry && (
            <Button variant="dangerSecondary" size="sm" className="mt-3" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
