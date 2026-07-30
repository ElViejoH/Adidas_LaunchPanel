import { useId } from 'react'
import { COMMON_MARKETS } from '../utils/constants'

export function MarketFilter({ value, onChange, markets = [] }) {
  const suggestionsId = useId()
  const options = [...new Set([value, ...COMMON_MARKETS, ...markets].filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  )

  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-bold text-zinc-700">Mercado</span>
      <span className="block">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          list={suggestionsId}
          placeholder="Todos los mercados"
          autoComplete="off"
          className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
        />
        <datalist id={suggestionsId}>
          {options.map((market) => (
            <option key={market} value={market} />
          ))}
        </datalist>
      </span>
    </label>
  )
}
