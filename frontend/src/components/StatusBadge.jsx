import { STATUS_CONFIG } from '../utils/constants'

export function StatusBadge({ status, compact = false }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status || 'Sin estado',
    shortLabel: status || 'Sin estado',
    className: 'border-zinc-300 bg-white text-zinc-700',
  }

  return (
    <span
      className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.06em] ${config.className}`}
    >
      {compact ? config.shortLabel : config.label}
    </span>
  )
}
