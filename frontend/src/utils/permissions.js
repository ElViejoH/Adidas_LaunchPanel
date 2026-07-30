import { LAUNCH_STATUSES, USER_ROLES } from './constants'

export function isLaunchOwner(user, launch) {
  if (!user || !launch) return false
  const creatorId = launch.creatorId ?? launch.creator?.id
  return creatorId != null && String(creatorId) === String(user.id)
}

export function canCreateLaunch(user) {
  return user?.role === USER_ROLES.CREATOR
}

export function canEditLaunch(user, launch) {
  return (
    user?.role === USER_ROLES.CREATOR &&
    launch?.status === LAUNCH_STATUSES.DRAFT &&
    isLaunchOwner(user, launch)
  )
}

export function canDeleteLaunch(user, launch) {
  return canEditLaunch(user, launch)
}

export function getAllowedStatusTransitions(user, launch) {
  if (!user || !launch) return []

  if (
    user.role === USER_ROLES.CREATOR &&
    launch.status === LAUNCH_STATUSES.DRAFT &&
    isLaunchOwner(user, launch)
  ) {
    return [LAUNCH_STATUSES.IN_REVIEW]
  }

  if (
    user.role === USER_ROLES.CREATOR &&
    launch.status === LAUNCH_STATUSES.CHANGES_REQUESTED &&
    isLaunchOwner(user, launch)
  ) {
    return [LAUNCH_STATUSES.DRAFT]
  }

  if (user.role === USER_ROLES.APPROVER) {
    if (launch.status === LAUNCH_STATUSES.IN_REVIEW) {
      return [
        LAUNCH_STATUSES.APPROVED,
        LAUNCH_STATUSES.CHANGES_REQUESTED,
        LAUNCH_STATUSES.REJECTED,
      ]
    }
    if (launch.status === LAUNCH_STATUSES.APPROVED) {
      return [LAUNCH_STATUSES.PUBLISHED]
    }
  }

  return []
}

export function canManageAssets(user, launch) {
  return canEditLaunch(user, launch)
}
