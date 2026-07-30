import { Router } from 'express'
import { addAsset } from '../controllers/assetController.js'
import {
  createLaunch,
  deleteLaunch,
  getHistory,
  getLaunch,
  getLaunches,
  updateLaunch,
  updateLaunchStatus,
} from '../controllers/launchController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { USER_ROLES } from '../utils/validation.js'

const router = Router()

router.use(authenticate)

router.get('/', asyncHandler(getLaunches))
router.post('/', authorize(USER_ROLES.CREATOR), asyncHandler(createLaunch))
router.get('/:id/history', asyncHandler(getHistory))
router.post(
  '/:id/assets',
  authorize(USER_ROLES.CREATOR),
  asyncHandler(addAsset),
)
router.patch('/:id/status', asyncHandler(updateLaunchStatus))
router.get('/:id', asyncHandler(getLaunch))
router.put('/:id', authorize(USER_ROLES.CREATOR), asyncHandler(updateLaunch))
router.delete('/:id', authorize(USER_ROLES.CREATOR), asyncHandler(deleteLaunch))

export default router
