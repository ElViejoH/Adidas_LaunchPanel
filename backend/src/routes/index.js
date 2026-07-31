import { Router } from 'express'
import assetRoutes from './assetRoutes.js'
import authRoutes from './authRoutes.js'
import launchRoutes from './launchRoutes.js'
import userRoutes from './userRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/launches', launchRoutes)
router.use('/assets', assetRoutes)
router.use('/users', userRoutes)

export default router
