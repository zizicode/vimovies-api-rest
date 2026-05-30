// controllers/auth.controller.ts

import { Context } from 'hono'

import { verifyPassword, generateToken, HARDCODED_USERS } from '../utils/auth.utils'

// ── Login Controller ────────────────────────────────────────────

export const loginController = async (c: Context) => {
  try {
    const { userId, password } = await c.req.json()
    console.log(userId)

    // Validar que se proporcionaron credenciales
    if (!userId || !password) {
      return c.json({
        success: false,
        error: 'User ID and password are required'
      }, 400)
    }

    // Buscar usuario específico por ID
    const user = HARDCODED_USERS.find(u => u.id === userId)
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 401)
    }

    // Verificar contraseña
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return c.json({
        success: false,
        error: 'Invalid credentials'
      }, 401)
    }

    const authenticatedUser = user

    if (!authenticatedUser) {
      return c.json({
        success: false,
        error: 'Invalid credentials'
      }, 401)
    }

    // Generar token JWT
    const token = await generateToken(
      authenticatedUser.id,
      authenticatedUser.role,
      authenticatedUser.name
    )

    return c.json({
      success: true,
      status: 200,
      data: {
        token,
        user: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          role: authenticatedUser.role
        }
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
}

// ── Verify Token Controller ───────────────────────────────────────

export const verifyTokenController = async (c: Context) => {
  try {
    const user = c.get('user')
    
    if (!user) {
      return c.json({
        success: false,
        error: 'No authenticated user found'
      }, 401)
    }

    return c.json({
      success: true,
      status: 200,
      data: {
        valid: true,
        user: {
          id: user.sub,
          name: user.name,
          role: user.role
        }
      }
    })

  } catch (error) {
    console.error('Verify token error:', error)
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
}

// ── Logout Controller ─────────────────────────────────────────────

export const logoutController = async (c: Context) => {
  try {
    // En una implementación con stateful JWT, aquí invalidaríamos el token
    // Como usamos stateless JWT, simplemente devolvemos éxito
    // El cliente debe eliminar el token de su almacenamiento
    
    return c.json({
      success: true,
      status: 200,
      data: {
        message: 'Logged out successfully'
      }
    })

  } catch (error) {
    console.error('Logout error:', error)
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
}

// ── Refresh Token Controller ─────────────────────────────────────

export const refreshTokenController = async (c: Context) => {
  try {
    const user = c.get('user')
    
    if (!user) {
      return c.json({
        success: false,
        error: 'No authenticated user found'
      }, 401)
    }

    // Generar nuevo token con la misma información de usuario
    const newToken = await generateToken(
      user.sub,
      user.role,
      user.name
    )

    return c.json({
      success: true,
      status: 200,
      data: {
        token: newToken
      }
    })

  } catch (error) {
    console.error('Refresh token error:', error)
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
}
