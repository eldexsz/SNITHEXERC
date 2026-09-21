import { desc } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { verifySession, getSessionCookieName } from '@/lib/auth'
import { db } from '@/lib/db'
import { licenseKeys } from '@/lib/db/schema'
import LicensePanel from './license-panel'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const cookieStore = await cookies()
  const loggedIn = verifySession(cookieStore.get(getSessionCookieName())?.value)
  const rows = loggedIn ? await db.select().from(licenseKeys).orderBy(desc(licenseKeys.createdAt)) : []
  const initialKeys = rows.map((row) => ({ key: row.key, status: row.status as 'active' | 'revoked', created: row.createdAt.toISOString(), expires: row.expiresAt.toISOString() }))
  return <LicensePanel initialLoggedIn={loggedIn} initialKeys={initialKeys} />
}
