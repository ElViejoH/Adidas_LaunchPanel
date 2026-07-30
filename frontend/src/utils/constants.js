export const USER_ROLES = {
  CREATOR: 'CREATOR',
  APPROVER: 'APPROVER',
}

export const ROLE_LABELS = {
  [USER_ROLES.CREATOR]: 'Creador',
  [USER_ROLES.APPROVER]: 'Aprobador',
}

export const LAUNCH_STATUSES = {
  DRAFT: 'DRAFT',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
}

export const STATUS_ORDER = [
  LAUNCH_STATUSES.DRAFT,
  LAUNCH_STATUSES.IN_REVIEW,
  LAUNCH_STATUSES.APPROVED,
  LAUNCH_STATUSES.PUBLISHED,
]

export const STATUS_CONFIG = {
  [LAUNCH_STATUSES.DRAFT]: {
    label: 'Borrador',
    shortLabel: 'Borrador',
    className: 'border-zinc-300 bg-zinc-100 text-zinc-700',
  },
  [LAUNCH_STATUSES.IN_REVIEW]: {
    label: 'En revisión',
    shortLabel: 'Revisión',
    className: 'border-zinc-400 bg-zinc-200 text-zinc-900',
  },
  [LAUNCH_STATUSES.APPROVED]: {
    label: 'Aprobado',
    shortLabel: 'Aprobado',
    className: 'border-zinc-500 bg-zinc-700 text-zinc-50',
  },
  [LAUNCH_STATUSES.PUBLISHED]: {
    label: 'Publicado',
    shortLabel: 'Publicado',
    className: 'border-zinc-900 bg-zinc-950 text-zinc-50',
  },
}

export const COMMON_MARKETS = [
  'Global',
  'LATAM',
  'Norteamérica',
  'Europa',
  'APAC',
  'Colombia',
  'México',
  'Brasil',
  'Estados Unidos',
  'Alemania',
  'Reino Unido',
  'Japón',
]

export const ASSET_TYPES = [
  { value: 'IMAGE', label: 'Imagen' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'DOCUMENT', label: 'Documento' },
  { value: 'COPY', label: 'Copy' },
  { value: 'OTHER', label: 'Otro' },
]

export const SESSION_STORAGE_KEY = 'adidas-launch-panel.session'
