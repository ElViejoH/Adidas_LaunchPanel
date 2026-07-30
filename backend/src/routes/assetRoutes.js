import { Router } from 'express'
import { deleteAsset } from '../controllers/assetController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { USER_ROLES } from '../utils/validation.js'

const router = Router()

router.use(authenticate)
router.delete('/:id', authorize(USER_ROLES.CREATOR), asyncHandler(deleteAsset))

export default router
