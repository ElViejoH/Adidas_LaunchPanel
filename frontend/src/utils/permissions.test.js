import { describe, expect, test } from 'vitest'
import { LAUNCH_STATUSES, USER_ROLES } from './constants'
import {
  canCreateLaunch,
  canDeleteLaunch,
  canEditLaunch,
  canManageAssets,
  getAllowedStatusTransitions,
  isLaunchOwner,
} from './permissions'

const creator = { id: 10, role: USER_ROLES.CREATOR }
const otherCreator = { id: 20, role: USER_ROLES.CREATOR }
const approver = { id: 30, role: USER_ROLES.APPROVER }
const admin = { id: 40, role: USER_ROLES.ADMIN }

describe('permisos de lanzamientos', () => {
  test('reconoce al propietario con creatorId directo o anidado', () => {
    expect(isLaunchOwner(creator, { creatorId: '10' })).toBe(true)
    expect(isLaunchOwner(creator, { creator: { id: 10 } })).toBe(true)
    expect(isLaunchOwner(otherCreator, { creatorId: 10 })).toBe(false)
  })

  test('solo el creador propietario administra su borrador o lanzamiento en revisión', () => {
    const draft = { creatorId: creator.id, status: LAUNCH_STATUSES.DRAFT }
    const inReview = { ...draft, status: LAUNCH_STATUSES.IN_REVIEW }
    const approved = { ...draft, status: LAUNCH_STATUSES.APPROVED }

    expect(canCreateLaunch(creator)).toBe(true)
    expect(canCreateLaunch(approver)).toBe(false)
    expect(canEditLaunch(creator, draft)).toBe(true)
    expect(canDeleteLaunch(creator, draft)).toBe(true)
    expect(canManageAssets(creator, draft)).toBe(true)
    expect(canEditLaunch(otherCreator, draft)).toBe(false)
    expect(canEditLaunch(creator, inReview)).toBe(true)
    expect(canDeleteLaunch(creator, inReview)).toBe(true)
    expect(canManageAssets(creator, inReview)).toBe(true)
    expect(canEditLaunch(otherCreator, inReview)).toBe(false)
    expect(canEditLaunch(creator, approved)).toBe(false)
  })

  test('calcula únicamente la siguiente transición permitida por rol', () => {
    const ownedDraft = { creatorId: creator.id, status: LAUNCH_STATUSES.DRAFT }
    const review = { creatorId: creator.id, status: LAUNCH_STATUSES.IN_REVIEW }
    const approved = { creatorId: creator.id, status: LAUNCH_STATUSES.APPROVED }
    const published = { creatorId: creator.id, status: LAUNCH_STATUSES.PUBLISHED }
    const changesRequested = {
      creatorId: creator.id,
      status: LAUNCH_STATUSES.CHANGES_REQUESTED,
    }
    const rejected = { creatorId: creator.id, status: LAUNCH_STATUSES.REJECTED }

    expect(getAllowedStatusTransitions(creator, ownedDraft)).toEqual([
      LAUNCH_STATUSES.IN_REVIEW,
    ])
    expect(getAllowedStatusTransitions(approver, ownedDraft)).toEqual([])
    expect(getAllowedStatusTransitions(approver, approved)).toEqual([
      LAUNCH_STATUSES.PUBLISHED,
    ])
    expect(getAllowedStatusTransitions(approver, published)).toEqual([])
    expect(getAllowedStatusTransitions(approver, review)).toEqual([
      LAUNCH_STATUSES.APPROVED,
      LAUNCH_STATUSES.CHANGES_REQUESTED,
      LAUNCH_STATUSES.REJECTED,
    ])
    expect(getAllowedStatusTransitions(creator, changesRequested)).toEqual([
      LAUNCH_STATUSES.DRAFT,
    ])
    expect(getAllowedStatusTransitions(otherCreator, changesRequested)).toEqual([])
    expect(getAllowedStatusTransitions(approver, rejected)).toEqual([])
  })

  test('ADMIN consulta el panel pero no hereda acciones operativas', () => {
    const ownDraft = { creatorId: admin.id, status: LAUNCH_STATUSES.DRAFT }
    expect(canCreateLaunch(admin)).toBe(false)
    expect(canEditLaunch(admin, ownDraft)).toBe(false)
    expect(canDeleteLaunch(admin, ownDraft)).toBe(false)
    expect(canManageAssets(admin, ownDraft)).toBe(false)
    expect(getAllowedStatusTransitions(admin, ownDraft)).toEqual([])
  })
})
