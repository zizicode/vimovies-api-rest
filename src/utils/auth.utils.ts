// utils/auth.ts

import * as bcrypt from 'bcryptjs'
import { Context, Next } from 'hono'
import { SignJWT, jwtVerify } from 'jose'

// ── Roles ────────────────────────────────────────────────────

export type Role = 'super_admin' | 'admin'

// ── Usuarios hardcodeados ────────────────────────────────────
// Para generar los hashes corre una vez:
// console.log(await hashPassword('tu-password'))

interface HardcodedUser {
  id       : string
  name     : string
  role     : Role
  password : string  // bcrypt hash
}

export const HARDCODED_USERS: HardcodedUser[] = [
  {
    id      : 'usr_001',
    name    : 'Super Admin',
    role    : 'super_admin',
    password: '$2b$12$fo7VoJHy7ZzITzbzP8NvvOan.SJRWnQo7NfBoeGSMRUDT53PYCfRm',
  },
  {
    id      : 'usr_002',
    name    : 'Admin One',
    role    : 'admin',
    password: '$2b$12$uGHhu5QDzTERf7LrBLbd0.DCVnABcYsIDoEW.dWZ3CmFE.RvxmBJC',
  },
  {
    id      : 'usr_003',
    name    : 'Admin Two',
    role    : 'admin',
    password: '$2b$12$4PdftXmz3/zH7smsrvGf6ubXPGh.58pqUvkmPPbgfsrGRCu/9j4M.',
  },
]

// ── Password ─────────────────────────────────────────────────

export const hashPassword = (password: string) =>
  bcrypt.hash(password, 12)

export const verifyPassword = (password: string, hashedPassword: string) =>
  bcrypt.compare(password, hashedPassword)

export const verifyHardcodedUser = async (id: string, password: string) => {
  const user = HARDCODED_USERS.find(u => u.id === id)
  if (!user) return null
  const valid = await verifyPassword(password, user.password)
  return valid ? user : null
}

// ── JWT ──────────────────────────────────────────────────────

export interface JWTPayload {
  sub  : string   // user ID
  role : string   // user role
  name : string   // user name
  iat  : number   // issued at
  exp  : number   // expiration
}

const JWT_SECRET  = new TextEncoder().encode(process.env.JWT_SECRET ?? 'changeme')
const JWT_EXPIRES = '8h'

export const generateToken = async (userId: string, role: string, name: string) => {
  return new SignJWT({ sub: userId, role, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(JWT_SECRET)
}

export const verifyToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export const extractTokenFromHeader = (authHeader: string | null) => {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

// ── Auth Middleware ───────────────────────────────────────────

const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin : 2,
  admin       : 1,
}

export const createAuthMiddleware = (requiredRole: Role = 'admin') =>
  async (c: Context, next: Next) => {
    const token = extractTokenFromHeader(c.req.header('Authorization') ?? null)
    if (!token) return c.json({ success: false, error: 'Unauthorized' }, 401)

    const payload = await verifyToken(token)
    if (!payload) return c.json({ success: false, error: 'Invalid or expired token' }, 401)

    const userLevel     = ROLE_HIERARCHY[payload.role as Role] ?? 0
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0

    if (userLevel < requiredLevel)
      return c.json({ success: false, error: 'Forbidden' }, 403)

    c.set('user', payload)
    return await next()
  }