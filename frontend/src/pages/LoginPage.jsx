import { useState } from 'react'
import { ArrowRight, Check, LockKey, UserCircle } from '@phosphor-icons/react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { Button } from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const demoUsers = [
  { role: 'Creador', email: 'creator@adidas.com' },
  { role: 'Aprobador', email: 'approver@adidas.com' },
]

export function LoginPage() {
  useDocumentTitle('Iniciar sesión')
  const { isAuthenticated, isLoggingIn, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await login(form)
      const origin = location.state?.from
      const destination = origin
        ? `${origin.pathname || '/'}${origin.search || ''}${origin.hash || ''}`
        : '/'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'No fue posible iniciar sesión.')
    }
  }

  const selectDemoUser = (email) => {
    setForm({ email, password: 'password123' })
    setError('')
  }

  return (
    <main className="grid min-h-[100dvh] bg-[#f7f7f5] lg:grid-cols-[minmax(360px,0.85fr)_1.15fr]">
      <section className="relative hidden overflow-hidden bg-zinc-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <BrandMark inverse />

        <div className="relative z-10 max-w-lg">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-zinc-400">Product operations</p>
          <p className="mt-5 text-5xl font-black leading-[0.92] tracking-[-0.065em] xl:text-6xl">
            De concepto a publicación.
          </p>
          <p className="mt-6 max-w-md text-base leading-7 text-zinc-400">
            Coordina mercados, fechas, activos y aprobaciones desde un único panel operativo.
          </p>
        </div>

        <ul className="relative z-10 grid gap-3 text-sm font-bold text-zinc-300">
          {['Flujo de aprobación visible', 'Calendario compartido', 'Historial auditable'].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="grid size-6 place-items-center rounded-md border border-zinc-700 bg-zinc-900">
                <Check size={13} weight="bold" aria-hidden="true" />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div aria-hidden="true" className="absolute -bottom-24 -right-24 size-80 rotate-12 border-[42px] border-zinc-900" />
      </section>

      <section className="flex min-w-0 items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <BrandMark />
          </div>

          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-500">Acceso interno</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-zinc-950">Inicia sesión</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Usa tus credenciales para entrar al espacio de lanzamientos.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-zinc-800">Correo corporativo</span>
              <span className="relative block">
                <UserCircle
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={19}
                  weight="bold"
                  aria-hidden="true"
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="nombre@adidas.com"
                  autoComplete="email"
                  required
                  className="min-h-12 w-full rounded-lg border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-zinc-800">Contraseña</span>
              <span className="relative block">
                <LockKey
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={19}
                  weight="bold"
                  aria-hidden="true"
                />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  required
                  className="min-h-12 w-full rounded-lg border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />
              </span>
            </label>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-800" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isLoggingIn || !form.email || !form.password}>
              {isLoggingIn ? 'Validando acceso...' : 'Entrar al panel'}
              {!isLoggingIn && <ArrowRight size={18} weight="bold" aria-hidden="true" />}
            </Button>
          </form>

          <div className="mt-8 border-t border-zinc-200 pt-6">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-zinc-500">Accesos de demostración</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {demoUsers.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => selectDemoUser(demo.email)}
                  className="rounded-lg border border-zinc-300 bg-white p-3 text-left outline-none hover:border-zinc-500 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-950"
                >
                  <span className="block text-xs font-black text-zinc-950">{demo.role}</span>
                  <span className="mt-1 block truncate text-[11px] text-zinc-600">{demo.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
