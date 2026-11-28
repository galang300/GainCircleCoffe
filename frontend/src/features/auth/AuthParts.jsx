import { forwardRef, useEffect, useState } from 'react'
import { TextField } from '../../components/ui/Fields'
import { StickerCalendar } from '../../components/brand/Stickers'
import { DataBadge } from '../../components/ui/Feedback'

/** Hanya path internal. Tolak '//host', '/\\host' (backslash dianggap '/' oleh browser) dan karakter kontrol. */
export const safeNext = (n) => (typeof n === 'string' && /^\/(?![/\\])[^\x00-\x1f]*$/.test(n) ? n : null)

/** Kerangka halaman masuk/daftar/OTP pelanggan: judul + stiker, kartu formulir, panel kata besar. */
export function AuthSplit({ eyebrow, title, intro, word, aside, children }) {
  return (
    <div className="bg-cream">
      <div className="container-page py-10 md:py-16">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-serif text-xl md:text-2xl">{eyebrow}</p>
            <h1 className="mt-1 text-[56px] leading-[.95] sm:text-[84px] lg:text-[104px]">{title}</h1>
          </div>
          <div className="hidden shrink-0 sm:block">
            <StickerCalendar size={120} />
          </div>
        </div>
        <p className="mt-4 max-w-lg text-base">{intro}</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr] lg:gap-12">
          <div className="border-2 border-ink bg-card p-5 shadow-card sm:p-8">{children}</div>
          <aside
            className="relative hidden overflow-hidden border-2 border-ink bg-orange p-8 lg:block"
            aria-hidden="true"
          >
            <p className="font-display text-[190px] uppercase leading-[.85] text-cream">{word}</p>
            <p className="mt-6 max-w-xs font-serif text-2xl font-bold text-ink">{aside}</p>
          </aside>
        </div>
      </div>
    </div>
  )
}

export const PasswordField = forwardRef(function PasswordField({ label = 'Kata sandi', ...p }, ref) {
  const [show, setShow] = useState(false)
  return (
    <TextField
      ref={ref}
      label={label}
      type={show ? 'text' : 'password'}
      autoComplete="current-password"
      inputClass="pr-24"
      {...p}
      tag={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="label-caps text-[11px] underline underline-offset-2"
          aria-pressed={show}
        >
          {show ? 'Sembunyikan' : 'Tampilkan'}
        </button>
      }
    />
  )
})

/**
 * Akun demo hanya tampil di mode contoh. Datanya dimuat dari src/mocks lewat import dinamis yang
 * dibuang saat build produksi, jadi kredensial fiktif tidak pernah ikut ke bundel produksi.
 */
export function DemoCreds({ roles }) {
  const [rows, setRows] = useState([])
  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCKS !== 'true') return
    import('../../mocks/db').then(({ users }) =>
      setRows(
        users
          .filter((u) => roles.includes(u.role))
          .map((u) => [u.email, u.password, u.role === 'customer' ? 'pelanggan' : u.role]),
      ),
    )
  }, [roles])
  if (!rows.length) return null
  return (
    <div className="mt-6 border-2 border-dashed border-ink bg-yellow/60 p-3 text-[13px]">
      <div className="mb-1 flex items-center gap-2">
        <DataBadge />
        <span className="font-extrabold">Akun demo</span>
      </div>
      <ul className="space-y-0.5">
        {rows.map((r) => (
          <li key={r[0]}>
            <code>{r[0]}</code> / <code>{r[1]}</code> <span>({r[2]})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function FormAlert({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="mb-4 flex gap-2 border-2 border-ink bg-pink/20 p-3 text-sm font-bold">
      <span aria-hidden="true">!</span>
      <span>{children}</span>
    </div>
  )
}
