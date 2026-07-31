import adidasMark from '../assets/adidas-mark.svg'
import { useI18n } from '../hooks/useI18n'

export function BrandMark({ compact = false, inverse = false }) {
  const { t } = useI18n()

  return (
    <div className="flex min-w-0 items-center gap-3" aria-label={t('brand.accessibleName')}>
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-black"
      >
        <img src={adidasMark} alt="" className="h-auto w-6" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className={`font-display block text-sm font-black tracking-[-0.03em] ${inverse ? 'text-zinc-50' : 'text-zinc-950'}`}>
            {t('brand.productName')}
          </span>
          <span className={`mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] ${inverse ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {t('brand.tagline')}
          </span>
        </span>
      )}
    </div>
  )
}
