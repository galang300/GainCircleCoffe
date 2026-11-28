import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Logo from '../components/brand/Logo'
import Button from '../components/ui/Button'
import { DataBadge } from '../components/ui/Feedback'
import { ENV, ADDRESS, OPEN_TEXT } from '../lib/constants'
import { firstName, initialOf } from '../lib/format'
import { useOnline } from '../lib/hooks'
import { cx } from '../lib/cx'

const LINKS = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/#cara', label: 'Cara pesan', hash: 'cara' },
  { to: '/#denah', label: 'Denah', hash: 'denah' },
  { to: '/#lokasi', label: 'Lokasi', hash: 'lokasi' },
  { to: '/cek-tiket', label: 'Cek tiket' },
]

function UserMenu({ onNavigate }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const f = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const k = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', f)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', f)
      document.removeEventListener('keydown', k)
    }
  }, [])
  const out = async () => {
    setOpen(false)
    await logout()
    onNavigate?.()
    nav('/')
  }
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-[60px] items-center gap-2 px-4 text-cream"
      >
        <span
          className="grid h-8 w-8 place-items-center rounded-full border-2 border-cream bg-orange font-display text-lg text-ink"
          aria-hidden="true"
        >
          {initialOf(user.name)}
        </span>
        <span className="label-caps text-[13px]">{firstName(user.name)} ▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[60px] z-50 w-44 border-2 border-ink bg-card shadow-cardsm"
        >
          <Link
            role="menuitem"
            to="/tiket-saya"
            onClick={() => setOpen(false)}
            className="label-caps block border-b-2 border-ink px-4 py-3 hover:bg-neon/40"
          >
            Tiket saya
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={out}
            className="label-caps block w-full px-4 py-3 text-left text-danger hover:bg-beige"
          >
            Keluar
          </button>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const { user, isCustomer } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()
  const online = useOnline()
  useEffect(() => setOpen(false), [pathname, hash])
  const active = (l) =>
    l.hash
      ? pathname === '/' && hash === `#${l.hash}`
      : l.end
        ? pathname === '/' && !hash
        : pathname.startsWith(l.to)
  return (
    <header className="no-print sticky top-0 z-40 bg-ink text-cream">
      {!online && (
        <div role="alert" className="bg-pink px-4 py-1.5 text-center text-xs font-extrabold text-ink">
          Tidak ada koneksi. Perubahan belum tersimpan.
        </div>
      )}
      <div className="mx-auto flex h-[60px] max-w-[1440px] items-stretch justify-between pl-5 md:pl-10 xl:pl-[72px]">
        <Link to="/" aria-label="Gain Circle, ke beranda" className="flex items-center">
          <Logo height={34} />
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-stretch lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className={cx(
                'label-caps flex items-center border-l-2 border-[#3a3330] px-6 text-[13px] hover:text-neon',
                active(l) ? 'text-neon' : 'text-cream',
              )}
              aria-current={active(l) ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex items-stretch border-l-2 border-[#3a3330]">
            {user && isCustomer ? (
              <UserMenu />
            ) : (
              !user && (
                <Link to="/masuk" className="label-caps flex items-center px-6 text-[13px] hover:text-neon">
                  Masuk
                </Link>
              )
            )}
          </div>
          <div className="flex items-center border-l-2 border-[#3a3330] px-5">
            <DataBadge className="mr-3" />
            <Button to="/reservasi" size="sm" shadow={false} className="!min-h-10">
              Reservasi meja
            </Button>
          </div>
        </nav>
        <button
          type="button"
          className="grid w-16 place-items-center border-l-2 border-[#3a3330] lg:hidden"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          aria-controls="menu-ponsel"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true" className="text-2xl">
            {open ? '✕' : '☰'}
          </span>
        </button>
      </div>
      {open && (
        <nav
          id="menu-ponsel"
          aria-label="Menu ponsel"
          className="border-t-2 border-[#3a3330] bg-ink pb-4 lg:hidden"
        >
          {LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className={cx(
                'label-caps block border-b border-[#3a3330] px-5 py-4 text-sm',
                active(l) ? 'text-neon' : 'text-cream',
              )}
            >
              {l.label}
            </Link>
          ))}
          {user && isCustomer ? (
            <>
              <Link to="/tiket-saya" className="label-caps block border-b border-[#3a3330] px-5 py-4 text-sm">
                Tiket saya ({firstName(user.name)})
              </Link>
              <LogoutRow onDone={() => setOpen(false)} />
            </>
          ) : (
            !user && (
              <Link to="/masuk" className="label-caps block border-b border-[#3a3330] px-5 py-4 text-sm">
                Masuk
              </Link>
            )
          )}
          <div className="flex items-center gap-3 px-5 pt-4">
            <Button to="/reservasi" block>
              Reservasi meja
            </Button>
            <DataBadge />
          </div>
        </nav>
      )}
    </header>
  )
}
function LogoutRow({ onDone }) {
  const { logout } = useAuth()
  const nav = useNavigate()
  return (
    <button
      type="button"
      className="label-caps block w-full border-b border-[#3a3330] px-5 py-4 text-left text-sm text-pink"
      onClick={async () => {
        await logout()
        onDone()
        nav('/')
      }}
    >
      Keluar
    </button>
  )
}

export function FooterFull() {
  return (
    <footer className="no-print bg-ink text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo height={44} />
          <p className="mt-5 font-display text-4xl uppercase text-neon">What do you Gain?</p>
          <p className="mt-4 text-sm">
            {ADDRESS}
            <br />
            Buka setiap hari {OPEN_TEXT}
          </p>
        </div>
        <div>
          <h3 className="text-xl text-neon">Reservasi</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="hover:text-neon" to="/reservasi">
                Pilih meja
              </Link>
            </li>
            <li>
              <Link className="hover:text-neon" to="/cek-tiket">
                Cek e-ticket
              </Link>
            </li>
            <li>
              <Link className="hover:text-neon" to="/#faq">
                Aturan &amp; FAQ
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl text-neon">Ikuti</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a className="hover:text-neon" href={ENV.instagram} target="_blank" rel="noopener noreferrer">
                Instagram @gain.circle
              </a>
            </li>
            <li>
              <a className="hover:text-neon" href={ENV.mainSite} target="_blank" rel="noopener noreferrer">
                Website utama ↗
              </a>
            </li>
            <li>
              <a className="hover:text-neon" href={ENV.maps} target="_blank" rel="noopener noreferrer">
                Google Maps
              </a>
            </li>
          </ul>
        </div>
      </div>
      <FooterBar />
    </footer>
  )
}
function FooterBar() {
  return (
    <div className="container-page flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-cream py-6 text-sm">
      <p>© 2026 Gain Coffee Circle · Reservasi meja</p>
      <div className="flex flex-wrap gap-x-7 gap-y-2">
        <a
          className="underline decoration-1 underline-offset-4 hover:text-neon"
          href={ENV.mainSite}
          target="_blank"
          rel="noopener noreferrer"
        >
          Website utama ↗
        </a>
        <Link className="underline decoration-1 underline-offset-4 hover:text-neon" to="/#faq">
          Aturan reservasi
        </Link>
        <Link className="font-extrabold text-neon underline decoration-1 underline-offset-4" to="/staf/masuk">
          Staf / Owner
        </Link>
      </div>
    </div>
  )
}
export const FooterMini = () => (
  <footer className="no-print bg-ink text-cream">
    <FooterBar />
  </footer>
)

export default function PublicLayout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#utama"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:bg-neon focus:p-3"
      >
        Lewati ke konten
      </a>
      <Navbar />
      <main id="utama" className="flex-1">
        <Outlet />
      </main>
      {pathname === '/' ? <FooterFull /> : <FooterMini />}
    </div>
  )
}
