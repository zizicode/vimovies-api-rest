import { Hono } from 'hono'

import { DashboardController } from '@/controllers/dashboard.controller'
import { createAuthMiddleware } from '@/utils/auth.utils'

export const dashboardRoutes = new Hono()

// Aplicar middleware de autenticación a todas las rutas de dashboard
dashboardRoutes.use('*', createAuthMiddleware('admin'))

// GET /api/dashboard/stats - Obtener estadísticas generales
dashboardRoutes.get('/stats', DashboardController.getStats)
