// routes/auth.routes.ts

import { Hono } from 'hono'

import { 
  loginController, 
  verifyTokenController, 
  logoutController, 
  refreshTokenController 
} from '../controllers/auth.controller'
import { createAuthMiddleware } from '../utils/auth.utils'

const router = new Hono()

// ── Public Routes ───────────────────────────────────────────────

/**
 * POST /api/auth/admin/login
 * Login para administradores usando contraseña hardcodeada
 */
router.post('/admin/login', loginController)

// ── Protected Routes ─────────────────────────────────────────────

/**
 * GET /api/auth/verify
 * Verificar si el token es válido
 * Requiere cualquier rol de autenticación
 */
router.get('/verify', 
  createAuthMiddleware('admin'), // Requiere al menos rol admin
  verifyTokenController
)

/**
 * POST /api/auth/logout
 * Cerrar sesión (el cliente debe eliminar el token)
 * Requiere cualquier rol de autenticación
 */
router.post('/logout', 
  createAuthMiddleware('admin'), // Requiere al menos rol admin
  logoutController
)

/**
 * POST /api/auth/refresh
 * Refrescar el token JWT
 * Requiere cualquier rol de autenticación
 */
router.post('/refresh', 
  createAuthMiddleware('admin'), // Requiere al menos rol admin
  refreshTokenController
)

export default router
