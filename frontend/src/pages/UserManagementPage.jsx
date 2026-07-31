import { useEffect, useMemo, useState } from 'react'
import {
  CaretDown,
  CheckCircle,
  MagnifyingGlass,
  ShieldCheck,
  UserCircle,
  UsersThree,
} from '@phosphor-icons/react'
import { ConfirmModal } from '../components/ConfirmModal'
import { EmptyState, ErrorState, PageSkeleton } from '../components/PageStates'
import { PageHeader } from '../components/PageHeader'
import { RoleBadge } from '../components/RoleBadge'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { tApiError } from '../i18n/apiErrors'
import { userService } from '../services/userService'
import { ASSIGNABLE_ROLES, ROLE_LABEL_KEYS, USER_ROLES } from '../utils/constants'

const roleDetails = {
  [USER_ROLES.CREATOR]: 'users.roleDetails.creator',
  [USER_ROLES.APPROVER]: 'users.roleDetails.approver',
  [USER_ROLES.ADMIN]: 'users.roleDetails.admin',
}

function RoleSelect({ account, currentUserId, disabled, onSelect }) {
  const { t } = useI18n()
  const isCurrentUser = String(account.id) === String(currentUserId)
  const roleLabel = t('users.roleFor', { email: account.email })

  return (
    <label className="block min-w-44">
      <span className="sr-only">{roleLabel}</span>
      <span className="relative block">
        <select
          value={account.role}
          onChange={(event) => onSelect(account, event.target.value)}
          disabled={disabled || isCurrentUser}
          aria-label={roleLabel}
          title={isCurrentUser ? t('users.cannotChangeOwnRole') : undefined}
          className="min-h-10 w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-9 text-sm font-bold text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
        >
          {ASSIGNABLE_ROLES.map((role) => (
            <option key={role} value={role}>{t(ROLE_LABEL_KEYS[role])}</option>
          ))}
        </select>
        <CaretDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} weight="bold" />
      </span>
      {isCurrentUser && (
        <span className="mt-1 block text-[11px] font-semibold text-zinc-500">
          {t('users.yourAccount')}
        </span>
      )}
    </label>
  )
}

export function UserManagementPage() {
  const { language, t } = useI18n()
  useDocumentTitle(t('users.documentTitle'))
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [pendingChange, setPendingChange] = useState(null)
  const [successChange, setSuccessChange] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadUsers() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await userService.getAll({}, { signal: controller.signal })
        setUsers(data)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadUsers()
    return () => controller.abort()
  }, [reloadKey])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(language)
    return users.filter((account) => {
      const matchesSearch =
        !normalizedSearch ||
        account.name.toLocaleLowerCase(language).includes(normalizedSearch) ||
        account.email.toLocaleLowerCase(language).includes(normalizedSearch)
      const matchesRole = !role || account.role === role
      return matchesSearch && matchesRole
    })
  }, [language, role, search, users])

  const counts = useMemo(
    () =>
      ASSIGNABLE_ROLES.map((value) => ({
        role: value,
        count: users.filter((account) => account.role === value).length,
      })),
    [users],
  )

  const requestRoleChange = (account, nextRole) => {
    if (nextRole === account.role) return
    setSuccessChange(null)
    setPendingChange({ account, nextRole })
  }

  const confirmRoleChange = async () => {
    if (!pendingChange) return
    setIsSaving(true)
    setError(null)
    try {
      const updated = await userService.updateRole(
        pendingChange.account.id,
        pendingChange.nextRole,
      )
      setSuccessChange({ email: updated.email, role: updated.role })
      setPendingChange(null)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      setError(requestError)
      setPendingChange(null)
    } finally {
      setIsSaving(false)
    }
  }

  const retry = () => setReloadKey((key) => key + 1)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('users.eyebrow')}
        title={t('users.title')}
        description={t('users.description')}
      />

      <section
        className="grid border-y border-zinc-300 md:grid-cols-3"
        aria-label={t('users.rolesSummary')}
      >
        {counts.map(({ role: value, count }, index) => (
          <div
            key={value}
            className={`flex min-h-32 items-start justify-between gap-4 p-5 ${
              index > 0 ? 'border-t border-zinc-300 md:border-l md:border-t-0' : ''
            } ${value === USER_ROLES.ADMIN ? 'bg-[#d6aa32]/10' : ''}`}
          >
            <div>
              <RoleBadge role={value} />
              <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-zinc-950">{count}</p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                {t(roleDetails[value])}
              </p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center text-zinc-500">
              {value === USER_ROLES.ADMIN ? <ShieldCheck size={19} weight="bold" /> : <UserCircle size={19} weight="bold" />}
            </span>
          </div>
        ))}
      </section>

      <section
        className="rounded-xl border border-zinc-200 bg-white p-4"
        aria-label={t('users.filtersLabel')}
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-zinc-700">
              {t('users.searchLabel')}
            </span>
            <span className="relative block">
              <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} weight="bold" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('users.searchPlaceholder')}
                maxLength={120}
                className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-zinc-700">
              {t('users.roleLabel')}
            </span>
            <span className="relative block">
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="min-h-10 w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-9 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              >
                <option value="">{t('users.allRoles')}</option>
                {ASSIGNABLE_ROLES.map((value) => (
                  <option key={value} value={value}>{t(ROLE_LABEL_KEYS[value])}</option>
                ))}
              </select>
              <CaretDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} weight="bold" />
            </span>
          </label>
        </div>
      </section>

      {successChange && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950" role="status">
          <CheckCircle className="mt-0.5 shrink-0" size={20} weight="bold" />
          <p className="text-sm font-semibold">
            {t('users.roleUpdated', {
              email: successChange.email,
              role: t(ROLE_LABEL_KEYS[successChange.role]),
            })}
          </p>
        </div>
      )}

      {error ? (
        <ErrorState
          title={t('users.errors.manage')}
          message={tApiError(error, t)}
          onRetry={retry}
        />
      ) : isLoading ? (
        <PageSkeleton rows={4} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title={t('users.empty.title')}
          description={t('users.empty.description')}
        />
      ) : (
        <section
          className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
          aria-label={t('users.registeredUsers')}
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-zinc-500">
                    {t('users.columns.user')}
                  </th>
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-zinc-500">
                    {t('users.columns.currentRole')}
                  </th>
                  <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-zinc-500">
                    {t('users.columns.assignPermissions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((account) => (
                  <tr key={account.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-100 text-xs font-black text-zinc-700">
                          {account.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-zinc-950">{account.name}</p>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">{account.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><RoleBadge role={account.role} /></td>
                    <td className="px-5 py-4">
                      <RoleSelect account={account} currentUserId={currentUser?.id} disabled={isSaving} onSelect={requestRoleChange} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-zinc-100 md:hidden">
            {filteredUsers.map((account) => (
              <li key={account.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-100 text-xs font-black text-zinc-700">
                    {account.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-zinc-950">{account.name}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">{account.email}</p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <RoleBadge role={account.role} />
                      <RoleSelect account={account} currentUserId={currentUser?.id} disabled={isSaving} onSelect={requestRoleChange} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-zinc-700">
        <UsersThree className="mt-0.5 shrink-0" size={20} weight="bold" />
        <p className="text-xs leading-5">
          {t('users.securityNotice')}
        </p>
      </div>

      <ConfirmModal
        isOpen={Boolean(pendingChange)}
        title={t('users.changePermissions.title')}
        description={
          pendingChange
            ? t('users.changePermissions.description', {
                email: pendingChange.account.email,
                currentRole: t(ROLE_LABEL_KEYS[pendingChange.account.role]),
                nextRole: t(ROLE_LABEL_KEYS[pendingChange.nextRole]),
              })
            : ''
        }
        confirmLabel={t('users.changePermissions.confirm')}
        onConfirm={confirmRoleChange}
        onClose={() => !isSaving && setPendingChange(null)}
        isLoading={isSaving}
      />
    </div>
  )
}
