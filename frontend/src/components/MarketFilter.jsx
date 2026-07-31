import { useId } from 'react'
import { useI18n } from '../hooks/useI18n'
import { COMMON_MARKETS } from '../utils/constants'

export function MarketFilter({ value, onChange, markets = [] }) {
  const { language, t } = useI18n()
  const suggestionsId = useId()
  const optionMap = new Map(
    COMMON_MARKETS.map((market) => [
      market.value,
      { value: market.value, label: t(market.labelKey) },
    ]),
  )

  const dynamicMarkets = [value, ...markets].filter(Boolean)
  dynamicMarkets.forEach((market) => {
    if (!optionMap.has(market)) optionMap.set(market, { value: market, label: market })
  })

  const options = [...optionMap.values()].sort((a, b) =>
    a.label.localeCompare(b.label, language),
  )

  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-bold text-zinc-700">{t('launch.fields.market')}</span>
      <span className="block">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          list={suggestionsId}
          placeholder={t('filters.allMarkets')}
          autoComplete="off"
          className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
        />
        <datalist id={suggestionsId}>
          {options.map((market) => (
            <option key={market.value} value={market.value} label={market.label} />
          ))}
        </datalist>
      </span>
    </label>
  )
}
