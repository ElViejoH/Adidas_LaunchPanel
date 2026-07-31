import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useI18n } from '../hooks/useI18n'

export function SearchBar({ value, onChange, placeholder, label }) {
  const { t } = useI18n()

  return (
    <label className="block min-w-0">
      <span className="sr-only">{label ?? t('common.search')}</span>
      <span className="relative block">
        <MagnifyingGlass
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          size={18}
          weight="bold"
        />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? t('launch.searchPlaceholder')}
          className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-10 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
            aria-label={t('common.clearSearch')}
          >
            <X size={15} weight="bold" />
          </button>
        )}
      </span>
    </label>
  )
}
