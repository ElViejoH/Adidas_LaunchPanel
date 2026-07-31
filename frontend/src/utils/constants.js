export const USER_ROLES = {
  CREATOR: 'CREATOR',
  APPROVER: 'APPROVER',
  ADMIN: 'ADMIN',
}

export const ROLE_LABEL_KEYS = {
  [USER_ROLES.CREATOR]: 'roles.CREATOR',
  [USER_ROLES.APPROVER]: 'roles.APPROVER',
  [USER_ROLES.ADMIN]: 'roles.ADMIN',
}

export const ASSIGNABLE_ROLES = [
  USER_ROLES.CREATOR,
  USER_ROLES.APPROVER,
  USER_ROLES.ADMIN,
]

export const LAUNCH_STATUSES = {
  DRAFT: 'DRAFT',
  IN_REVIEW: 'IN_REVIEW',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
}

export const STATUS_ORDER = [
  LAUNCH_STATUSES.DRAFT,
  LAUNCH_STATUSES.IN_REVIEW,
  LAUNCH_STATUSES.APPROVED,
  LAUNCH_STATUSES.PUBLISHED,
]

export const FILTERABLE_STATUSES = [
  LAUNCH_STATUSES.DRAFT,
  LAUNCH_STATUSES.IN_REVIEW,
  LAUNCH_STATUSES.CHANGES_REQUESTED,
  LAUNCH_STATUSES.APPROVED,
  LAUNCH_STATUSES.PUBLISHED,
  LAUNCH_STATUSES.REJECTED,
]

export const STATUS_CONFIG = {
  [LAUNCH_STATUSES.DRAFT]: {
    labelKey: 'statuses.DRAFT.label',
    shortLabelKey: 'statuses.DRAFT.short',
    className: 'border-zinc-300 bg-zinc-100 text-zinc-700',
  },
  [LAUNCH_STATUSES.IN_REVIEW]: {
    labelKey: 'statuses.IN_REVIEW.label',
    shortLabelKey: 'statuses.IN_REVIEW.short',
    className: 'border-orange-600 bg-white text-orange-700',
  },
  [LAUNCH_STATUSES.CHANGES_REQUESTED]: {
    labelKey: 'statuses.CHANGES_REQUESTED.label',
    shortLabelKey: 'statuses.CHANGES_REQUESTED.short',
    className: 'border-yellow-500 bg-white text-amber-700',
  },
  [LAUNCH_STATUSES.APPROVED]: {
    labelKey: 'statuses.APPROVED.label',
    shortLabelKey: 'statuses.APPROVED.short',
    className: 'border-emerald-700 bg-white text-emerald-700',
  },
  [LAUNCH_STATUSES.PUBLISHED]: {
    labelKey: 'statuses.PUBLISHED.label',
    shortLabelKey: 'statuses.PUBLISHED.short',
    className: 'border-blue-700 bg-white text-blue-700',
  },
  [LAUNCH_STATUSES.REJECTED]: {
    labelKey: 'statuses.REJECTED.label',
    shortLabelKey: 'statuses.REJECTED.short',
    className: 'border-red-700 bg-white text-red-700',
  },
}

export const COMMON_MARKETS = [
  { value: 'Global', labelKey: 'markets.global' },
  { value: 'LATAM', labelKey: 'markets.latam' },
  { value: 'Norteamérica', labelKey: 'markets.northAmerica' },
  { value: 'Europa', labelKey: 'markets.europe' },
  { value: 'APAC', labelKey: 'markets.apac' },
  { value: 'Colombia', labelKey: 'markets.colombia' },
  { value: 'México', labelKey: 'markets.mexico' },
  { value: 'Brasil', labelKey: 'markets.brazil' },
  { value: 'Estados Unidos', labelKey: 'markets.unitedStates' },
  { value: 'Alemania', labelKey: 'markets.germany' },
  { value: 'Reino Unido', labelKey: 'markets.unitedKingdom' },
  { value: 'Japón', labelKey: 'markets.japan' },
]

export const ASSET_TYPES = [
  { value: 'IMAGE', labelKey: 'assetTypes.IMAGE' },
  { value: 'VIDEO', labelKey: 'assetTypes.VIDEO' },
  { value: 'DOCUMENT', labelKey: 'assetTypes.DOCUMENT' },
  { value: 'COPY', labelKey: 'assetTypes.COPY' },
  { value: 'OTHER', labelKey: 'assetTypes.OTHER' },
]

export const CONTENT_LIMITS = Object.freeze({
  launchName: 120,
  launchDescription: 2000,
  market: 80,
  assetName: 120,
  assetUrl: 2048,
  assetsPerLaunch: 10,
  statusComment: 500,
})

export const SESSION_STORAGE_KEY = 'adidas-launch-panel.session'
