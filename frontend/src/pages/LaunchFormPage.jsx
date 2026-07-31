import { useEffect, useState } from 'react'
import { FloppyDisk, WarningCircle } from '@phosphor-icons/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { buttonStyles } from '../components/buttonStyles'
import { ErrorState, PageSkeleton } from '../components/PageStates'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { tApiError } from '../i18n/apiErrors'
import { launchService } from '../services/launchService'
import { COMMON_MARKETS, CONTENT_LIMITS, USER_ROLES } from '../utils/constants'
import { toInputDate } from '../utils/date'
import { canEditLaunch } from '../utils/permissions'

const initialForm = {
  name: '',
  description: '',
  market: '',
  launchDate: '',
}

export function LaunchFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { t } = useI18n()
  useDocumentTitle(t(isEditing ? 'launchForm.editDocumentTitle' : 'launchForm.newDocumentTitle'))
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [launch, setLaunch] = useState(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (!isEditing) return undefined
    const controller = new AbortController()

    async function loadLaunch() {
      setIsLoading(true)
      try {
        const data = await launchService.getById(id, { signal: controller.signal })
        setLaunch(data)
        setForm({
          name: data.name || '',
          description: data.description || '',
          market: data.market || '',
          launchDate: toInputDate(data.launchDate),
        })
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadLaunch()
    return () => controller.abort()
  }, [id, isEditing])

  const validate = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = { key: 'launchForm.validation.nameRequired' }
    if (form.name.trim().length > CONTENT_LIMITS.launchName) {
      nextErrors.name = {
        key: 'launchForm.validation.nameMaxLength',
        values: { max: CONTENT_LIMITS.launchName },
      }
    }
    if (form.description.trim().length > CONTENT_LIMITS.launchDescription) {
      nextErrors.description = {
        key: 'launchForm.validation.descriptionMaxLength',
        values: { max: CONTENT_LIMITS.launchDescription },
      }
    }
    if (!form.market.trim()) nextErrors.market = { key: 'launchForm.validation.marketRequired' }
    if (form.market.trim().length > CONTENT_LIMITS.market) {
      nextErrors.market = {
        key: 'launchForm.validation.marketMaxLength',
        values: { max: CONTENT_LIMITS.market },
      }
    }
    if (!form.launchDate) {
      nextErrors.launchDate = { key: 'launchForm.validation.launchDateRequired' }
    }
    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: null }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setIsSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      market: form.market.trim(),
      launchDate: `${form.launchDate}T12:00:00.000Z`,
    }

    try {
      const savedLaunch = isEditing
        ? await launchService.update(id, payload)
        : await launchService.create(payload)
      navigate(`/launches/${savedLaunch.id || id}`, { replace: true })
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsSaving(false)
    }
  }

  if (user?.role !== USER_ROLES.CREATOR) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
            <WarningCircle size={25} weight="bold" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-black text-zinc-950">{t('launchForm.creatorOnlyTitle')}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{t('launchForm.creatorOnlyDescription')}</p>
          <Link to="/launches" className={buttonStyles({ variant: 'secondary', className: 'mt-6' })}>{t('launchForm.backToLaunches')}</Link>
        </div>
      </div>
    )
  }

  if (isLoading) return <PageSkeleton rows={5} />
  if (error && !launch && isEditing) return <ErrorState message={tApiError(error, t)} />

  if (isEditing && launch && !canEditLaunch(user, launch)) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
            <WarningCircle size={25} weight="bold" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-black text-zinc-950">{t('launchForm.notEditableTitle')}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{t('launchForm.notEditableDescription')}</p>
          <Link to={`/launches/${id}`} className={buttonStyles({ variant: 'secondary', className: 'mt-6' })}>{t('launchForm.backToDetail')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow={t(isEditing ? 'launchForm.editEyebrow' : 'launchForm.newEyebrow')}
        title={t(isEditing ? 'launchForm.editTitle' : 'launchForm.createTitle')}
        description={t('launchForm.description')}
      />

      {error && <ErrorState title={t('launchForm.saveErrorTitle')} message={tApiError(error, t)} />}

      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white" noValidate>
        <div className="border-b border-zinc-200 p-5 sm:p-6">
          <h2 className="text-base font-black text-zinc-950">{t('launchForm.generalInfoTitle')}</h2>
          <p className="mt-1 text-sm text-zinc-600">{t('launchForm.generalInfoDescription')}</p>
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-zinc-800">{t('launchForm.nameLabel')}</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t('launchForm.namePlaceholder')}
              maxLength={CONTENT_LIMITS.launchName}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-1.5 text-xs font-semibold text-red-700">
                {t(fieldErrors.name.key, fieldErrors.name.values)}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-zinc-800">
              {t('launchForm.descriptionLabel')}{' '}
              <span className="font-semibold text-zinc-500">{t('common.optionalParenthetical')}</span>
            </span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={t('launchForm.descriptionPlaceholder')}
              rows={5}
              maxLength={CONTENT_LIMITS.launchDescription}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={fieldErrors.description ? 'description-error' : undefined}
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3.5 py-3 text-sm leading-6 text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
            />
            {fieldErrors.description && (
              <p id="description-error" className="mt-1.5 text-xs font-semibold text-red-700">
                {t(fieldErrors.description.key, fieldErrors.description.values)}
              </p>
            )}
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-zinc-800">{t('launchForm.marketLabel')}</span>
              <input
                name="market"
                value={form.market}
                onChange={handleChange}
                list="launch-markets"
                placeholder={t('launchForm.marketPlaceholder')}
                maxLength={CONTENT_LIMITS.market}
                aria-invalid={Boolean(fieldErrors.market)}
                aria-describedby={fieldErrors.market ? 'market-error' : undefined}
                className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
              />
              <datalist id="launch-markets">
                {COMMON_MARKETS.map((market) => (
                  <option key={market.value} value={market.value} label={t(market.labelKey)} />
                ))}
              </datalist>
              {fieldErrors.market && (
                <p id="market-error" className="mt-1.5 text-xs font-semibold text-red-700">
                  {t(fieldErrors.market.key, fieldErrors.market.values)}
                </p>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-zinc-800">{t('launchForm.launchDateLabel')}</span>
              <input
                type="date"
                name="launchDate"
                value={form.launchDate}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.launchDate)}
                aria-describedby={fieldErrors.launchDate ? 'date-error' : undefined}
                className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
              />
              {fieldErrors.launchDate && (
                <p id="date-error" className="mt-1.5 text-xs font-semibold text-red-700">
                  {t(fieldErrors.launchDate.key, fieldErrors.launchDate.values)}
                </p>
              )}
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 bg-zinc-50 p-5 sm:flex-row sm:justify-end sm:p-6">
          <Link to={isEditing ? `/launches/${id}` : '/launches'} className={buttonStyles({ variant: 'secondary' })}>{t('common.cancel')}</Link>
          <Button type="submit" disabled={isSaving}>
            <FloppyDisk size={17} weight="bold" aria-hidden="true" />
            {isSaving
              ? t('launchForm.saving')
              : t(isEditing ? 'launchForm.saveChanges' : 'launchForm.createDraft')}
          </Button>
        </div>
      </form>
    </div>
  )
}
