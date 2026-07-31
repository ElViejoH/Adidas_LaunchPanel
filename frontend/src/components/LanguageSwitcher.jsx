import { useI18n } from '../hooks/useI18n'

const languages = ['es', 'en']

export function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('language.selector')}
      className={`inline-flex shrink-0 rounded-lg border border-zinc-300 bg-white/95 p-0.5 opacity-70 shadow-sm transition-opacity hover:opacity-100 focus-within:opacity-100 ${className}`}
    >
      {languages.map((value) => {
        const selected = language === value
        const accessibleLabel = value === 'es'
          ? t('language.switchToSpanish')
          : t('language.switchToEnglish')

        return (
          <button
            key={value}
            type="button"
            aria-label={accessibleLabel}
            aria-pressed={selected}
            title={accessibleLabel}
            onClick={() => setLanguage(value)}
            className={`min-h-8 min-w-9 rounded-md px-2 font-display text-[11px] font-black uppercase tracking-[0.08em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1 ${
              selected
                ? 'border border-zinc-950 bg-zinc-950 text-white hover:bg-white hover:text-zinc-950'
                : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
            }`}
          >
            {value}
          </button>
        )
      })}
    </div>
  )
}
