import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'snithexerc_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 8

function secret() {
  return process.env.AUTH_SECRET ?? ''
}

export function getSessionCookieName() {
  return COOKIE_NAME
}

export function createSession(username: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  const payload = `${username}:${expires}`
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}:${signature}`
}

export function verifySession(value: string | undefined) {
  if (!value || !secret()) return false
  const parts = value.split(':')
  if (parts.length !== 3) return false
  const [username, expiresText, signature] = parts
  const expires = Number(expiresText)
  if (!username || !Number.isInteger(expires) || expires < Math.floor(Date.now() / 1000)) return false
  const expected = createHmac('sha256', secret()).update(`${username}:${expires}`).digest('base64url')
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer) && username === process.env.ADMIN_USERNAME
}

export { SESSION_MAX_AGE }
