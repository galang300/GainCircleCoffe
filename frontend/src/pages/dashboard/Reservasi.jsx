import { useState } from 'react'
import { Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import {
  Drawer,
  EmptyState,
  ErrorState,
  Modal,
  Pagination,
  SkeletonRows,
  useToast,
} from '../../components/ui/Feedback'
import { Chip, ResStatus } from '../../components/ui/Pill'
import { staffApi } from '../../lib/api'
import { RES_STATUS, slotById } from '../../lib/constants'
import {
  addDays,
  formatDateLong,
  formatDayMonthClock,
  isValidDate,
  maskPhone,
  todayWIB,
  number,
} from '../../lib/format'
import { canMarkNoShow, noShowOpensAt } from '../../lib/slots'
import { toAppError } from '../../lib/errors'
import { useAsync, usePolling, useDocTitle } from '../../lib/hooks'
import { cx } from '../../lib/cx'

const Kpi = ({ label, value, sub, tone }) => (
  <div className="border-2 border-ink bg-card p-4 shadow-cardsm">
    <p className="label-caps text-[10px] text-muted">{label}</p>
    <p className={cx('mt-1 font-display text-5xl leading-none', tone)}>{value}</p>
    {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
  </div>
)

export default function DaftarReservasi() {
  useDocTitle('Daftar reservasi')
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  const today = todayWIB()
  const date = isValidDate(sp.get('tanggal')) ? sp.get('tanggal') : today
  const status = sp.get('status') || ''
  const q = sp.get('q') || ''
  const page = Math.max(1, Number(sp.get('hal')) || 1)
  const set = (p) =>
    setSp(
      (s) => {
        const n = new URLSearchParams(s)
        Object.entries(p).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)))
        if (!('hal' in p)) n.delete('hal')
        return n
      },
      { replace: true },
    )
  const list = useAsync(
    () => staffApi.reservations({ date, status: status || undefined, q: q || undefined, page, page_size: 9 }),
    [date, status, q, page],
  )
  usePolling(() => list.refresh(), 20000)
  const d = list.data
  const kpi = d?.kpi
  const [draft, setDraft] = useState(q)
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Reservasi hari ini"
          value={kpi?.total ?? '–'}
          sub={kpi?.delta != null ? `${kpi.delta >= 0 ? '+' : ''}${kpi.delta} dari kemarin` : ''}
        />
        <Kpi label="Total tamu" value={kpi?.guests ?? '–'} sub="Tanpa yang dibatalkan" />
        <Kpi label="Meja terisi" value={kpi ? `${kpi.occupied}/${kpi.tables}` : '–'} sub="Sekarang" />
        <Kpi
          label="Slot penuh"
          value={kpi?.full_slots ?? '–'}
          sub={kpi?.full_slot_labels?.join(', ') || 'Belum ada'}
          tone={kpi?.full_slots ? 'text-orange' : ''}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Chip active={date === today} onClick={() => set({ tanggal: '' })}>
          Hari ini
        </Chip>
        <Chip active={date === addDays(today, 1)} onClick={() => set({ tanggal: addDays(today, 1) })}>
          Besok
        </Chip>
        <label className="sr-only" htmlFor="tgl">
          Pilih tanggal
        </label>
        <input
          id="tgl"
          type="date"
          value={date}
          onChange={(e) =>
            isValidDate(e.target.value) && set({ tanggal: e.target.value === today ? '' : e.target.value })
          }
          className="label-caps h-10 border-2 border-ink bg-white px-3 text-xs"
        />
        <label className="sr-only" htmlFor="st">
          Filter status
        </label>
        <select
          id="st"
          value={status}
          onChange={(e) => set({ status: e.target.value })}
          className="label-caps h-10 border-2 border-ink bg-white px-3 text-xs"
        >
          <option value="">Status: semua</option>
          {Object.entries(RES_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            set({ q: draft.trim() })
          }}
          role="search"
          className="flex"
        >
          <input
            aria-label="Cari nama atau kode"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Cari nama / kode"
            className="label-caps h-10 w-44 border-2 border-r-0 border-ink bg-white px-3 text-xs"
          />
          <button
            className="label-caps h-10 border-2 border-ink bg-ink px-3 text-xs text-cream"
            type="submit"
          >
            Cari
          </button>
        </form>
        <span className="ml-auto hidden text-[13px] text-muted md:block">{formatDateLong(date)}</span>
      </div>

      <section aria-label="Daftar reservasi" className="mt-4 border-2 border-ink bg-card shadow-card">
        {list.loading && !d ? (
          <div className="p-4">
            <SkeletonRows rows={6} />
          </div>
        ) : list.error && !d ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : d.items.length === 0 ? (
          <EmptyState
            symbol="0"
            title={q || status ? 'Tidak ada hasil' : 'Belum ada reservasi'}
            text={
              q || status
                ? 'Coba kata kunci atau filter lain.'
                : `Belum ada reservasi pada ${formatDateLong(date)}.`
            }
            action={
              (q || status) && (
                <Button
                  variant="white"
                  onClick={() => {
                    setDraft('')
                    set({ q: '', status: '' })
                  }}
                >
                  Reset filter
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="scroll-x hidden md:block">
              <table className="w-full min-w-[640px] text-left">
                <caption className="sr-only">Reservasi {formatDateLong(date)}</caption>
                <thead className="bg-ink text-neon">
                  <tr>
                    {['Jam', 'Nama', 'Meja', 'Tamu', 'Status', 'Aksi'].map((h) => (
                      <th key={h} scope="col" className="label-caps px-5 py-3 text-[11px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((r, i) => (
                    <tr key={r.code} className={cx('border-b border-line', i % 2 && 'bg-white/60')}>
                      <td className="px-5 py-3 font-display text-2xl text-orange">
                        {slotById(r.slot)?.short}
                      </td>
                      <td className="px-5 py-3 font-bold">
                        {r.name}
                        <span className="block text-xs font-normal text-muted">{r.code}</span>
                      </td>
                      <td className="px-5 py-3 font-display text-xl">{r.table}</td>
                      <td className="px-5 py-3">{r.guests}</td>
                      <td className="px-5 py-3">
                        <ResStatus status={r.status} />
                      </td>
                      <td className="px-5 py-3">
                        <Button
                          size="sm"
                          variant="white"
                          shadow={false}
                          onClick={() => nav({ pathname: r.code, search: sp.toString() })}
                          aria-label={`Lihat ${r.name}, ${r.code}`}
                        >
                          Lihat
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line md:hidden">
              {d.items.map((r) => (
                <li key={r.code}>
                  <button
                    type="button"
                    onClick={() => nav({ pathname: r.code, search: sp.toString() })}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left"
                  >
                    <span className="font-display text-3xl text-orange">{slotById(r.slot)?.short}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{r.name}</span>
                      <span className="text-xs text-muted">
                        {r.table} · {r.guests} tamu
                      </span>
                    </span>
                    <ResStatus status={r.status} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t-2 border-ink px-4">
              <Pagination
                page={d.page}
                pages={d.total_pages}
                onPage={(p) => set({ hal: p > 1 ? String(p) : '' })}
                info={`Menampilkan ${d.items.length} dari ${number(d.total)}`}
              />
            </div>
          </>
        )}
      </section>
      <Outlet context={{ reload: () => list.refresh(), search: sp.toString() }} />
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5">
      <dt className="label-caps text-[11px] text-muted">{k}</dt>
      <dd className="text-right font-bold">{v}</dd>
    </div>
  )
}

/** Drawer detail reservasi (rute /dashboard/reservasi/:kode). Aksi: check-in, no-show (setelah +15 mnt), batalkan. */
export function DetailReservasi() {
  const { kode } = useParams()
  const nav = useNavigate()
  const ctx = useOutletContext()
  const toast = useToast()
  const q = useAsync(() => staffApi.reservation(kode), [kode])
  const [busy, setBusy] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const r = q.data
  const close = () => nav({ pathname: '..', search: ctx.search }, { relative: 'path' })
  const act = async (action, ok, body = {}) => {
    setBusy(action)
    try {
      const n = await staffApi.act(kode, { action, ...body })
      q.setData(n)
      ctx.reload()
      toast.success(ok, `${n.code} · ${n.name}`)
      setConfirm(false)
    } catch (e) {
      toast.error('Gagal memperbarui', toAppError(e).message)
    } finally {
      setBusy('')
    }
  }
  const noShowOk = r && canMarkNoShow(r)
  return (
    <>
      <Drawer
        open
        onClose={close}
        title={r ? r.name : 'Detail reservasi'}
        footer={
          r && (
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={r.status !== 'dikonfirmasi'}
                loading={busy === 'check_in'}
                onClick={() => act('check_in', 'Check-in berhasil')}
              >
                Check-in
              </Button>
              <Button
                variant="pink"
                disabled={!noShowOk}
                loading={busy === 'no_show'}
                onClick={() => act('no_show', 'Ditandai no-show')}
              >
                No-show
              </Button>
              <Button
                variant="white"
                disabled={!['dikonfirmasi', 'check_in'].includes(r.status)}
                onClick={() => setConfirm(true)}
              >
                Batalkan
              </Button>
              {r.status === 'dikonfirmasi' && !noShowOk && (
                <p className="w-full text-xs text-muted">
                  No-show aktif mulai {noShowOpensAt(r)} WIB (15 menit setelah jam mulai).
                </p>
              )}
            </div>
          )
        }
      >
        {q.loading ? (
          <SkeletonRows rows={5} />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={q.reload} compact />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="label-caps">{r.code}</p>
              <ResStatus status={r.status} />
            </div>
            <p className="mt-3 font-display text-[80px] leading-[.9] text-orange">{r.table}</p>
            <dl className="mt-2">
              <Row k="Tanggal" v={formatDateLong(r.date)} />
              <Row k="Jam" v={`${slotById(r.slot)?.range} WIB`} />
              <Row k="Tamu" v={`${r.guests} orang`} />
              <Row k="Keperluan" v={r.purpose} />
              <Row k="WhatsApp" v={maskPhone(r.phone)} />
              <Row k="Email" v={r.email} />
            </dl>
            {r.note && (
              <div className="mt-4 border-2 border-ink bg-yellow/60 p-3 text-sm">
                <p className="label-caps mb-1 text-[10px]">Catatan pelanggan</p>
                {r.note}
              </div>
            )}
            <h3 className="mt-6 text-2xl">Riwayat status</h3>
            <ol className="mt-2 space-y-2 text-sm">
              {(r.history || []).map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-muted">{formatDayMonthClock(h.at)}</span>
                  <span>{h.text}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </Drawer>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        tone="pink"
        tag="Batalkan reservasi"
        title={`Batalkan ${r?.code}?`}
        actions={
          <>
            <Button variant="white" onClick={() => setConfirm(false)}>
              Kembali
            </Button>
            <Button
              variant="pink"
              loading={busy === 'cancel'}
              onClick={() => act('cancel', 'Reservasi dibatalkan', { reason })}
            >
              Ya, batalkan
            </Button>
          </>
        }
      >
        Meja {r?.table} akan dilepas dan bisa dipesan lagi. Tindakan ini tercatat di riwayat.
        <label className="label-caps mt-4 block text-[11px]" htmlFor="alasan">
          Alasan (opsional)
        </label>
        <input
          id="alasan"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={120}
          className="mt-1 h-11 w-full border-2 border-ink bg-white px-3 text-sm normal-case"
        />
      </Modal>
    </>
  )
}
