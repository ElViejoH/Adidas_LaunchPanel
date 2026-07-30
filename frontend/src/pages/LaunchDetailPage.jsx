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
import { launchService } from '../services/launchService'
import { ASSET_TYPES, LAUNCH_STATUSES, STATUS_CONFIG } from '../utils/constants'
import { formatDateTime, formatLongDate } from '../utils/date'
import {
  canDeleteLaunch,
  canEditLaunch,
  canManageAssets,
  getAllowedNextStatus,
} from '../utils/permissions'

const assetIcons = {
  IMAGE: ImageSquare,
  VIDEO: VideoCamera,
  DOCUMENT: FileText,
  COPY: FileText,
  OTHER: File,
}

const transitionLabels = {
  [LAUNCH_STATUSES.IN_REVIEW]: 'Enviar a revisión',
  [LAUNCH_STATUSES.APPROVED]: 'Aprobar lanzamiento',
  [LAUNCH_STATUSES.PUBLISHED]: 'Publicar lanzamiento',
}

export function LaunchDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [launch, setLaunch] = useState(null)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState(null)
  const [comment, setComment] = useState('')
  const [isMutating, setIsMutating] = useState(false)
  const [actionError, setActionError] = useState('')
  const [assetForm, setAssetForm] = useState({ name: '', type: 'IMAGE', url: '' })
  const [assetErrors, setAssetErrors] = useState({})
  useDocumentTitle(launch?.name || 'Detalle de lanzamiento')

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
      nextStatus: getAllowedNextStatus(user, launch),
    }),
    [launch, user],
  )

  const refresh = () => setReloadKey((key) => key + 1)

  const handleStatusChange = async () => {
    if (!permissions.nextStatus) return
    setIsMutating(true)
    setActionError('')
    try {
      await launchService.changeStatus(id, {
        status: permissions.nextStatus,
        comment: comment.trim() || undefined,
      })
      setStatusModalOpen(false)
      setComment('')
      refresh()
    } catch (requestError) {
      setActionError(requestError.message)
      setStatusModalOpen(false)
    } finally {
      setIsMutating(false)
    }
  }

  const handleDelete = async () => {
    setIsMutating(true)
    setActionError('')
    try {
      await launchService.remove(id)
      navigate('/launches', { replace: true })
    } catch (requestError) {
      setActionError(requestError.message)
      setDeleteModalOpen(false)
      setIsMutating(false)
    }
  }

  const handleAssetSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!assetForm.name.trim()) nextErrors.name = 'Escribe un nombre para el activo.'
    if (!assetForm.url.trim()) {
      nextErrors.url = 'Ingresa la URL del activo.'
    } else {
      try {
        const url = new URL(assetForm.url)
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
      } catch {
        nextErrors.url = 'Ingresa una URL válida que comience con http o https.'
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
      setAssetErrors({ form: requestError.message })
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
      setAssetErrors({ form: requestError.message })
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
          Volver
        </Link>
        <ErrorState message={error?.message || 'No encontramos este lanzamiento.'} onRetry={refresh} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/launches" className="inline-flex items-center gap-2 text-sm font-black text-zinc-700 outline-none hover:text-zinc-950 hover:underline focus-visible:ring-2 focus-visible:ring-zinc-950">
          <ArrowLeft size={17} weight="bold" aria-hidden="true" />
          Volver a lanzamientos
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {permissions.edit && (
            <Link to={`/launches/${id}/edit`} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
              <PencilSimple size={16} weight="bold" aria-hidden="true" />
              Editar
            </Link>
          )}
          {permissions.remove && (
            <Button variant="dangerGhost" size="sm" onClick={() => setDeleteModalOpen(true)}>
              <Trash size={16} weight="bold" aria-hidden="true" />
              Eliminar
            </Button>
          )}
          {permissions.nextStatus && (
            <Button size="sm" onClick={() => setStatusModalOpen(true)}>
              {transitionLabels[permissions.nextStatus]}
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {actionError && <ErrorState title="La acción no pudo completarse" message={actionError} />}

      <header className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <StatusBadge status={launch.status} />
            <h1 className="mt-4 text-2xl font-black tracking-[-0.045em] text-zinc-950 sm:text-4xl">{launch.name}</h1>
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-zinc-600">{launch.description || 'Sin descripción operativa.'}</p>
          </div>
          <span className="shrink-0 text-xs font-black text-zinc-400">ID #{String(launch.id).padStart(3, '0')}</span>
        </div>

        <dl className="mt-7 grid gap-4 border-t border-zinc-200 pt-5 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
              <GlobeHemisphereWest size={18} weight="bold" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-xs font-bold text-zinc-500">Mercado</dt>
              <dd className="mt-1 text-sm font-black text-zinc-950">{launch.market || 'Sin mercado'}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
              <CalendarBlank size={18} weight="bold" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-xs font-bold text-zinc-500">Fecha de lanzamiento</dt>
              <dd className="mt-1 text-sm font-black capitalize text-zinc-950">{formatLongDate(launch.launchDate)}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
              <UserCircle size={18} weight="bold" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-xs font-bold text-zinc-500">Creador</dt>
              <dd className="mt-1 text-sm font-black text-zinc-950">{launch.creator?.name || 'Equipo de lanzamiento'}</dd>
            </div>
          </div>
        </dl>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.8fr)]">
        <section className="min-w-0 rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-zinc-200 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-black text-zinc-950">Activos del lanzamiento</h2>
              <p className="mt-1 text-sm text-zinc-600">Enlaces a imágenes, video, documentos y copy.</p>
            </div>
            <span className="text-2xl font-black tracking-[-0.04em] text-zinc-950">{launch.assets?.length || 0}</span>
          </div>

          {assetErrors.form && (
            <p id="asset-form-error" className="mx-5 mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 sm:mx-6" role="alert">
              {assetErrors.form}
            </p>
          )}

          {launch.assets?.length ? (
            <ul className="p-5 sm:p-6">
              {launch.assets.map((asset) => {
                const AssetIcon = assetIcons[asset.type] || File
                return (
                  <li key={asset.id} className="flex items-center gap-3 border-b border-zinc-100 py-3 first:pt-0 last:border-0 last:pb-0">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
                      <AssetIcon size={20} weight="bold" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-zinc-950">{asset.name}</p>
                      <p className="mt-0.5 text-xs font-bold text-zinc-500">{ASSET_TYPES.find((type) => type.value === asset.type)?.label || asset.type}</p>
                    </div>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-600 outline-none hover:bg-zinc-100 hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-950"
                      aria-label={`Abrir ${asset.name}`}
                    >
                      <ArrowSquareOut size={17} weight="bold" />
                    </a>
                    {permissions.assets && (
                      <button
                        type="button"
                        onClick={() => setAssetToDelete(asset)}
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-red-700 outline-none hover:bg-red-50 hover:text-red-800 focus-visible:ring-2 focus-visible:ring-red-700"
                        aria-label={`Eliminar ${asset.name}`}
                      >
                        <Trash size={17} weight="bold" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-zinc-500 sm:px-6">No hay activos vinculados todavía.</p>
          )}

          {permissions.assets && (
            <form
              onSubmit={handleAssetSubmit}
              className="border-t border-zinc-200 bg-zinc-50 p-5 sm:p-6"
              aria-describedby={assetErrors.form ? 'asset-form-error' : undefined}
              noValidate
            >
              <div className="mb-4 flex items-center gap-2">
                <Plus size={17} weight="bold" aria-hidden="true" />
                <h3 className="text-sm font-black text-zinc-950">Agregar activo</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-zinc-700">Nombre</span>
                  <input
                    value={assetForm.name}
                    onChange={(event) => {
                      setAssetForm((current) => ({ ...current, name: event.target.value }))
                      setAssetErrors((current) => ({ ...current, name: '', form: '' }))
                    }}
                    placeholder="Ej. Key visual principal"
                    aria-invalid={Boolean(assetErrors.name)}
                    aria-describedby={assetErrors.name ? 'asset-name-error' : undefined}
                    className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
                  />
                  {assetErrors.name && <p id="asset-name-error" className="mt-1.5 text-xs font-semibold text-red-700" role="alert">{assetErrors.name}</p>}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-zinc-700">Tipo</span>
                  <select
                    value={assetForm.type}
                    onChange={(event) => setAssetForm((current) => ({ ...current, type: event.target.value }))}
                    className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                  >
                    {ASSET_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold text-zinc-700">URL</span>
                  <input
                    type="url"
                    value={assetForm.url}
                    onChange={(event) => {
                      setAssetForm((current) => ({ ...current, url: event.target.value }))
                      setAssetErrors((current) => ({ ...current, url: '', form: '' }))
                    }}
                    placeholder="https://drive.example.com/asset"
                    aria-invalid={Boolean(assetErrors.url)}
                    aria-describedby={assetErrors.url ? 'asset-url-error' : undefined}
                    className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
                  />
                  {assetErrors.url && <p id="asset-url-error" className="mt-1.5 text-xs font-semibold text-red-700" role="alert">{assetErrors.url}</p>}
                </label>
              </div>
              <Button type="submit" size="sm" className="mt-4" disabled={isMutating}>
                <Plus size={16} weight="bold" aria-hidden="true" />
                {isMutating ? 'Agregando...' : 'Agregar activo'}
              </Button>
            </form>
          )}
        </section>

        <aside className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-black text-zinc-950">Flujo de estado</h2>
            <p className="mt-1 text-sm text-zinc-600">Trazabilidad de cada decisión del equipo.</p>
          </div>
          <LaunchTimeline currentStatus={launch.status} history={history} />
          <p className="mt-6 border-t border-zinc-200 pt-4 text-xs leading-5 text-zinc-500">
            Última actualización: {formatDateTime(launch.updatedAt)}
          </p>
        </aside>
      </div>

      <ConfirmModal
        isOpen={statusModalOpen}
        title={transitionLabels[permissions.nextStatus] || 'Cambiar estado'}
        description={`El lanzamiento pasará a ${STATUS_CONFIG[permissions.nextStatus]?.label || 'su siguiente estado'}. Este cambio quedará registrado en el historial.`}
        confirmLabel={transitionLabels[permissions.nextStatus] || 'Confirmar cambio'}
        onConfirm={handleStatusChange}
        onClose={() => setStatusModalOpen(false)}
        isLoading={isMutating}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-black text-zinc-800">Comentario opcional</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            placeholder="Agrega contexto para el equipo."
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm leading-6 text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
          />
        </label>
      </ConfirmModal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Eliminar lanzamiento"
        description={`Se eliminará “${launch.name}”. Solo los borradores pueden eliminarse.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
        isLoading={isMutating}
        tone="danger"
      />

      <ConfirmModal
        isOpen={Boolean(assetToDelete)}
        title="Eliminar activo"
        description={`Se desvinculará “${assetToDelete?.name || ''}” de este lanzamiento.`}
        confirmLabel="Eliminar activo"
        onConfirm={handleDeleteAsset}
        onClose={() => setAssetToDelete(null)}
        isLoading={isMutating}
        tone="danger"
      />
    </div>
  )
}
