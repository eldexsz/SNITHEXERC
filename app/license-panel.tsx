'use client'

import { useMemo, useState } from 'react'

type LicenseStatus = 'active' | 'revoked'
type LicenseKey = { key: string; status: LicenseStatus; created: string; expires: string }

const seedKeys: LicenseKey[] = [
  { key: 'SNX-8F2A-91CD-4E77-AB12-6D90F3C8', status: 'active', created: 'Sep 21, 2026, 09:42', expires: 'Oct 21, 2026, 09:42' },
  { key: 'SNX-3B14-C8E2-77A1-0F4D9A22', status: 'active', created: 'Sep 20, 2026, 16:08', expires: 'Dec 19, 2026, 16:08' },
  { key: 'SNX-D901-2A6F-88BC-41E0C7D3', status: 'revoked', created: 'Sep 18, 2026, 11:20', expires: 'Oct 18, 2026, 11:20' },
]

type Props = { initialLoggedIn: boolean; initialKeys: LicenseKey[] }

export default function LicensePanel({ initialLoggedIn, initialKeys }: Props) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [keys, setKeys] = useState(initialKeys)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | LicenseStatus>('all')
  const [notice, setNotice] = useState('')

  const filteredKeys = useMemo(() => keys.filter((item) => {
    const matchesQuery = item.key.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (filter === 'all' || item.status === filter)
  }), [keys, query, filter])
  const stats = useMemo(() => ({ active: keys.filter((item) => item.status === 'active').length, revoked: keys.filter((item) => item.status === 'revoked').length }), [keys])

  async function signIn() {
    if (!username || !password) return setNotice('Enter your admin credentials to continue.')
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) })
    if (!response.ok) return setNotice('Invalid admin credentials.')
    const keysResponse = await fetch('/api/licenses')
    if (keysResponse.ok) setKeys(await keysResponse.json())
    setLoggedIn(true); setPassword(''); setNotice('')
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setLoggedIn(false); setUsername(''); setPassword('')
  }

  async function createKey() {
    const parts = Array.from({ length: 4 }, (_, index) => crypto.randomUUID().replaceAll('-', '').slice(0, index === 3 ? 8 : 4))
    const value = `SNX-${parts.join('-')}`.toUpperCase()
    const response = await fetch('/api/licenses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: value }) })
    if (!response.ok) return setNotice('Could not create license key.')
    const created = await response.json()
    setKeys((current) => [created, ...current])
    setNotice('New license key created.')
  }

  async function revokeKey(key: string) {
    const response = await fetch('/api/licenses', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key, status: 'revoked' }) })
    if (!response.ok) return setNotice('Could not revoke license key.')
    setKeys((current) => current.map((item) => item.key === key ? { ...item, status: 'revoked' } : item))
    setNotice('License key revoked.')
  }

  async function deleteKey(key: string) {
    if (!window.confirm('Delete this license key permanently?')) return
    const response = await fetch('/api/licenses', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key }) })
    if (!response.ok) return setNotice('Could not delete license key.')
    setKeys((current) => current.filter((item) => item.key !== key))
    setNotice('License key deleted.')
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key)
    setNotice('License key copied to clipboard.')
  }

  if (!loggedIn) return <main className="min-h-screen bg-[#07090d] px-6 py-10 text-[#edf2f7] [background-image:radial-gradient(circle_at_20%_0%,#14243a_0%,transparent_34%)]"><div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center"><section className="w-full rounded-[20px] border border-[#202936] bg-[#0d1118]/95 p-8 shadow-2xl shadow-black/40"><div className="text-xs font-extrabold tracking-[0.2em] text-[#69a7ff]">SNITHEXERC</div><h1 className="mt-3 text-3xl font-semibold tracking-tight">License Panel</h1><p className="mt-2 text-sm text-[#7f8b9a]">Secure administrator access</p><label className="mt-8 block text-sm text-[#aeb8c6]" htmlFor="username">Username</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-xl border border-[#202936] bg-[#080c12] px-4 py-3 outline-none transition focus:border-[#69a7ff]" placeholder="Admin username" autoComplete="username" /><label className="mt-5 block text-sm text-[#aeb8c6]" htmlFor="password">Password</label><input id="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) signIn() }} className="mt-2 w-full rounded-xl border border-[#202936] bg-[#080c12] px-4 py-3 outline-none transition focus:border-[#69a7ff]" type="password" placeholder="Admin password" autoComplete="current-password" /><button onClick={signIn} className="mt-6 w-full rounded-xl bg-[#69a7ff] px-4 py-3 font-bold text-[#07101c] transition hover:bg-[#8bbdff]">SIGN IN</button><p aria-live="polite" className="mt-4 min-h-5 text-sm text-[#ff8497]">{notice}</p></section></div></main>

  return <main className="min-h-screen bg-[#07090d] px-5 py-7 text-[#edf2f7] [background-image:radial-gradient(circle_at_20%_0%,#14243a_0%,transparent_34%)] sm:px-7"><div className="mx-auto max-w-6xl"><header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-extrabold tracking-[0.2em] text-[#69a7ff]">SNITHEXERC</div><p className="mt-2 text-sm text-[#7f8b9a]">License Administration</p></div><div className="flex gap-2"><button onClick={createKey} className="rounded-xl bg-[#69a7ff] px-4 py-3 text-sm font-bold text-[#07101c]">+ CREATE KEY</button><button onClick={signOut} className="rounded-xl border border-[#202936] bg-[#151c27] px-4 py-3 text-sm font-bold">LOG OUT</button></div></header><section className="mt-7 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-[#202936] bg-[#0d1118]/95 p-5"><span className="text-xs tracking-wider text-[#7f8b9a]">ACTIVE</span><strong className="mt-2 block text-3xl">{stats.active}</strong></div><div className="rounded-2xl border border-[#202936] bg-[#0d1118]/95 p-5"><span className="text-xs tracking-wider text-[#7f8b9a]">REVOKED</span><strong className="mt-2 block text-3xl">{stats.revoked}</strong></div></section><div className="my-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold">License Keys</h1><p aria-live="polite" className="mt-1 min-h-5 text-sm text-[#42d392]">{notice}</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="search">Search license keys</label><input id="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search keys..." className="rounded-xl border border-[#202936] bg-[#0d1118] px-3 py-2 text-sm outline-none focus:border-[#69a7ff]" /><select value={filter} onChange={(event) => setFilter(event.target.value as 'all' | LicenseStatus)} className="rounded-xl border border-[#202936] bg-[#0d1118] px-3 py-2 text-sm"><option value="all">All statuses</option><option value="active">Active</option><option value="revoked">Revoked</option></select></div></div><section className="overflow-x-auto rounded-2xl border border-[#202936] bg-[#0d1118]/95"><div className="grid min-w-[820px] grid-cols-[1.5fr_.7fr_1fr_1fr_1.1fr] gap-4 border-b border-[#202936] px-4 py-3 text-xs uppercase tracking-wider text-[#7f8b9a]"><div>Key</div><div>Status</div><div>Created</div><div>Expires</div><div>Action</div></div>{filteredKeys.map((item) => <div key={item.key} className="grid min-w-[820px] grid-cols-[1.5fr_.7fr_1fr_1fr_1.1fr] items-center gap-4 border-b border-[#202936] px-4 py-4 text-sm last:border-b-0"><div className="font-mono text-xs sm:text-sm">{item.key}</div><div><span className={`rounded-full px-2 py-1 text-xs ${item.status === 'revoked' ? 'bg-[#30141b] text-[#ff8497]' : 'bg-[#123326] text-[#42d392]'}`}>{item.status}</span></div><div className="text-xs text-[#aeb8c6]">{item.created}</div><div className="text-xs text-[#aeb8c6]">{item.expires}</div><div className="flex gap-2"><button onClick={() => copyKey(item.key)} className="rounded-lg border border-[#202936] px-2 py-1 text-xs hover:border-[#69a7ff]">COPY</button>{item.status === 'active' && <button onClick={() => revokeKey(item.key)} className="rounded-lg border border-[#6a2935] px-2 py-1 text-xs text-[#ff8497]">REVOKE</button>}<button onClick={() => deleteKey(item.key)} className="rounded-lg border border-[#6a2935] px-2 py-1 text-xs text-[#ff8497]">DELETE</button></div></div>)}{filteredKeys.length === 0 && <div className="px-4 py-10 text-center text-sm text-[#7f8b9a]">No license keys found.</div>}</section></div></main>
}
