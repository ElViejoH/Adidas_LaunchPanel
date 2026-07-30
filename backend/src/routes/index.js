import { Router } from 'express'
import assetRoutes from './assetRoutes.js'
import authRoutes from './authRoutes.js'
import launchRoutes from './launchRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/launches', launchRoutes)
router.use('/assets', assetRoutes)

export default router
