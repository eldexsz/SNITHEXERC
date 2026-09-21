import { and, desc, eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifySession, getSessionCookieName } from '@/lib/auth'
import { db } from '@/lib/db'
import { licenseKeys } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

async function authorized() {
  const value = (await cookies()).get(getSessionCookieName())?.value
  return verifySession(value)
}

function serialize(row: typeof licenseKeys.$inferSelect) {
  return { key: row.key, status: row.status, created: row.createdAt.toISOString(), expires: row.expiresAt.toISOString() }
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(licenseKeys).orderBy(desc(licenseKeys.createdAt))
  return NextResponse.json(rows.map(serialize))
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const value = typeof body.key === 'string' ? body.key.trim() : ''
  if (!/^SNX(?:-[A-Z0-9]{4}){3}-[A-Z0-9]{8}$/.test(value)) return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const [row] = await db.insert(licenseKeys).values({ key: value, expiresAt }).returning()
  return NextResponse.json(serialize(row), { status: 201 })
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  if (typeof body.key !== 'string' || body.status !== 'revoked') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const [row] = await db.update(licenseKeys).set({ status: 'revoked' }).where(eq(licenseKeys.key, body.key)).returning()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(serialize(row))
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  if (typeof body.key !== 'string') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const deleted = await db.delete(licenseKeys).where(and(eq(licenseKeys.key, body.key))).returning({ key: licenseKeys.key })
  if (!deleted.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
