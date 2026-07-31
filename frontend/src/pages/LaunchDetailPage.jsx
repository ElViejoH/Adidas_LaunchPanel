import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  CalendarBlank,
  File,
  FileText,
  GlobeHemisphereWest,
  ImageSquare,
  PencilSimple,
  Plus,
  Trash,
  UserCircle,
  VideoCamera,
} from '@phosphor-icons/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { buttonStyles } from '../components/buttonStyles'
import { ConfirmModal } from '../components/ConfirmModal'
import { LaunchTimeline } from '../components/LaunchTimeline'
import { ErrorState, PageSkeleton } from '../components/PageStates'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { tApiError } from '../i18n/apiErrors'
import { launchService } from '../services/launchService'
import { ASSET_TYPES, CONTENT_LIMITS, LAUNCH_STATUSES, STATUS_CONFIG } from '../utils/constants'
import { formatDateTime, formatLongDate } from '../utils/date'
import {
  canDeleteLaunch,
  canEditLaunch,
  canManageAssets,
  getAllowedStatusTransitions,
} from '../utils/permissions'

const assetIcons = {
  IMAGE: ImageSquare,
  VIDEO: VideoCamera,
  DOCUMENT: FileText,
  COPY: FileText,
  OTHER: File,
}

const transitionConfig = {
  [LAUNCH_STATUSES.DRAFT]: {
    labelKey: 'launchDetail.transitions.reopenDraft.label',
    descriptionKey: 'launchDetail.transitions.reopenDraft.description',
    variant: 'secondary',
  },
  [LAUNCH_STATUSES.IN_REVIEW]: {
    labelKey: 'launchDetail.transitions.submitReview.label',
    descriptionKey: 'launchDetail.transitions.submitReview.description',
  },
  [LAUNCH_STATUSES.APPROVED]: {
    labelKey: 'launchDetail.transitions.approve.label',
    descriptionKey: 'launchDetail.transitions.approve.description',
  },
  [LAUNCH_STATUSES.PUBLISHED]: {
    labelKey: 'launchDetail.transitions.publish.label',
    descriptionKey: 'launchDetail.transitions.publish.description',
  },
  [LAUNCH_STATUSES.CHANGES_REQUESTED]: {
    labelKey: 'launchDetail.transitions.requestChanges.label',
    descriptionKey: 'launchDetail.transitions.requestChanges.description',
    variant: 'dangerSecondary',
    commentRequired: true,
  },
  [LAUNCH_STATUSES.REJECTED]: {
    labelKey: 'launchDetail.transitions.reject.label',
    descriptionKey: 'launchDetail.transitions.reject.description',
    variant: 'danger',
    tone: 'danger',
    commentRequired: true,
  },
}

function translateValidationError(error, t) {
  if (!error) return ''
  if (error.apiError) return tApiError(error.apiError, t)
  return t(error.key, error.values)
}

export function LaunchDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { language, t } = useI18n()
  const [launch, setLaunch] = useState(null)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState(null)
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [assetForm, setAssetForm] = useState({ name: '', type: 'IMAGE', url: '' })
  const [assetErrors, setAssetErrors] = useState({})
  useDocumentTitle(launch?.name || t('launchDetail.documentTitle'))

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const [launchData, historyData] = await Promise.all([
          launchService.getById(id, { signal: controller.signal }),
          launchService.getHistory(id, { signal: controller.signal }),
        ])
        setLaunch(launchData)
        setHistory(historyData)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [id, reloadKey])

  const permissions = useMemo(
    () => ({
      edit: canEditLaunch(user, launch),
      remove: canDeleteLaunch(user, launch),
      assets: canManageAssets(user, launch),
      transitions: getAllowedStatusTransitions(user, launch),
    }),
    [launch, user],
  )
  const assetCount = launch?.assets?.length || 0
  const assetLimitReached = assetCount >= CONTENT_LIMITS.assetsPerLaunch

  const refresh = () => setReloadKey((key) => key + 1)

  const activeTransition = selectedStatus ? transitionConfig[selectedStatus] : null

  const closeStatusModal = () => {
    setSelectedStatus(null)
    setComment('')
    setCommentError(false)
  }

  const handleStatusChange = async () => {
    if (!selectedStatus || !permissions.transitions.includes(selectedStatus)) return
    if (activeTransition?.commentRequired && !comment.trim()) {
      setCommentError(true)
      return
    }
    setIsMutating(true)
    setActionError(null)
    try {
      await launchService.changeStatus(id, {
        status: selectedStatus,
        comment: comment.trim() || undefined,
      })
      closeStatusModal()
      refresh()
    } catch (requestError) {
      setActionError(requestError)
      closeStatusModal()
    } finally {
      setIsMutating(false)
    }
  }

  const handleDelete = async () => {
    setIsMutating(true)
    setActionError(null)
    try {
      await launchService.remove(id)
      navigate('/launches', { replace: true })
    } catch (requestError) {
      setActionError(requestError)
      setDeleteModalOpen(false)
      setIsMutating(false)
    }
  }

  const handleAssetSubmit = async (event) => {
    event.preventDefault()
    if (assetLimitReached) {
      setAssetErrors({
        form: {
          key: 'launchDetail.validation.assetLimit',
          values: { count: CONTENT_LIMITS.assetsPerLaunch },
        },
      })
      return
    }
    const nextErrors = {}
    if (!assetForm.name.trim()) {
      nextErrors.name = { key: 'launchDetail.validation.assetNameRequired' }
    }
    if (assetForm.name.trim().length > CONTENT_LIMITS.assetName) {
      nextErrors.name = {
        key: 'launchDetail.validation.assetNameMax',
        values: { count: CONTENT_LIMITS.assetName },
      }
    }
    if (!assetForm.url.trim()) {
      nextErrors.url = { key: 'launchDetail.validation.assetUrlRequired' }
    } else if (assetForm.url.trim().length > CONTENT_LIMITS.assetUrl) {
      nextErrors.url = {
        key: 'launchDetail.validation.assetUrlMax',
        values: { count: CONTENT_LIMITS.assetUrl },
      }
    } else {
      try {
        const url = new URL(assetForm.url)
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
      } catch {
        nextErrors.url = { key: 'launchDetail.validation.assetUrlInvalid' }
      }
    }
    setAssetErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsMutating(true)
    try {
      await launchService.addAsset(id, {
        name: assetForm.name.trim(),
        type: assetForm.type,
        url: assetForm.url.trim(),
      })
      setAssetForm({ name: '', type: 'IMAGE', url: '' })
      setAssetErrors({})
      refresh()
    } catch (requestError) {
      setAssetErrors({ form: { apiError: requestError } })
    } finally {
      setIsMutating(false)
    }
  }

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return
    setIsMutating(true)
    setAssetErrors({})
    try {
      await launchService.deleteAsset(assetToDelete.id)
      setAssetToDelete(null)
      refresh()
    } catch (requestError) {
      setAssetErrors({ form: { apiError: requestError } })
      setAssetToDelete(null)
    } finally {
      setIsMutating(false)
    }
  }

  if (isLoading) return <PageSkeleton rows={7} />

  if (error || !launch) {
    return (
      <div className="space-y-4">
        <Link to="/launches" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          {t('launchDetail.actions.back')}
        </Link>
        <ErrorState
          message={error ? tApiError(error, t) : t('launchDetail.errors.notFound')}
          onRetry={refresh}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/launches" className="inline-flex items-center gap-2 text-sm font-black text-zinc-700 outline-none hover:text-zinc-950 hover:underline focus-visible:ring-2 focus-visible:ring-zinc-950">
          <ArrowLeft size={17} weight="bold" aria-hidden="true" />
          {t('launchDetail.actions.backToLaunches')}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {permissions.edit && (
            <Link to={`/launches/${id}/edit`} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
              <PencilSimple size={16} weight="bold" aria-hidden="true" />
              {t('launchDetail.actions.edit')}
            </Link>
          )}
          {permissions.remove && (
            <Button variant="dangerGhost" size="sm" onClick={() => setDeleteModalOpen(true)}>
              <Trash size={16} weight="bold" aria-hidden="true" />
              {t('launchDetail.actions.delete')}
            </Button>
          )}
          {permissions.transitions.map((status) => {
            const config = transitionConfig[status]
            return (
              <Button
                key={status}
                variant={config?.variant}
                size="sm"
                onClick={() => setSelectedStatus(status)}
              >
                {config?.labelKey
                  ? t(config.labelKey)
                  : t('launchDetail.actions.changeStatus')}
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Button>
            )
          })}
        </div>
      </div>

      {actionError && (
        <ErrorState
          title={t('launchDetail.errors.actionFailed')}
          message={tApiError(actionError, t)}
        />
      )}

      <header className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <StatusBadge status={launch.status} />
            <h1 className="mt-4 text-2xl font-black tracking-[-0.03em] text-zinc-950 sm:text-4xl">{launch.name}</h1>
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-zinc-600">
              {launch.description || t('launchDetail.fallback.noDescription')}
            </p>
          </div>
          <span className="shrink-0 text-xs font-black text-zinc-400">ID #{String(launch.id).padStart(3, '0')}</span>
        </div>

        <dl className="mt-7 grid gap-4 border-t border-zinc-200 pt-5 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
              <GlobeHemisphereWest size={18} weight="bold" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-xs font-bold text-zinc-500">{t('launchDetail.fields.market')}</dt>
              <dd className="mt-1 text-sm font-black text-zinc-950">
                {launch.market || t('launchDetail.fallback.noMarket')}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
              <CalendarBlank size={18} weight="bold" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-xs font-bold text-zinc-500">{t('launchDetail.fields.launchDate')}</dt>
              <dd className="mt-1 text-sm font-black text-zinc-950 first-letter:uppercase">
                {formatLongDate(launch.launchDate, language)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
              <UserCircle size={18} weight="bold" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-xs font-bold text-zinc-500">{t('launchDetail.fields.creator')}</dt>
              <dd className="mt-1 text-sm font-black text-zinc-950">
                {launch.creator?.name || t('launchDetail.fallback.launchTeam')}
              </dd>
            </div>
          </div>
        </dl>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.8fr)]">
        <section className="min-w-0 rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-zinc-200 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-black text-zinc-950">
                {t('launchDetail.assets.title')}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {t('launchDetail.assets.description')}
              </p>
            </div>
            <span className="text-2xl font-black tracking-[-0.04em] text-zinc-950">{assetCount}/{CONTENT_LIMITS.assetsPerLaunch}</span>
          </div>

          {assetErrors.form && (
            <p id="asset-form-error" className="mx-5 mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 sm:mx-6" role="alert">
              {translateValidationError(assetErrors.form, t)}
            </p>
          )}

          {launch.assets?.length ? (
            <ul className="p-5 sm:p-6">
              {launch.assets.map((asset) => {
                const AssetIcon = assetIcons[asset.type] || File
                const assetType = ASSET_TYPES.find((type) => type.value === asset.type)
                return (
                  <li key={asset.id} className="flex items-center gap-3 border-b border-zinc-100 py-3 first:pt-0 last:border-0 last:pb-0">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
                      <AssetIcon size={20} weight="bold" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-zinc-950">{asset.name}</p>
                      <p className="mt-0.5 text-xs font-bold text-zinc-500">
                        {assetType?.labelKey
                          ? t(assetType.labelKey)
                          : asset.type}
                      </p>
                    </div>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-600 outline-none hover:bg-zinc-100 hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-950"
                      aria-label={t('launchDetail.assets.open', { name: asset.name })}
                    >
                      <ArrowSquareOut size={17} weight="bold" />
                    </a>
                    {permissions.assets && (
                      <button
                        type="button"
                        onClick={() => setAssetToDelete(asset)}
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-red-700 outline-none hover:bg-red-50 hover:text-red-800 focus-visible:ring-2 focus-visible:ring-red-700"
                        aria-label={t('launchDetail.assets.delete', { name: asset.name })}
                      >
                        <Trash size={17} weight="bold" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-zinc-500 sm:px-6">
              {t('launchDetail.assets.empty')}
            </p>
          )}

          {permissions.assets && assetLimitReached && (
            <p className="border-t border-zinc-200 bg-zinc-50 px-5 py-4 text-sm font-semibold text-zinc-600 sm:px-6">
              {t('launchDetail.assets.limitReached', {
                count: CONTENT_LIMITS.assetsPerLaunch,
              })}
            </p>
          )}

          {permissions.assets && !assetLimitReached && (
            <form
              onSubmit={handleAssetSubmit}
              className="border-t border-zinc-200 bg-zinc-50 p-5 sm:p-6"
              aria-describedby={assetErrors.form ? 'asset-form-error' : undefined}
              noValidate
            >
              <div className="mb-4 flex items-center gap-2">
                <Plus size={17} weight="bold" aria-hidden="true" />
                <h3 className="text-sm font-black text-zinc-950">
                  {t('launchDetail.assets.addTitle')}
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-zinc-700">
                    {t('launchDetail.assets.name')}
                  </span>
                  <input
                    value={assetForm.name}
                    onChange={(event) => {
                      setAssetForm((current) => ({ ...current, name: event.target.value }))
                      setAssetErrors((current) => ({ ...current, name: null, form: null }))
                    }}
                    placeholder={t('launchDetail.assets.namePlaceholder')}
                    maxLength={CONTENT_LIMITS.assetName}
                    aria-invalid={Boolean(assetErrors.name)}
                    aria-describedby={assetErrors.name ? 'asset-name-error' : undefined}
                    className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
                  />
                  {assetErrors.name && (
                    <p id="asset-name-error" className="mt-1.5 text-xs font-semibold text-red-700" role="alert">
                      {translateValidationError(assetErrors.name, t)}
                    </p>
                  )}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-zinc-700">
                    {t('launchDetail.assets.type')}
                  </span>
                  <select
                    value={assetForm.type}
                    onChange={(event) => setAssetForm((current) => ({ ...current, type: event.target.value }))}
                    className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                  >
                    {ASSET_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{t(type.labelKey)}</option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold text-zinc-700">
                    {t('launchDetail.assets.url')}
                  </span>
                  <input
                    type="url"
                    value={assetForm.url}
                    onChange={(event) => {
                      setAssetForm((current) => ({ ...current, url: event.target.value }))
                      setAssetErrors((current) => ({ ...current, url: null, form: null }))
                    }}
                    placeholder="https://drive.example.com/asset"
                    maxLength={CONTENT_LIMITS.assetUrl}
                    aria-invalid={Boolean(assetErrors.url)}
                    aria-describedby={assetErrors.url ? 'asset-url-error' : undefined}
                    className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
                  />
                  {assetErrors.url && (
                    <p id="asset-url-error" className="mt-1.5 text-xs font-semibold text-red-700" role="alert">
                      {translateValidationError(assetErrors.url, t)}
                    </p>
                  )}
                </label>
              </div>
              <Button type="submit" size="sm" className="mt-4" disabled={isMutating}>
                <Plus size={16} weight="bold" aria-hidden="true" />
                {isMutating
                  ? t('launchDetail.assets.adding')
                  : t('launchDetail.assets.add')}
              </Button>
            </form>
          )}
        </section>

        <aside className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-black text-zinc-950">
              {t('launchDetail.timeline.title')}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {t('launchDetail.timeline.description')}
            </p>
          </div>
          <LaunchTimeline currentStatus={launch.status} history={history} />
          <p className="mt-6 border-t border-zinc-200 pt-4 text-xs leading-5 text-zinc-500">
            {t('launchDetail.timeline.lastUpdated', {
              date: formatDateTime(launch.updatedAt, language),
            })}
          </p>
        </aside>
      </div>

      <ConfirmModal
        isOpen={Boolean(selectedStatus)}
        title={activeTransition?.labelKey
          ? t(activeTransition.labelKey)
          : t('launchDetail.actions.changeStatus')}
        description={`${
          activeTransition?.descriptionKey
            ? t(activeTransition.descriptionKey)
            : t('launchDetail.transitions.fallbackDescription', {
                status: STATUS_CONFIG[selectedStatus]?.labelKey
                  ? t(STATUS_CONFIG[selectedStatus].labelKey)
                  : t('launchDetail.transitions.otherStatus'),
              })
        } ${t('launchDetail.transitions.historyNotice')}`}
        confirmLabel={activeTransition?.labelKey
          ? t(activeTransition.labelKey)
          : t('launchDetail.transitions.confirmChange')}
        onConfirm={handleStatusChange}
        onClose={closeStatusModal}
        isLoading={isMutating}
        tone={activeTransition?.tone}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-black text-zinc-800">
            {activeTransition?.commentRequired
              ? t('launchDetail.transitions.commentRequired')
              : t('launchDetail.transitions.commentOptional')}
          </span>
          <textarea
            value={comment}
            onChange={(event) => {
              setComment(event.target.value)
              setCommentError(false)
            }}
            rows={3}
            maxLength={CONTENT_LIMITS.statusComment}
            placeholder={activeTransition?.commentRequired
              ? t('launchDetail.transitions.requiredCommentPlaceholder')
              : t('launchDetail.transitions.optionalCommentPlaceholder')}
            aria-invalid={Boolean(commentError)}
            aria-describedby={commentError ? 'status-comment-error' : undefined}
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm leading-6 text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
          />
          {commentError && (
            <p id="status-comment-error" className="mt-1.5 text-xs font-semibold text-red-700" role="alert">
              {t('launchDetail.validation.commentRequired')}
            </p>
          )}
        </label>
      </ConfirmModal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title={t('launchDetail.deleteLaunch.title')}
        description={t('launchDetail.deleteLaunch.description', { name: launch.name })}
        confirmLabel={t('launchDetail.deleteLaunch.confirm')}
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
        isLoading={isMutating}
        tone="danger"
      />

      <ConfirmModal
        isOpen={Boolean(assetToDelete)}
        title={t('launchDetail.deleteAsset.title')}
        description={t('launchDetail.deleteAsset.description', {
          name: assetToDelete?.name || '',
        })}
        confirmLabel={t('launchDetail.deleteAsset.confirm')}
        onConfirm={handleDeleteAsset}
        onClose={() => setAssetToDelete(null)}
        isLoading={isMutating}
        tone="danger"
      />
    </div>
  )
}
