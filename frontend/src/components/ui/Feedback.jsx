import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { cx } from '../../lib/cx'
import { toAppError, isNetwork } from '../../lib/errors'
import { ENV } from '../../lib/constants'
import Button from './Button'
import { StickerCloud } from '../brand/Stickers'

/* ---------- Toast ---------- */
const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)
const TONE = { success: ['bg-neon', 'Berhasil'], error: ['bg-pink', 'Gagal'], info: ['bg-yellow', 'Info'] }

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const id = useRef(0)
  const remove = useCallback((i) => setItems((l) => l.filter((t) => t.id !== i)), [])
  const push = useCallback(
    (tone, title, text) => {
      const i = ++id.current
      setItems((l) => [...l.slice(-3), { id: i, tone, title, text }])
      setTimeout(() => remove(i), 6000)
    },
    [remove],
  )
  const api = useMemo(
    () => ({
      success: (t, x) => push('success', t, x),
      error: (t, x) => push('error', t, x),
      info: (t, x) => push('info', t, x),
    }),
    [push],
  )
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="no-print pointer-events-none fixed inset-x-3 bottom-20 z-[80] flex flex-col items-end gap-3 md:inset-x-auto md:bottom-6 md:right-6 md:w-[380px]"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full animate-pop items-start gap-3 border-2 border-ink bg-card p-3 shadow-cardsm"
          >
            <span
              className={cx(
                'mt-0.5 grid h-7 w-7 shrink-0 place-items-center border-2 border-ink font-display text-lg',
                TONE[t.tone][0],
              )}
              aria-hidden="true"
            >
              {t.tone === 'success' ? '✓' : t.tone === 'error' ? '!' : 'i'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg uppercase leading-tight">{t.title}</p>
              {t.text && <p className="mt-0.5 text-[13px] text-muted">{t.text}</p>}
            </div>
            <button
              type="button"
              aria-label="Tutup notifikasi"
              onClick={() => remove(t.id)}
              className="h-8 w-8 shrink-0 text-xl leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ---------- Modal & Drawer ---------- */
function useDialog(open, onClose) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const prev = document.activeElement
    const k = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
        )
        const els = [...f].filter((x) => !x.disabled)
        if (!els.length) return
        const first = els[0],
          last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    setTimeout(() => ref.current?.querySelector('[data-autofocus],button,input,select')?.focus(), 30)
    return () => {
      document.removeEventListener('keydown', k)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose])
  return ref
}

export function Modal({ open, onClose, title, tag, tone = 'yellow', children, actions, dismissible = true }) {
  const ref = useDialog(open, dismissible ? onClose : undefined)
  if (!open) return null
  const bg = { yellow: 'bg-yellow', pink: 'bg-pink', neon: 'bg-neon', orange: 'bg-orange' }[tone]
  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-ink/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && dismissible && onClose?.()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md animate-pop border-2 border-ink bg-card shadow-card"
      >
        <div className={cx('flex items-center justify-between border-b-2 border-ink px-5 py-3', bg)}>
          <span className="label-caps">{tag || 'Perhatian'}</span>
          {dismissible && (
            <button
              type="button"
              aria-label="Tutup"
              onClick={onClose}
              className="h-8 w-8 text-2xl leading-none"
            >
              ×
            </button>
          )}
        </div>
        <div className="p-5">
          <h2 className="text-3xl leading-none">{title}</h2>
          <div className="mt-3 text-[15px] leading-relaxed text-ink/80">{children}</div>
          {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children, footer }) {
  const ref = useDialog(open, onClose)
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-ink/60"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full max-w-[480px] animate-pop flex-col border-l-2 border-ink bg-cream"
      >
        <header className="flex items-center justify-between border-b-[3px] border-ink bg-card px-5 py-4">
          <h2 className="text-3xl leading-none">{title}</h2>
          <button
            type="button"
            aria-label="Tutup detail"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center border-2 border-ink bg-white text-xl"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="border-t-2 border-ink bg-card p-5">{footer}</footer>}
      </aside>
    </div>
  )
}

/* ---------- Skeleton, kosong, error ---------- */
export const Skeleton = ({ className = 'h-6 w-full' }) => (
  <div aria-hidden="true" className={cx('sk', className)} />
)
export function SkeletonRows({ rows = 5, className = '' }) {
  return (
    <div role="status" aria-label="Memuat" className={cx('space-y-2', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
      <span className="sr-only">Memuat data…</span>
    </div>
  )
}

export function EmptyState({ symbol = '0', title, text, action, className = '' }) {
  return (
    <div className={cx('flex flex-col items-center px-6 py-12 text-center', className)}>
      <div
        className="grid h-24 w-24 place-items-center rounded-full border-2 border-line bg-beige font-display text-5xl text-muted"
        aria-hidden="true"
      >
        {symbol}
      </div>
      <h3 className="mt-5 text-2xl">{title}</h3>
      {text && <p className="mt-2 max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}

/** Error jaringan/server dengan aksi nyata "Coba lagi". Tidak menampilkan error mentah. */
export function ErrorState({ error, onRetry, title, compact = false, extra }) {
  const e = error ? toAppError(error) : null
  const head = title || (isNetwork(e) ? 'Koneksi terputus' : 'Gagal memuat')
  return (
    <div
      role="alert"
      className={cx('flex flex-col items-center text-center', compact ? 'px-4 py-6' : 'px-6 py-14')}
    >
      <StickerCloud size={compact ? 64 : 96} />
      <h3 className="mt-4 text-2xl">{head}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">{e?.message}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {onRetry && (
          <Button variant="orange" onClick={onRetry}>
            Coba lagi
          </Button>
        )}
        {extra}
      </div>
    </div>
  )
}

export function Banner({ tone = 'yellow', title, children, action }) {
  const bg = { yellow: 'bg-yellow', pink: 'bg-pink', orange: 'bg-orange', neon: 'bg-neon' }[tone]
  return (
    <div role="status" className={cx('flex flex-wrap items-center gap-3 border-2 border-ink px-4 py-3', bg)}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">{title}</p>
        {children && <p className="text-[13px]">{children}</p>}
      </div>
      {action}
    </div>
  )
}

/** Lencana wajib saat mode contoh aktif (PromptMaster aturan 5). */
export function DataBadge({ className = '' }) {
  if (!ENV.useMocks) return null
  return (
    <span
      title="Backend tiruan di browser. Semua data fiktif."
      className={cx(
        'label-caps inline-block border-2 border-ink bg-yellow px-2 py-0.5 text-[10px] text-ink',
        className,
      )}
    >
      Data contoh
    </span>
  )
}

export function Pagination({ page, pages, onPage, info }) {
  return (
    <nav aria-label="Halaman" className="flex flex-wrap items-center justify-between gap-3 px-1 py-3">
      <p className="text-[13px] text-muted">{info}</p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="white"
          shadow={false}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Halaman sebelumnya"
        >
          ‹
        </Button>
        <span className="label-caps min-w-12 text-center" aria-current="page">
          {page} / {Math.max(pages, 1)}
        </span>
        <Button
          size="sm"
          variant="white"
          shadow={false}
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Halaman berikutnya"
        >
          ›
        </Button>
      </div>
    </nav>
  )
}
