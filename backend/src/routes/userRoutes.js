import { Router } from 'express'
import { getUsers, updateUserRole } from '../controllers/userController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { USER_ROLES } from '../utils/validation.js'

const router = Router()

router.use(authenticate, authorize(USER_ROLES.ADMIN))
router.get('/', asyncHandler(getUsers))
router.patch('/:id/role', asyncHandler(updateUserRole))

export default router
