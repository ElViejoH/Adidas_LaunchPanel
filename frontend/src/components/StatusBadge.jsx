import { useI18n } from '../hooks/useI18n'
import { STATUS_CONFIG } from '../utils/constants'

export function StatusBadge({ status, compact = false }) {
  const { t } = useI18n()
  const config = STATUS_CONFIG[status]
  const labelKey = compact ? config?.shortLabelKey : config?.labelKey
  const label = labelKey ? t(labelKey) : status || t('statuses.unknown')
  const className = config?.className || 'border-zinc-300 bg-white text-zinc-700'

  return (
    <span
      className={`font-display inline-flex min-h-6 items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.06em] ${className}`}
    >
      {label}
    </span>
  )
}
