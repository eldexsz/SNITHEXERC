import { and, eq, gt } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { licenseKeys } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

function readKey(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const key = readKey(body.key)

  if (!key) {
    return NextResponse.json({ ok: false, message: 'License key is required' }, { status: 400 })
  }

  const [license] = await db
    .select({ key: licenseKeys.key, expiresAt: licenseKeys.expiresAt })
    .from(licenseKeys)
    .where(and(eq(licenseKeys.key, key), eq(licenseKeys.status, 'active'), gt(licenseKeys.expiresAt, new Date())))
    .limit(1)

  if (!license) {
    return NextResponse.json({ ok: false, message: 'Invalid license key' }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    message: 'License accepted',
    expiresAt: license.expiresAt.toISOString(),
  })
}

export async function GET(request: Request) {
  const key = readKey(new URL(request.url).searchParams.get('key'))
  if (!key) return NextResponse.json({ ok: false, message: 'License key is required' }, { status: 400 })

  const [license] = await db
    .select({ key: licenseKeys.key, expiresAt: licenseKeys.expiresAt })
    .from(licenseKeys)
    .where(and(eq(licenseKeys.key, key), eq(licenseKeys.status, 'active'), gt(licenseKeys.expiresAt, new Date())))
    .limit(1)

  if (!license) return NextResponse.json({ ok: false, message: 'Invalid license key' }, { status: 401 })
  return NextResponse.json({
    ok: true,
    message: 'License accepted',
    expiresAt: license.expiresAt.toISOString(),
  })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: 'GET, POST, OPTIONS' } })
}
