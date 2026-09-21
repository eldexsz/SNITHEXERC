'use client'

import { useMemo, useState } from 'react'

type LicenseStatus = 'active' | 'revoked'
type LicenseKey = { key: string; status: LicenseStatus; created: string; expires: string }

type Props = { initialLoggedIn: boolean; initialKeys: LicenseKey[] }

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function toInputDate(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

export default function LicensePanel({ initialLoggedIn, initialKeys }: Props) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [keys, setKeys] = useState(initialKeys)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | LicenseStatus>('all')
  const [notice, setNotice] = useState('')
  const [customKey, setCustomKey] = useState('')
  const [editing, setEditing] = useState<LicenseKey | null>(null)
  const [editKey, setEditKey] = useState('')
  const [editExpires, setEditExpires] = useState('')

  const filteredKeys = useMemo(() => keys.filter((item) => item.key.toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || item.status === filter)), [keys, query, filter])
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
    await fetch('/api/auth/logout', { method: 'POST' }); setLoggedIn(false); setUsername(''); setPassword('')
  }

  async function saveKey(payload: { key: string; expiresAt?: string }, success: string) {
    const response = await fetch('/api/licenses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    if (!response.ok) return setNotice((await response.json().catch(() => ({}))).error || 'Could not save license key.')
    const created = await response.json(); setKeys((current) => [created, ...current]); setNotice(success); setCustomKey('')
  }

  function generatedKey() {
    const parts = Array.from({ length: 4 }, (_, index) => crypto.randomUUID().replaceAll('-', '').slice(0, index === 3 ? 8 : 4))
    return `SNX-${parts.join('-')}`.toUpperCase()
  }

  async function createKey() { await saveKey({ key: generatedKey() }, 'New license key created.') }
  async function createCustomKey() {
    const value = customKey.trim().toUpperCase()
    if (!/^SNX(?:-[A-Z0-9]{4}){3}-[A-Z0-9]{8}$/.test(value)) return setNotice('Use format SNX-XXXX-XXXX-XXXX-XXXXXXXX.')
    await saveKey({ key: value }, 'Custom license key created.')
  }

  function openEdit(item: LicenseKey) { setEditing(item); setEditKey(item.key); setEditExpires(toInputDate(item.expires)) }
  async function updateKey() {
    if (!editing) return
    const value = editKey.trim().toUpperCase()
    if (!/^SNX(?:-[A-Z0-9]{4}){3}-[A-Z0-9]{8}$/.test(value)) return setNotice('Use format SNX-XXXX-XXXX-XXXX-XXXXXXXX.')
    const expiresAt = new Date(editExpires)
    if (Number.isNaN(expiresAt.getTime())) return setNotice('Choose a valid expiration date.')
    const response = await fetch('/api/licenses', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: editing.key, newKey: value, expiresAt: expiresAt.toISOString() }) })
    if (!response.ok) return setNotice((await response.json().catch(() => ({}))).error || 'Could not update license key.')
    const updated = await response.json(); setKeys((current) => current.map((item) => item.key === editing.key ? updated : item)); setEditing(null); setNotice('License key updated.')
  }

  async function revokeKey(key: string) {
    const response = await fetch('/api/licenses', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key, status: 'revoked' }) })
    if (!response.ok) return setNotice('Could not revoke license key.')
    setKeys((current) => current.map((item) => item.key === key ? { ...item, status: 'revoked' } : item)); setNotice('License key revoked.')
  }

  async function deleteKey(key: string) {
    if (!window.confirm('Delete this license key permanently?')) return
    const response = await fetch('/api/licenses', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key }) })
    if (!response.ok) return setNotice('Could not delete license key.')
    setKeys((current) => current.filter((item) => item.key !== key)); setNotice('License key deleted.')
  }

  if (!loggedIn) return <main className="min-h-screen bg-[#07090d] px-6 py-10 text-[#edf2f7] [background-image:radial-gradient(circle_at_20%_0%,#14243a_0%,transparent_34%)]"><div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center"><section className="w-full rounded-[20px] border border-[#202936] bg-[#0d1118]/95 p-8 shadow-2xl shadow-black/40"><div className="text-xs font-extrabold tracking-[0.2em] text-[#69a7ff]">SNITHEXERC</div><h1 className="mt-3 text-3xl font-semibold tracking-tight">License Panel</h1><p className="mt-2 text-sm text-[#7f8b9a]">Secure administrator access</p><label className="mt-8 block text-sm text-[#aeb8c6]" htmlFor="username">Username</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-xl border border-[#202936] bg-[#080c12] px-4 py-3 outline-none focus:border-[#69a7ff]" placeholder="Admin username" autoComplete="username" /><label className="mt-5 block text-sm text-[#aeb8c6]" htmlFor="password">Password</label><input id="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) signIn() }} className="mt-2 w-full rounded-xl border border-[#202936] bg-[#080c12] px-4 py-3 outline-none focus:border-[#69a7ff]" type="password" placeholder="Admin password" autoComplete="current-password" /><button onClick={signIn} className="mt-6 w-full rounded-xl bg-[#69a7ff] px-4 py-3 font-bold text-[#07101c]">SIGN IN</button><p aria-live="polite" className="mt-4 min-h-5 text-sm text-[#ff8497]">{notice}</p></section></div></main>

  return <main className="min-h-screen bg-[#07090d] px-5 py-7 text-[#edf2f7] [background-image:radial-gradient(circle_at_20%_0%,#14243a_0%,transparent_34%)] sm:px-7"><div className="mx-auto max-w-6xl"><header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-extrabold tracking-[0.2em] text-[#69a7ff]">SNITHEXERC</div><p className="mt-2 text-sm text-[#7f8b9a]">License Administration</p></div><div className="flex flex-wrap gap-2"><button onClick={createKey} className="rounded-xl bg-[#69a7ff] px-4 py-3 text-sm font-bold text-[#07101c]">+ CREATE KEY</button><button onClick={signOut} className="rounded-xl border border-[#202936] bg-[#151c27] px-4 py-3 text-sm font-bold">LOG OUT</button></div></header><section className="mt-7 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-[#202936] bg-[#0d1118]/95 p-5"><span className="text-xs tracking-wider text-[#7f8b9a]">ACTIVE</span><strong className="mt-2 block text-3xl">{stats.active}</strong></div><div className="rounded-2xl border border-[#202936] bg-[#0d1118]/95 p-5"><span className="text-xs tracking-wider text-[#7f8b9a]">REVOKED</span><strong className="mt-2 block text-3xl">{stats.revoked}</strong></div></section><section className="mt-7 rounded-2xl border border-[#202936] bg-[#0d1118]/95 p-5"><h2 className="font-semibold">Create custom key</h2><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={customKey} onChange={(event) => setCustomKey(event.target.value)} placeholder="SNX-XXXX-XXXX-XXXX-XXXXXXXX" className="min-w-0 flex-1 rounded-xl border border-[#202936] bg-[#080c12] px-3 py-3 text-sm uppercase outline-none focus:border-[#69a7ff]" /><button onClick={createCustomKey} className="rounded-xl border border-[#69a7ff] px-4 py-3 text-sm font-bold text-[#8bbdff]">CREATE CUSTOM</button></div></section><div className="my-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold">License Keys</h1><p aria-live="polite" className="mt-1 min-h-5 text-sm text-[#42d392]">{notice}</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="search">Search license keys</label><input id="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search keys..." className="rounded-xl border border-[#202936] bg-[#0d1118] px-3 py-2 text-sm outline-none focus:border-[#69a7ff]" /><select value={filter} onChange={(event) => setFilter(event.target.value as 'all' | LicenseStatus)} className="rounded-xl border border-[#202936] bg-[#0d1118] px-3 py-2 text-sm"><option value="all">All status</option><option value="active">Active</option><option value="revoked">Revoked</option></select></div></div><div className="overflow-x-auto rounded-2xl border border-[#202936] bg-[#0d1118]/95"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[#202936] text-xs uppercase tracking-wider text-[#7f8b9a]"><tr><th className="px-5 py-4">Key</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Expires</th><th className="px-5 py-4">Actions</th></tr></thead><tbody>{filteredKeys.map((item) => <tr key={item.key} className="border-b border-[#202936] last:border-0"><td className="px-5 py-4 font-mono text-xs">{item.key}</td><td className="px-5 py-4"><span className={item.status === 'active' ? 'rounded-full bg-[#123c2b] px-2 py-1 text-xs text-[#64e5a4]' : 'rounded-full bg-[#44202a] px-2 py-1 text-xs text-[#ff8497]'}>{item.status}</span></td><td className="px-5 py-4 text-[#aeb8c6]">{formatDate(item.created)}</td><td className="px-5 py-4 text-[#aeb8c6]">{formatDate(item.expires)}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button onClick={() => openEdit(item)} className="rounded-lg border border-[#334154] px-3 py-2 text-xs font-semibold hover:border-[#69a7ff]">EDIT</button>{item.status === 'active' && <button onClick={() => revokeKey(item.key)} className="rounded-lg border border-[#713044] px-3 py-2 text-xs font-semibold text-[#ff9aad]">REVOKE</button>}<button onClick={() => deleteKey(item.key)} className="rounded-lg border border-[#713044] px-3 py-2 text-xs font-semibold text-[#ff9aad]">DELETE</button></div></td></tr>)}</tbody></table></div></div>{editing && <div className="fixed inset-0 z-10 grid place-items-center bg-black/70 px-5"><section role="dialog" aria-modal="true" aria-labelledby="edit-title" className="w-full max-w-lg rounded-2xl border border-[#334154] bg-[#0d1118] p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 id="edit-title" className="text-xl font-semibold">Edit license key</h2><button onClick={() => setEditing(null)} aria-label="Close" className="text-2xl text-[#aeb8c6]">×</button></div><label className="mt-6 block text-sm text-[#aeb8c6]" htmlFor="edit-key">License key</label><input id="edit-key" value={editKey} onChange={(event) => setEditKey(event.target.value)} className="mt-2 w-full rounded-xl border border-[#202936] bg-[#080c12] px-4 py-3 font-mono text-sm uppercase outline-none focus:border-[#69a7ff]" /><label className="mt-5 block text-sm text-[#aeb8c6]" htmlFor="edit-expires">Expiration</label><input id="edit-expires" type="datetime-local" value={editExpires} onChange={(event) => setEditExpires(event.target.value)} className="mt-2 w-full rounded-xl border border-[#202936] bg-[#080c12] px-4 py-3 text-sm outline-none focus:border-[#69a7ff]" /><div className="mt-6 flex justify-end gap-2"><button onClick={() => setEditing(null)} className="rounded-xl border border-[#334154] px-4 py-3 text-sm font-semibold">CANCEL</button><button onClick={updateKey} className="rounded-xl bg-[#69a7ff] px-4 py-3 text-sm font-bold text-[#07101c]">SAVE CHANGES</button></div></section></div>}</main>
}
