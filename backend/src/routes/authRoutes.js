import { Router } from 'express'
import { getCurrentUser, login } from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post('/login', asyncHandler(login))
router.get('/me', authenticate, getCurrentUser)

export default router
