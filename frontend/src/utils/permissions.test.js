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

describe('launch permissions', () => {
  test('recognizes ownership through a direct or nested creatorId', () => {
    expect(isLaunchOwner(creator, { creatorId: '10' })).toBe(true)
    expect(isLaunchOwner(creator, { creator: { id: 10 } })).toBe(true)
    expect(isLaunchOwner(otherCreator, { creatorId: 10 })).toBe(false)
  })

  test('only the owning creator manages a draft or launch in review', () => {
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

  test('returns only the next transition allowed for each role', () => {
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

  test('ADMIN can view the panel without inheriting operational actions', () => {
    const ownDraft = { creatorId: admin.id, status: LAUNCH_STATUSES.DRAFT }
    expect(canCreateLaunch(admin)).toBe(false)
    expect(canEditLaunch(admin, ownDraft)).toBe(false)
    expect(canDeleteLaunch(admin, ownDraft)).toBe(false)
    expect(canManageAssets(admin, ownDraft)).toBe(false)
    expect(getAllowedStatusTransitions(admin, ownDraft)).toEqual([])
  })
})
