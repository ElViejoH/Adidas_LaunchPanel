import { useI18n } from '../hooks/useI18n'
import { ROLE_LABEL_KEYS, USER_ROLES } from '../utils/constants'

const roleStyles = {
  [USER_ROLES.ADMIN]: 'border-[#b78916] bg-[#d8ad3d] text-zinc-950',
  [USER_ROLES.APPROVER]: 'border-zinc-950 bg-black text-white',
  [USER_ROLES.CREATOR]: 'border-zinc-950 bg-white text-zinc-950',
}

export function RoleBadge({ role, compact = false, className = '' }) {
  const { t } = useI18n()
  const labelKey = ROLE_LABEL_KEYS[role]

  return (
    <span
      className={`font-display inline-flex shrink-0 items-center rounded-full border font-extrabold uppercase tracking-[0.08em] ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[10px]'
      } ${roleStyles[role] || roleStyles[USER_ROLES.CREATOR]} ${className}`}
    >
      {labelKey ? t(labelKey) : role || t('roles.unknown')}
    </span>
  )
}
