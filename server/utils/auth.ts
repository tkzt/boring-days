import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

const sessionCookie = 'boring_days_session'
const sessionLifetime = 60 * 60 * 24 * 7

export interface AuthenticatedUser {
  id: number
  username: string
}

function sessionSignature(payload: string) {
  return createHmac('sha256', useRuntimeConfig().authSecret).update(payload).digest('base64url')
}

function encodeSession(userId: number) {
  const payload = `${userId}.${Math.floor(Date.now() / 1000) + sessionLifetime}`
  return `${payload}.${sessionSignature(payload)}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(':')
  if (!salt || !expectedHash) return false
  const actualHash = scryptSync(password, salt, 64).toString('base64url')
  const expected = Buffer.from(expectedHash)
  const actual = Buffer.from(actualHash)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function validateCredentials(payload: unknown) {
  const body = payload as { username?: unknown, password?: unknown }
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    throw createError({ statusCode: 400, statusMessage: '用户名应为 3 至 30 位小写字母、数字、下划线或连字符。' })
  }
  if (password.length < 8 || password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: '密码长度应为 8 至 128 个字符。' })
  }
  return { username, password }
}

export function setUserSession(event: H3Event, userId: number) {
  setCookie(event, sessionCookie, encodeSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: sessionLifetime,
    path: '/'
  })
}

export function clearUserSession(event: H3Event) {
  deleteCookie(event, sessionCookie, { path: '/' })
}

export async function requireUser(event: H3Event): Promise<AuthenticatedUser> {
  const token = getCookie(event, sessionCookie)
  const [userIdText, expiresText, signature] = token?.split('.') ?? []
  const payload = userIdText && expiresText ? `${userIdText}.${expiresText}` : ''
  const expectedSignature = payload ? sessionSignature(payload) : ''
  const signaturesMatch = signature && expectedSignature && Buffer.byteLength(signature) === Buffer.byteLength(expectedSignature)
    && timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  const userId = Number(userIdText)
  if (!signaturesMatch || !Number.isInteger(userId) || userId < 1 || Number(expiresText) < Date.now() / 1000) {
    throw createError({ statusCode: 401, statusMessage: '请先登录。' })
  }

  const { getDatabase } = await import('./database')
  const { rows } = await getDatabase().query<AuthenticatedUser>(
    'SELECT id, username FROM users WHERE id = $1',
    [userId]
  )
  if (!rows[0]) throw createError({ statusCode: 401, statusMessage: '请先登录。' })
  return rows[0]
}