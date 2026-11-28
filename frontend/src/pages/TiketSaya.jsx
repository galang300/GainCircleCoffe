import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import Button from '../components/ui/Button'
import { EmptyState, ErrorState, Pagination, SkeletonRows } from '../components/ui/Feedback'
import { ResStatus } from '../components/ui/Pill'
import { StickerBell } from '../components/brand/Stickers'
import { reservationApi } from '../lib/api'
import { slotById } from '../lib/constants'
import { firstName, formatDateShort } from '../lib/format'
import { useAsync, useDocTitle } from '../lib/hooks'

function Card({ r }) {
  return (
    <li className="flex flex-col gap-3 border-2 border-ink bg-card p-5 shadow-cardsm sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-display text-2xl uppercase">{formatDateShort(r.date)}</p>
          <ResStatus status={r.status} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {slotById(r.slot)?.range} WIB · {r.guests} tamu
        </p>
        <p className="label-caps mt-2 text-xs">{r.code}</p>
      </div>
      <p className="font-display text-5xl leading-none text-orange" aria-label={`Meja ${r.table}`}>
        {r.table}
      </p>
      <Button to={`/reservasi/tiket/${r.code}`} variant="yellow" size="sm">
        Lihat e-ticket
      </Button>
    </li>
  )
}
function Section({ title, status, empty }) {
  const [page, setPage] = useState(1)
  const q = useAsync(() => reservationApi.mine({ status, page }), [status, page])
  return (
    <section aria-label={title} className="mt-10">
      <h2 className="border-b-[3px] border-ink pb-2 text-4xl">{title}</h2>
      <div className="mt-5">
        {q.loading ? (
          <SkeletonRows rows={2} />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={q.reload} compact />
        ) : q.data.items.length === 0 ? (
          empty
        ) : (
          <>
            <ul className="space-y-4">
              {q.data.items.map((r) => (
                <Card key={r.code} r={r} />
              ))}
            </ul>
            {q.data.total_pages > 1 && (
              <Pagination
                page={page}
                pages={q.data.total_pages}
                onPage={setPage}
                info={`${q.data.total} tiket`}
              />
            )}
          </>
        )}
      </div>
    </section>
  )
}
export default function TiketSaya() {
  useDocTitle('Tiket saya')
  const { user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <div className="container-page py-10 pb-20 md:py-14">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-serif text-xl">Halo, {firstName(user.name)}</p>
          <h1 className="mt-1 text-[64px] leading-[.95] sm:text-[104px]">Tiket saya</h1>
          <p className="mt-3 max-w-md">
            Semua reservasi di akunmu ada di sini. Tunjukkan e-ticket ke kasir saat datang.
          </p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="hidden sm:block">
            <StickerBell size={96} />
          </div>
          <Button
            variant="white"
            size="sm"
            onClick={async () => {
              await logout()
              nav('/')
            }}
          >
            Keluar
          </Button>
        </div>
      </div>
      <Section
        title="Akan datang"
        status="upcoming"
        empty={
          <EmptyState
            symbol="0"
            title="Belum ada reservasi"
            text="Pilih tanggal, jam, dan meja. E-ticket langsung terbit."
            action={<Button to="/reservasi">Reservasi meja</Button>}
          />
        }
      />
      <Section
        title="Riwayat"
        status="history"
        empty={
          <p className="text-sm text-muted">
            Riwayat reservasi (selesai, dibatalkan, no-show) akan muncul di sini.{' '}
            <Link className="underline" to="/reservasi">
              Buat reservasi
            </Link>
          </p>
        }
      />
    </div>
  )
}
