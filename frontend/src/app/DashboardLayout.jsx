import { useEffect, useRef, useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useMatches,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { useAuth } from './AuthContext'
import Logo from '../components/brand/Logo'
import { StarIcon } from '../components/brand/Stickers'
import { DataBadge, Modal } from '../components/ui/Feedback'
import Button from '../components/ui/Button'
import { Pill } from '../components/ui/Pill'
import { cashApi } from '../lib/api'
import { useAsync, useOnline } from '../lib/hooks'
import { formatDayMonthClock, initialOf } from '../lib/format'
import { cx } from '../lib/cx'

const MENU = [
  { to: '/dashboard/reservasi', label: 'Daftar Reservasi', tab: 'Reservasi' },
  { to: '/dashboard/meja', label: 'Status Meja', tab: 'Meja' },
  { to: '/dashboard/kas', label: 'Arus Kas', tab: 'Kas', owner: true },
  { to: '/dashboard/pengeluaran', label: 'Catat Pengeluaran', tab: 'Catat', also: ['/dashboard/pemasukan'] },
  { to: '/dashboard/asisten', label: 'Asisten AI', tab: 'Asisten', owner: true },
]
const isOn = (m, p) => p.startsWith(m.to) || m.also?.some((a) => p.startsWith(a))

function Sidebar({ items, user, onLogout }) {
  const { pathname } = useLocation()
  return (
    <aside className="no-print sticky top-0 hidden h-screen w-[76px] shrink-0 flex-col bg-ink text-cream md:flex lg:w-[260px]">
      <div className="flex h-[88px] items-center border-b-2 border-[#3a3330] px-4 lg:px-7">
        <Logo height={34} />
      </div>
      <nav aria-label="Menu dashboard" className="flex-1 px-3 py-5 lg:px-4">
        <p className="label-caps mb-3 hidden px-3 text-[11px] text-neon lg:block">Menu</p>
        <ul className="space-y-3">
          {items.map((m) => {
            const on = isOn(m, pathname)
            return (
              <li key={m.to}>
                <NavLink
                  to={m.to}
                  title={m.label}
                  aria-current={on ? 'page' : undefined}
                  className={cx(
                    'flex min-h-12 items-center gap-3 border-2 px-3.5 font-display text-lg uppercase',
                    on ? 'border-ink bg-neon text-ink' : 'border-transparent text-cream hover:bg-[#2a211e]',
                  )}
                >
                  <StarIcon size={24} color={on ? '#171210' : '#75F237'} />
                  <span className="hidden lg:inline">{m.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="p-3 lg:p-4">
        <Link to="/" className="label-caps mb-3 hidden px-1 text-[11px] text-neon lg:block">
          Lihat website ↗
        </Link>
        <div className="border-2 border-[#3a3330] bg-[#2a211e] p-3">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-cream bg-orange font-display text-xl text-ink"
              aria-hidden="true"
            >
              {initialOf(user.name)}
            </span>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-extrabold">{user.name}</p>
              <Pill bg={user.role === 'owner' ? '#75F237' : '#FDD923'} className="!text-[10px]">
                {user.role === 'owner' ? 'Owner' : 'Staf'}
              </Pill>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="label-caps mt-3 block w-full text-left text-xs text-[#A59B8E] hover:text-cream"
            aria-label="Keluar"
          >
            <span className="lg:hidden">↩</span>
            <span className="hidden lg:inline">Keluar →</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

function Notifications({ owner }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const q = useAsync(() => (owner ? cashApi.notifications() : Promise.resolve([])), [owner])
  useEffect(() => {
    const f = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', f)
    return () => document.removeEventListener('mousedown', f)
  }, [])
  if (!owner) return null
  const items = q.data || []
  const fresh = items.filter((n) => n.unread).length
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifikasi, ${fresh} baru`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-card"
      >
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#171210"
          strokeWidth="2"
        >
          <path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4" />
        </svg>
        {fresh > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink bg-pink" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-50 w-[min(92vw,360px)] border-2 border-ink bg-card shadow-card">
          <div className="flex items-center justify-between border-b-2 border-ink bg-yellow px-4 py-2.5">
            <span className="label-caps">Notifikasi</span>
            <span className="label-caps text-[11px]">{fresh} baru</span>
          </div>
          {q.loading ? (
            <p className="p-4 text-sm text-muted">Memuat…</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-muted">Belum ada peringatan.</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id} className="border-b border-line last:border-0">
                  <Link
                    to="/dashboard/kas"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-beige"
                  >
                    <p className="text-sm font-extrabold">{n.title}</p>
                    <p className="text-xs text-muted">
                      {formatDayMonthClock(n.created_at)} · {n.detail}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function DashboardLayout() {
  const { user, isOwner, logout } = useAuth()
  const nav = useNavigate()
  const matches = useMatches()
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const [more, setMore] = useState(false)
  const online = useOnline()
  const items = MENU.filter((m) => !m.owner || isOwner)
  const h = [...matches].reverse().find((m) => m.handle?.title)?.handle || {}
  const [q, setQ] = useState(params.get('q') || '')
  useEffect(() => setQ(params.get('q') || ''), [params])
  const out = async () => {
    await logout()
    nav('/staf/masuk')
  }
  const search = (e) => {
    e.preventDefault()
    nav(`/dashboard/reservasi${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
  }
  const tabs = isOwner ? items.filter((m) => m.tab !== 'Catat' && m.tab !== 'Asisten') : items
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar items={items} user={user} onLogout={out} />
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        {!online && (
          <div role="alert" className="bg-pink px-4 py-1.5 text-center text-xs font-extrabold">
            Tidak ada koneksi. Perubahan belum tersimpan.
          </div>
        )}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b-[3px] border-ink bg-cream px-4 py-3 md:px-10 md:py-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 md:hidden">
              <Logo dark={false} height={26} />
              <Pill bg={isOwner ? '#75F237' : '#FDD923'} className="!text-[10px]">
                {isOwner ? 'Owner' : 'Staf'}
              </Pill>
            </div>
            <h1 className="truncate text-3xl leading-none md:text-[38px]">{h.title}</h1>
            {h.sub && <p className="mt-1 font-serif text-sm font-bold text-rust">{h.sub}</p>}
          </div>
          <div className="flex items-center gap-3">
            <DataBadge className="hidden sm:inline-block" />
            <form onSubmit={search} role="search" className="hidden md:block">
              <input
                aria-label="Cari nama atau kode reservasi"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="CARI NAMA / KODE…"
                className="label-caps h-11 w-52 border-2 border-ink bg-white px-3 text-xs placeholder:text-muted"
              />
            </form>
            <Notifications owner={isOwner} />
            <span
              className="label-caps hidden h-11 items-center border-2 border-ink px-4 text-[13px] md:flex"
              style={{ background: isOwner ? '#75F237' : '#FDD923' }}
            >
              {user.name.split(' ')[0]}
            </span>
          </div>
        </header>
        <main className="px-4 py-6 md:px-10 md:py-8">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Menu dashboard ponsel"
        className="no-print fixed inset-x-0 bottom-0 z-40 grid border-t-2 border-ink bg-ink text-cream md:hidden"
        style={{ gridTemplateColumns: `repeat(${tabs.length + (isOwner ? 1 : 0)}, 1fr)` }}
      >
        {tabs.map((m) => {
          const on = isOn(m, pathname)
          return (
            <Link
              key={m.to}
              to={m.to}
              aria-current={on ? 'page' : undefined}
              className={cx(
                'flex min-h-[60px] flex-col items-center justify-center gap-1 text-[10px] font-extrabold uppercase tracking-wide',
                on ? 'text-neon' : 'text-[#A59B8E]',
              )}
            >
              <StarIcon size={20} color={on ? '#75F237' : '#A59B8E'} />
              {m.tab}
            </Link>
          )
        })}
        {isOwner && (
          <button
            type="button"
            onClick={() => setMore(true)}
            className="flex min-h-[60px] flex-col items-center justify-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#A59B8E]"
          >
            <StarIcon size={20} color="#A59B8E" />
            Lainnya
          </button>
        )}
      </nav>
      <Modal
        open={more}
        onClose={() => setMore(false)}
        tone="neon"
        tag="Lainnya"
        title="Menu lain"
        actions={
          <Button variant="light" onClick={out}>
            Keluar
          </Button>
        }
      >
        <ul className="space-y-2">
          <li>
            <Link
              onClick={() => setMore(false)}
              className="label-caps block border-2 border-ink bg-white px-4 py-3"
              to="/dashboard/pengeluaran"
            >
              Catat pengeluaran &amp; pemasukan
            </Link>
          </li>
          <li>
            <Link
              onClick={() => setMore(false)}
              className="label-caps block border-2 border-ink bg-white px-4 py-3"
              to="/dashboard/asisten"
            >
              Asisten AI
            </Link>
          </li>
          <li>
            <Link
              onClick={() => setMore(false)}
              className="label-caps block border-2 border-ink bg-white px-4 py-3"
              to="/"
            >
              Lihat website ↗
            </Link>
          </li>
        </ul>
      </Modal>
    </div>
  )
}
