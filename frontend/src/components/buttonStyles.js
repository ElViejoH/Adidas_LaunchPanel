export function buttonStyles({ variant = 'primary', size = 'md', className = '' } = {}) {
  const variants = {
    primary: 'border-zinc-950 bg-zinc-950 text-white hover:bg-white hover:text-zinc-950',
    inverse: 'border-zinc-950 bg-zinc-950 text-white hover:bg-white hover:text-zinc-950 focus-visible:ring-white focus-visible:ring-offset-zinc-950',
    secondary: 'border-zinc-300 bg-white text-zinc-950 hover:border-zinc-500 hover:bg-zinc-50',
    ghost: 'border-transparent bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950',
    danger: 'border-red-700 bg-red-700 text-white hover:bg-red-800',
    dangerGhost: 'border-transparent bg-transparent text-red-700 hover:bg-red-50 hover:text-red-800',
    dangerSecondary: 'border-red-300 bg-white text-red-900 hover:border-red-500 hover:bg-red-50',
  }
  const sizes = {
    sm: 'min-h-9 px-3 text-xs',
    md: 'min-h-10 px-4 text-sm',
    lg: 'min-h-12 px-5 text-sm',
    icon: 'size-10 p-0',
  }

  return [
    'font-display inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-bold outline-none transition-colors duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2',
    variants[variant] ?? variants.primary,
    sizes[size] ?? sizes.md,
    className,
  ].join(' ')
}
