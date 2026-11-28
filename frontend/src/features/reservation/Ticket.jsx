import { RES_STATUS, slotById } from '../../lib/constants'
import { formatDateShort } from '../../lib/format'
import { ResStatus } from '../../components/ui/Pill'
import QR from './qr'

/** E-ticket kuning bergaris sobek. Dipakai di halaman tiket dan hasil Cek Tiket. */
export default function Ticket({ res, showQR = true, className = '' }) {
  const slot = slotById(res.slot)
  const inactive = res.status === 'dibatalkan' || res.status === 'no_show'
  return (
    <article
      aria-label={`E-ticket ${res.code}`}
      className={`ticket-print relative border-2 border-ink bg-yellow shadow-card ${inactive ? 'opacity-80' : ''} ${className}`}
    >
      <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:p-7">
        <div>
          <p className="font-serif text-xl font-bold">Your table</p>
          <p className="font-display text-[88px] leading-[.9] sm:text-[120px]">{res.table}</p>
          <p className="label-caps mt-1 text-[11px]">
            {res.guests} tamu · {res.status === 'check_in' ? 'sudah check-in' : 'meja ditahan 15 menit'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 self-center">
          <div className="col-span-2">
            <p className="label-caps text-[10px]">Kode reservasi</p>
            <p className="font-display text-3xl leading-none sm:text-4xl">{res.code}</p>
          </div>
          <div>
            <p className="label-caps text-[10px]">Nama</p>
            <p className="font-display text-xl uppercase">{res.name}</p>
          </div>
          <div>
            <p className="label-caps text-[10px]">Tanggal</p>
            <p className="font-display text-xl uppercase">{formatDateShort(res.date)}</p>
          </div>
          <div>
            <p className="label-caps text-[10px]">Jam</p>
            <p className="font-display text-xl uppercase">{slot?.range} WIB</p>
          </div>
          <div>
            <p className="label-caps text-[10px]">Meja</p>
            <p className="font-display text-xl uppercase">
              {res.table} · {res.guests} tamu
            </p>
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <span
              className="label-caps border-[1.5px] border-ink px-2.5 py-1 text-[11px]"
              style={{ background: RES_STATUS[res.status]?.bg, color: RES_STATUS[res.status]?.fg }}
            >
              {RES_STATUS[res.status]?.label}
            </span>
          </div>
        </div>
      </div>
      <div className="ticket-edge relative h-0 border-t-2 border-dashed border-ink" aria-hidden="true" />
      <div className="flex items-center justify-between gap-4 bg-beige p-4 sm:px-7">
        <div className="min-w-0">
          <p className="text-[13px] font-medium">Tunjukkan e-ticket ini ke kasir.</p>
          <p className="text-[13px] text-muted">Pesan menu langsung di kasir.</p>
          <div className="mt-2 sm:hidden">
            <ResStatus status={res.status} />
          </div>
        </div>
        {showQR && <QR value={res.code} size={96} />}
      </div>
    </article>
  )
}
