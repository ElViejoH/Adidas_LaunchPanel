export function BrandMark({ compact = false, inverse = false }) {
  return (
    <div className="flex min-w-0 items-center gap-3" aria-label="Adidas Launch Panel">
      <span
        aria-hidden="true"
        className={`grid size-9 shrink-0 place-items-center rounded-lg border text-[10px] font-black tracking-[-0.04em] ${
          inverse
            ? 'border-zinc-700 bg-zinc-100 text-zinc-950'
            : 'border-zinc-950 bg-zinc-950 text-zinc-50'
        }`}
      >
        ALP
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className={`block text-sm font-black tracking-[-0.03em] ${inverse ? 'text-zinc-50' : 'text-zinc-950'}`}>
            LAUNCH PANEL
          </span>
          <span className={`mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] ${inverse ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Product operations
          </span>
        </span>
      )}
    </div>
  )
}
