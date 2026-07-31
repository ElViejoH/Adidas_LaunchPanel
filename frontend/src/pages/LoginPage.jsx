import { useState } from 'react'
import { ArrowRight, Check, LockKey, UserCircle } from '@phosphor-icons/react'
import { Navigate, useNavigate } from 'react-router-dom'
import loginCampaign from '../assets/login-campaign.webp'
import { BrandMark } from '../components/BrandMark'
import { Button } from '../components/Button'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { RoleBadge } from '../components/RoleBadge'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { useInterfaceScale } from '../hooks/useInterfaceScale'
import { tApiError } from '../i18n/apiErrors'
import { USER_ROLES } from '../utils/constants'

const demoUsers = [
  { role: USER_ROLES.CREATOR, email: 'creator@adidas.com' },
  { role: USER_ROLES.APPROVER, email: 'approver@adidas.com' },
  { role: USER_ROLES.ADMIN, email: 'admin@adidas.com' },
]

const featureKeys = [
  'login.features.visibleApprovalFlow',
  'login.features.sharedCalendar',
  'login.features.auditableHistory',
]

export function LoginPage() {
  const { t } = useI18n()
  useInterfaceScale(150)
  useDocumentTitle(t('login.documentTitle'))
  const { isAuthenticated, isLoggingIn, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    try {
      await login(form)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError)
    }
  }

  const selectDemoUser = (email) => {
    setForm({ email, password: 'password123' })
    setError(null)
  }

  return (
    <main className="relative grid min-h-[100dvh] bg-[#f7f7f5] lg:grid-cols-[minmax(360px,0.85fr)_1.15fr]">
      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-6">
        <LanguageSwitcher />
      </div>

      <section className="relative isolate hidden overflow-hidden bg-zinc-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <img
          src={loginCampaign}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full scale-[1.03] object-cover object-center blur-[1.5px]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/35" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/80" />

        <div className="relative z-10">
          <BrandMark inverse />
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="font-display text-xs font-extrabold uppercase tracking-[0.16em] text-zinc-300">{t('brand.tagline')}</p>
          <p className="font-display mt-5 text-5xl font-black leading-[0.92] tracking-[-0.04em] xl:text-6xl">
            {t('login.heroTitle')}
          </p>
          <p className="mt-6 max-w-md text-base leading-7 text-zinc-200">
            {t('login.heroDescription')}
          </p>
        </div>

        <ul className="relative z-10 grid gap-3 text-sm font-bold text-zinc-100">
          {featureKeys.map((key) => (
            <li key={key} className="flex items-center gap-3">
              <span className="grid size-6 place-items-center rounded-md border border-white/25 bg-black/40 backdrop-blur-sm">
                <Check size={13} weight="bold" aria-hidden="true" />
              </span>
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex min-w-0 items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <BrandMark />
          </div>

          <p className="font-display text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-500">{t('login.internalAccess')}</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-zinc-950">{t('login.title')}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{t('login.description')}</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-zinc-800">{t('login.emailLabel')}</span>
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
                  placeholder={t('login.emailPlaceholder')}
                  autoComplete="email"
                  required
                  className="min-h-12 w-full rounded-lg border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-zinc-800">{t('login.passwordLabel')}</span>
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
                  placeholder={t('login.passwordPlaceholder')}
                  autoComplete="current-password"
                  required
                  className="min-h-12 w-full rounded-lg border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />
              </span>
            </label>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-800" role="alert">
                {error?.code ? tApiError(error, t) : t('login.errors.failed')}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isLoggingIn || !form.email || !form.password}>
              {isLoggingIn ? t('login.validating') : t('login.submit')}
              {!isLoggingIn && <ArrowRight size={18} weight="bold" aria-hidden="true" />}
            </Button>
          </form>

          <div className="mt-8 border-t border-zinc-200 pt-6">
            <p className="font-display text-xs font-black uppercase tracking-[0.1em] text-zinc-500">{t('login.demoAccess')}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {demoUsers.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => selectDemoUser(demo.email)}
                  className="rounded-lg border border-zinc-300 bg-white p-3 text-left outline-none hover:border-zinc-500 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-950 last:sm:col-span-2"
                >
                  <RoleBadge role={demo.role} compact />
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
