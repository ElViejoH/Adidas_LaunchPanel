import { useEffect, useState } from 'react'
import { ArrowLeft, FloppyDisk, WarningCircle } from '@phosphor-icons/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { buttonStyles } from '../components/buttonStyles'
import { ErrorState, PageSkeleton } from '../components/PageStates'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { launchService } from '../services/launchService'
import { COMMON_MARKETS, USER_ROLES } from '../utils/constants'
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
  useDocumentTitle(isEditing ? 'Editar lanzamiento' : 'Nuevo lanzamiento')
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
    if (!form.name.trim()) nextErrors.name = 'Escribe un nombre para el lanzamiento.'
    if (form.name.trim().length > 120) nextErrors.name = 'Usa un nombre de máximo 120 caracteres.'
    if (!form.description.trim()) nextErrors.description = 'Agrega una descripción operativa.'
    if (!form.market.trim()) nextErrors.market = 'Selecciona o escribe un mercado.'
    if (!form.launchDate) nextErrors.launchDate = 'Selecciona una fecha de lanzamiento.'
    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
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
          <h1 className="mt-4 text-xl font-black text-zinc-950">Acceso solo para creadores</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Tu rol puede revisar y aprobar lanzamientos, pero no crear o editar contenido.</p>
          <Link to="/launches" className={buttonStyles({ variant: 'secondary', className: 'mt-6' })}>Volver a lanzamientos</Link>
        </div>
      </div>
    )
  }

  if (isLoading) return <PageSkeleton rows={5} />
  if (error && !launch && isEditing) return <ErrorState message={error.message} />

  if (isEditing && launch && !canEditLaunch(user, launch)) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
            <WarningCircle size={25} weight="bold" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-black text-zinc-950">Este lanzamiento ya no se puede editar</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Solo el creador puede editar sus lanzamientos mientras estén en estado Borrador.</p>
          <Link to={`/launches/${id}`} className={buttonStyles({ variant: 'secondary', className: 'mt-6' })}>Volver al detalle</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow={isEditing ? 'Edición de borrador' : 'Nuevo registro'}
        title={isEditing ? 'Editar lanzamiento' : 'Crear lanzamiento'}
        description="Define la información base. Podrás agregar activos desde el detalle antes de enviarlo a revisión."
        actions={
          <Link to={isEditing ? `/launches/${id}` : '/launches'} className={buttonStyles({ variant: 'secondary' })}>
            <ArrowLeft size={17} weight="bold" aria-hidden="true" />
            Cancelar
          </Link>
        }
      />

      {error && <ErrorState title="No se pudo guardar" message={error.message} />}

      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white" noValidate>
        <div className="border-b border-zinc-200 p-5 sm:p-6">
          <h2 className="text-base font-black text-zinc-950">Información general</h2>
          <p className="mt-1 text-sm text-zinc-600">Estos datos aparecerán en la lista, el calendario y el detalle.</p>
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-zinc-800">Nombre del lanzamiento</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. Ultraboost City Pack"
              maxLength={120}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
            />
            {fieldErrors.name && <p id="name-error" className="mt-1.5 text-xs font-semibold text-red-700">{fieldErrors.name}</p>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-zinc-800">Descripción</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Resume el producto, el objetivo y las consideraciones de lanzamiento."
              rows={5}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={fieldErrors.description ? 'description-error' : undefined}
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3.5 py-3 text-sm leading-6 text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
            />
            {fieldErrors.description && <p id="description-error" className="mt-1.5 text-xs font-semibold text-red-700">{fieldErrors.description}</p>}
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-zinc-800">Mercado</span>
              <input
                name="market"
                value={form.market}
                onChange={handleChange}
                list="launch-markets"
                placeholder="Ej. LATAM"
                aria-invalid={Boolean(fieldErrors.market)}
                aria-describedby={fieldErrors.market ? 'market-error' : undefined}
                className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
              />
              <datalist id="launch-markets">
                {COMMON_MARKETS.map((market) => <option key={market} value={market} />)}
              </datalist>
              {fieldErrors.market && <p id="market-error" className="mt-1.5 text-xs font-semibold text-red-700">{fieldErrors.market}</p>}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-zinc-800">Fecha de lanzamiento</span>
              <input
                type="date"
                name="launchDate"
                value={form.launchDate}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.launchDate)}
                aria-describedby={fieldErrors.launchDate ? 'date-error' : undefined}
                className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 aria-[invalid=true]:border-red-600"
              />
              {fieldErrors.launchDate && <p id="date-error" className="mt-1.5 text-xs font-semibold text-red-700">{fieldErrors.launchDate}</p>}
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 bg-zinc-50 p-5 sm:flex-row sm:justify-end sm:p-6">
          <Link to={isEditing ? `/launches/${id}` : '/launches'} className={buttonStyles({ variant: 'secondary' })}>Cancelar</Link>
          <Button type="submit" disabled={isSaving}>
            <FloppyDisk size={17} weight="bold" aria-hidden="true" />
            {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear borrador'}
          </Button>
        </div>
      </form>
    </div>
  )
}
