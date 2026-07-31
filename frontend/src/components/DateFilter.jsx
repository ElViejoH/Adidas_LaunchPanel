import { useI18n } from '../hooks/useI18n'

export function DateFilter({ from, to, onFromChange, onToChange }) {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="block min-w-0">
        <span className="mb-1.5 block text-xs font-bold text-zinc-700">{t('filters.dateFrom')}</span>
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => onFromChange(event.target.value)}
          className="min-h-10 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
        />
      </label>
      <label className="block min-w-0">
        <span className="mb-1.5 block text-xs font-bold text-zinc-700">{t('filters.dateTo')}</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => onToChange(event.target.value)}
          className="min-h-10 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
        />
      </label>
    </div>
  )
}
