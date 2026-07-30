import { describe, expect, test } from 'vitest'
import { LAUNCH_STATUSES, USER_ROLES } from './constants'
import {
  canCreateLaunch,
  canDeleteLaunch,
  canEditLaunch,
  canManageAssets,
  getAllowedNextStatus,
  isLaunchOwner,
} from './permissions'

const creator = { id: 10, role: USER_ROLES.CREATOR }
const otherCreator = { id: 20, role: USER_ROLES.CREATOR }
const approver = { id: 30, role: USER_ROLES.APPROVER }

describe('permisos de lanzamientos', () => {
  test('reconoce al propietario con creatorId directo o anidado', () => {
    expect(isLaunchOwner(creator, { creatorId: '10' })).toBe(true)
    expect(isLaunchOwner(creator, { creator: { id: 10 } })).toBe(true)
    expect(isLaunchOwner(otherCreator, { creatorId: 10 })).toBe(false)
  })

  test('solo el creador propietario administra su borrador', () => {
    const draft = { creatorId: creator.id, status: LAUNCH_STATUSES.DRAFT }
    const inReview = { ...draft, status: LAUNCH_STATUSES.IN_REVIEW }

    expect(canCreateLaunch(creator)).toBe(true)
    expect(canCreateLaunch(approver)).toBe(false)
    expect(canEditLaunch(creator, draft)).toBe(true)
    expect(canDeleteLaunch(creator, draft)).toBe(true)
    expect(canManageAssets(creator, draft)).toBe(true)
    expect(canEditLaunch(otherCreator, draft)).toBe(false)
    expect(canEditLaunch(creator, inReview)).toBe(false)
  })

  test('calcula únicamente la siguiente transición permitida por rol', () => {
    const ownedDraft = { creatorId: creator.id, status: LAUNCH_STATUSES.DRAFT }
    const review = { creatorId: creator.id, status: LAUNCH_STATUSES.IN_REVIEW }
    const approved = { creatorId: creator.id, status: LAUNCH_STATUSES.APPROVED }
    const published = { creatorId: creator.id, status: LAUNCH_STATUSES.PUBLISHED }

    expect(getAllowedNextStatus(creator, ownedDraft)).toBe(LAUNCH_STATUSES.IN_REVIEW)
    expect(getAllowedNextStatus(approver, ownedDraft)).toBeNull()
    expect(getAllowedNextStatus(approver, review)).toBe(LAUNCH_STATUSES.APPROVED)
    expect(getAllowedNextStatus(approver, approved)).toBe(LAUNCH_STATUSES.PUBLISHED)
    expect(getAllowedNextStatus(approver, published)).toBeNull()
  })
})
