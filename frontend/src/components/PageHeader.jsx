export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="grid gap-5 border-b border-zinc-300 pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="grid min-w-0 grid-cols-[4px_minmax(0,1fr)] gap-4 sm:gap-5">
        <span className="bg-zinc-950" aria-hidden="true" />
        <div className="min-w-0">
          {eyebrow && <p className="mb-1.5 text-sm font-bold text-zinc-600">{eyebrow}</p>}
          <h1 className="text-3xl font-black leading-none tracking-[-0.045em] text-zinc-950 sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
